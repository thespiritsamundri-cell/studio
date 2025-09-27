

// This file is no longer used for the public receipt page,
// as data fetching has been moved to the client-side to prevent
// server-side authentication issues.
// It is kept here for reference or potential future use in a different context.
// The public receipt page now directly fetches data from Firestore on the client.
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
      // This flow is deprecated in favor of client-side fetching for public pages.
      // Returning null to prevent accidental use.
      console.warn("DEPRECATED: getPublicReceiptDataFlow was called. Public data should be fetched client-side.");
      return null;
    } catch (err) {
      console.error('Error in getPublicReceiptDataFlow:', err);
      return null;
    }
  }
);
