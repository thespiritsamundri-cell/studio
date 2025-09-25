
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import type { Family, Student, Fee } from '@/lib/types';
import { FeeReceipt } from '@/components/reports/fee-receipt';
import { Loader2, School } from 'lucide-react';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Image from 'next/image';

export default function PublicReceiptPage() {
    const params = useParams();
    const { id } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [family, setFamily] = useState<Family | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [paidFees, setPaidFees] = useState<Fee[]>([]);
    const [totalDues, setTotalDues] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [remainingDues, setRemainingDues] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [qrCodeDataUri, setQrCodeDataUri] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !isSettingsInitialized) {
            return;
        }

        const loadReceiptData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const receiptId = id as string;

                // 1. Fetch only the fees for this specific receipt
                const feesQuery = query(collection(db, "fees"), where("receiptId", "==", receiptId), where("status", "==", "Paid"));
                const feesSnapshot = await getDocs(feesQuery);

                if (feesSnapshot.empty) {
                    throw new Error(`Receipt with ID "${receiptId}" not found.`);
                }

                const transactionFees = feesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
                
                const familyId = transactionFees[0].familyId;
                if (!familyId) {
                    throw new Error("Family ID is missing from fee records.");
                }

                // 2. Fetch the associated family and students
                const familyQuery = query(collection(db, "families"), where("id", "==", familyId));
                const studentsQuery = query(collection(db, "students"), where("familyId", "==", familyId));
                const allFamilyFeesQuery = query(collection(db, "fees"), where("familyId", "==", familyId));

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
                const currentRemainingDues = allFamilyFees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
                const totalDuesBeforeTx = currentRemainingDues + currentPaidAmount;
                
                setPaidFees(transactionFees);
                setFamily(foundFamily);
                setStudents(familyStudents);
                setPaidAmount(currentPaidAmount);
                setTotalDues(totalDuesBeforeTx);
                setRemainingDues(currentRemainingDues);
                setPaymentMethod(transactionFees[0].paymentMethod || 'N/A');

                // 3. Generate QR code
                const receiptUrl = `${window.location.origin}/vouchers/${receiptId}`;
                try {
                    const qrCodeResult = await generateQrCode({ content: receiptUrl });
                    setQrCodeDataUri(qrCodeResult.qrCodeDataUri);
                } catch (qrError) {
                    console.error("QR Code generation failed for public receipt:", qrError);
                    // Don't fail the whole page load for a QR code
                }

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
    
    if (!family) {
        // This condition is mostly covered by the error state, but as a fallback.
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
                    family={family}
                    students={students}
                    fees={paidFees}
                    totalDues={totalDues}
                    paidAmount={paidAmount}
                    remainingDues={remainingDues}
                    settings={settings}
                    paymentMethod={paymentMethod}
                    printType="normal"
                    receiptId={id as string}
                    qrCodeDataUri={qrCodeDataUri}
                />
            </div>
        </div>
    );
}
