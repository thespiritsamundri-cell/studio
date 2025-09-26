
'use server';
/**
 * @fileOverview A PUBLIC flow to fetch all data required for a fee receipt.
 * This flow is designed to be called from a public-facing page and does not require authentication.
 *
 * - getPublicReceiptData - Fetches family, student, and fee details for a given receipt ID.
 * - ReceiptDataRequest - The input type for the getPublicReceiptData function.
 * - ReceiptData - The return type for the getPublicReceiptData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import type { Family, Student, Fee, SchoolSettings } from '@/lib/types';
import { generateQrCode } from '@/ai/flows/generate-qr-code';

// This is a separate, un-authenticated DB instance for public access.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtnV9kiSJ-NFLfI6pG4LDvvLcjpRh_jtM",
  authDomain: "educentral-mxfgr.firebaseapp.com",
  projectId: "educentral-mxfgr",
  storageBucket: "educentral-mxfgr.appspot.com",
  messagingSenderId: "93439797301",
  appId: "1:93439797301:web:c0cd1d46e7588e4df4297c"
};

const publicApp = !getApps().some(app => app.name === 'public') ? initializeApp(firebaseConfig, 'public') : getApp('public');
const publicDb = getFirestore(publicApp);


const ReceiptDataRequestSchema = z.object({
  receiptId: z.string().describe('The unique identifier for the fee receipt.'),
});

export const ReceiptDataSchema = z.object({
  family: z.any().describe('The family object.'),
  students: z.array(z.any()).describe('An array of student objects for the family.'),
  paidFees: z.array(z.any()).describe('The specific fee records paid in this transaction.'),
  totalDues: z.number().describe('The total dues of the family BEFORE this transaction.'),
  paidAmount: z.number().describe('The amount paid in this transaction.'),
  remainingDues: z.number().describe('The remaining balance after this transaction.'),
  paymentMethod: z.string().describe('The method of payment.'),
  qrCodeDataUri: z.string().describe('The data URI for the QR code.'),
});

export type ReceiptDataRequest = z.infer<typeof ReceiptDataRequestSchema>;
export type ReceiptData = z.infer<typeof ReceiptDataSchema>;

export async function getPublicReceiptData(input: ReceiptDataRequest): Promise<ReceiptData | null> {
  return getPublicReceiptDataFlow(input);
}

const getPublicReceiptDataFlow = ai.defineFlow(
  {
    name: 'getPublicReceiptDataFlow',
    inputSchema: ReceiptDataRequestSchema,
    outputSchema: z.nullable(ReceiptDataSchema),
  },
  async ({ receiptId }) => {
    try {
      // 1. Fetch only the fees for this specific receipt
      const feesQuery = query(collection(publicDb, "fees"), where("receiptId", "==", receiptId), where("status", "==", "Paid"));
      const feesSnapshot = await getDocs(feesQuery);

      if (feesSnapshot.empty) {
        console.warn(`No paid fee records found for receiptId: ${receiptId}`);
        return null;
      }

      const transactionFees = feesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
      
      const familyId = transactionFees[0]?.familyId;
      if (!familyId) {
        console.error(`Family ID is missing from fee records for receiptId: ${receiptId}`);
        return null;
      }

      // 2. Fetch the associated family, all students, and all fees for that family
      const familyQuery = query(collection(publicDb, "families"), where("id", "==", familyId));
      const studentsQuery = query(collection(publicDb, "students"), where("familyId", "==", familyId));
      const allFamilyFeesQuery = query(collection(publicDb, "fees"), where("familyId", "==", familyId));

      const [familySnapshot, studentsSnapshot, allFamilyFeesSnapshot] = await Promise.all([
          getDocs(familyQuery),
          getDocs(studentsQuery),
          getDocs(allFamilyFeesQuery)
      ]);

      if (familySnapshot.empty) {
        console.error(`Family with ID "${familyId}" not found.`);
        return null;
      }

      const foundFamily = { id: familySnapshot.docs[0].id, ...familySnapshot.docs[0].data() } as Family;
      const familyStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      const allFamilyFees = allFamilyFeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
      
      const currentPaidAmount = transactionFees.reduce((acc, fee) => acc + fee.amount, 0);
      
      // Calculate remaining dues based on ALL fees for the family, not just the ones in this transaction
      const totalUnpaidAmount = allFamilyFees
        .filter(f => f.status === 'Unpaid')
        .reduce((acc, fee) => acc + fee.amount, 0);

      const totalDuesBeforeTx = totalUnpaidAmount + currentPaidAmount;
      
      let qrCodeDataUri = '';
       try {
        const receiptUrl = process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/receipt/${receiptId}` : `http://localhost:9002/receipt/${receiptId}`;
        const qrCodeResult = await generateQrCode({ content: receiptUrl });
        qrCodeDataUri = qrCodeResult.qrCodeDataUri;
      } catch (qrError) {
        console.error("QR Code generation failed for public receipt:", qrError);
      }

      return {
        family: foundFamily,
        students: familyStudents,
        paidFees: transactionFees,
        totalDues: totalDuesBeforeTx,
        paidAmount: currentPaidAmount,
        remainingDues: totalUnpaidAmount,
        paymentMethod: transactionFees[0]?.paymentMethod || 'N/A',
        qrCodeDataUri: qrCodeDataUri,
      };

    } catch (err) {
      console.error('Error in getPublicReceiptDataFlow:', err);
      return null;
    }
  }
);
