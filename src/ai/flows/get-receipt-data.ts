
'use server';
/**
 * @fileOverview A secure server-side flow to fetch all data required for a public fee receipt.
 *
 * - getReceiptData - Fetches family, student, and fee details for a given receipt ID.
 * - ReceiptDataRequest - The input type for the getReceiptData function.
 * - ReceiptData - The return type for the getReceiptData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Family, Student, Fee } from '@/lib/types';
import { generateQrCode } from '@/ai/flows/generate-qr-code';

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


export async function getReceiptData(input: ReceiptDataRequest): Promise<ReceiptData | null> {
  return getReceiptDataFlow(input);
}


const getReceiptDataFlow = ai.defineFlow(
  {
    name: 'getReceiptDataFlow',
    inputSchema: ReceiptDataRequestSchema,
    outputSchema: z.nullable(ReceiptDataSchema),
  },
  async ({ receiptId }) => {
    try {
      // 1. Fetch only the fees for this specific receipt
      const feesQuery = query(collection(db, "fees"), where("receiptId", "==", receiptId), where("status", "==", "Paid"));
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
      const familyDoc = await getDocs(query(collection(db, "families"), where("id", "==", familyId)));
      const studentsQuery = query(collection(db, "students"), where("familyId", "==", familyId));
      const allFamilyFeesQuery = query(collection(db, "fees"), where("familyId", "==", familyId));

      const [studentsSnapshot, allFamilyFeesSnapshot] = await Promise.all([
          getDocs(studentsQuery),
          getDocs(allFamilyFeesQuery)
      ]);

      if (familyDoc.empty) {
        console.error(`Family with ID "${familyId}" not found.`);
        return null;
      }

      const foundFamily = { id: familyDoc.docs[0].id, ...familyDoc.docs[0].data() } as Family;
      const familyStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      const allFamilyFees = allFamilyFeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
      
      const currentPaidAmount = transactionFees.reduce((acc, fee) => acc + fee.amount, 0);
      const currentRemainingDues = allFamilyFees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
      const totalDuesBeforeTx = currentRemainingDues + currentPaidAmount;
      
      // 3. Generate QR code (server-side)
      let qrCodeDataUri = '';
      try {
        // Note: This relies on the environment having the correct base URL if run on a server.
        // For local development, it will generate a localhost URL.
        const receiptUrl = process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/receipt/${receiptId}` : `http://localhost:9002/receipt/${receiptId}`;
        const qrCodeResult = await generateQrCode({ content: receiptUrl });
        qrCodeDataUri = qrCodeResult.qrCodeDataUri;
      } catch (qrError) {
        console.error("QR Code generation failed for public receipt:", qrError);
        // Don't fail the whole flow for a QR code
      }

      return {
        family: foundFamily,
        students: familyStudents,
        paidFees: transactionFees,
        totalDues: totalDuesBeforeTx,
        paidAmount: currentPaidAmount,
        remainingDues: currentRemainingDues,
        paymentMethod: transactionFees[0]?.paymentMethod || 'N/A',
        qrCodeDataUri: qrCodeDataUri,
      };

    } catch (err) {
      console.error('Error in getReceiptDataFlow:', err);
      // It's important to return null or throw an error that the client can handle.
      // Returning null is often safer for public-facing pages.
      return null;
    }
  }
);
