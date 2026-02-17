
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import { FeeReceipt } from '@/components/reports/fee-receipt';
import { Loader2, School } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { Receipt } from '@/lib/types';
import Image from 'next/image';

// Public Firebase config - ensure this is configured for your public-facing project/data
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

export default function PublicReceiptPage() {
    const params = useParams();
    const { id } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [receiptData, setReceiptData] = useState<Receipt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !isSettingsInitialized) return;

        const loadReceiptData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const receiptId = id as string;
                
                // Fetch the single public receipt document
                const receiptRef = doc(publicDb, "receipts", receiptId);
                const receiptDoc = await getDoc(receiptRef);

                if (!receiptDoc.exists()) {
                    throw new Error(`Receipt with ID "${receiptId}" not found or has not been made public.`);
                }
                
                const data = receiptDoc.data() as Receipt;
                setReceiptData(data);

            } catch (err: any) {
                console.error("Error loading public receipt data:", err);
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
    
    if (!receiptData) {
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
                    receiptId={id as string}
                    qrCodeDataUri={receiptData.qrCodeDataUri}
                />
            </div>
        </div>
    );
}
