
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import { FeeReceipt } from '@/components/reports/fee-receipt';
import { Loader2, School } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc } from 'firebase/firestore';
import type { Family, Student, Fee } from '@/lib/types';
import Image from 'next/image';

interface ReceiptData {
  family: Family;
  students: Student[];
  paidFees: Fee[];
  totalDues: number;
  paidAmount: number;
  remainingDues: number;
  paymentMethod: string;
  qrCodeDataUri: string;
}

// Public Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtnV9kiSJ-NFLfI6pG4LDvvLcjpRh_jtM",
  authDomain: "educentral-mxfgr.firebaseapp.com",
  projectId: "educentral-mxfgr",
  storageBucket: "educentral-mxfgr.appspot.com",
  messagingSenderId: "93439797301",
  appId: "1:93439797301:web:c0cd1d46e7588e4df4297c"
};

const publicApp = !getApps().some(app => app.name === 'public-receipt') ? initializeApp(firebaseConfig, 'public-receipt') : getApp('public-receipt');
const publicDb = getFirestore(publicApp);

async function generateQrCodeClient(content: string): Promise<string> {
    let qrCodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(content)}&code=QRCode&dpi=96&eclevel=H`;
    const response = await fetch(qrCodeUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch QR code: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/png;base64,${base64}`;
}

export default function PublicReceiptPage() {
    const params = useParams();
    const { id } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !isSettingsInitialized) return;

        const loadReceiptData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const receiptId = id as string;
                
                // 1. Fetch the paid fees for this receipt
                const feesQuery = query(collection(publicDb, "fees"), where("receiptId", "==", receiptId), where("status", "==", "Paid"));
                const feesSnapshot = await getDocs(feesQuery);

                if (feesSnapshot.empty) {
                    throw new Error(`Receipt with ID "${receiptId}" not found or has no paid fees.`);
                }
                const transactionFees = feesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
                
                const familyId = transactionFees[0]?.familyId;
                if (!familyId) {
                    throw new Error("Family ID is missing from receipt records.");
                }

                // 2. Fetch all other data for the family
                const familyQuery = query(collection(publicDb, "families"), where("id", "==", familyId));
                const studentsQuery = query(collection(publicDb, "students"), where("familyId", "==", familyId));
                const allFamilyFeesQuery = query(collection(publicDb, "fees"), where("familyId", "==", familyId));
                
                const [familySnapshot, studentsSnapshot, allFamilyFeesSnapshot] = await Promise.all([
                    getDocs(familyQuery),
                    getDocs(studentsQuery),
                    getDocs(allFamilyFeesQuery)
                ]);

                if (familySnapshot.empty) {
                    throw new Error(`Family with ID "${familyId}" not found.`);
                }
                const foundFamily = { id: familySnapshot.docs[0].id, ...familySnapshot.docs[0].data() } as Family;
                const familyStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
                const allFamilyFees = allFamilyFeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
                
                const currentPaidAmount = transactionFees.reduce((acc, fee) => acc + fee.amount, 0);
                const totalUnpaidAmount = allFamilyFees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
                const totalDuesBeforeTx = totalUnpaidAmount + currentPaidAmount;
                
                let qrCodeDataUri = '';
                try {
                    const receiptUrl = window.location.href; // Use current URL for QR code
                    qrCodeDataUri = await generateQrCodeClient(receiptUrl);
                } catch (qrError) {
                    console.error("QR Code generation failed for public receipt:", qrError);
                }

                setReceiptData({
                    family: foundFamily,
                    students: familyStudents,
                    paidFees: transactionFees,
                    totalDues: totalDuesBeforeTx,
                    paidAmount: currentPaidAmount,
                    remainingDues: totalUnpaidAmount,
                    paymentMethod: transactionFees[0]?.paymentMethod || 'N/A',
                    qrCodeDataUri: qrCodeDataUri,
                });

            } catch (err: any) {
                console.error("Error loading receipt data:", err);
                setError(err.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadReceiptData();

    }, [id, isSettingsInitialized]);

    if (isLoading || !isSettingsInitialized) {
        return (
            <div className="flex flex-col h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                {settings.schoolLogo ? (
                    <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="rounded-full mb-4"/>
                ) : (
                    <School className="h-12 w-12 text-primary mb-4" />
                )}
                <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-lg">Please wait...</p>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive text-center p-4">{error}</p>
            </div>
        );
    }
    
    if (!receiptData || !receiptData.family) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive">Receipt data could not be loaded.</p>
            </div>
        )
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 sm:p-8 flex justify-center items-start min-h-screen">
           <div className="w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden">
                <FeeReceipt
                    family={receiptData.family}
                    students={receiptData.students}
                    fees={receiptData.paidFees}
                    totalDues={receiptData.totalDues}
                    paidAmount={receiptData.paidAmount}
                    remainingDues={receiptData.remainingDues}
                    settings={settings}
                    paymentMethod={receiptData.paymentMethod}
                    printType="normal"
                    receiptId={id as string}
                    qrCodeDataUri={receiptData.qrCodeDataUri}
                />
            </div>
        </div>
    );
}
