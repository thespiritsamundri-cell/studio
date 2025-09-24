
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useData } from '@/context/data-context';
import { useSettings } from '@/context/settings-context';
import type { Family, Student, Fee } from '@/lib/types';
import { FeeReceipt } from '@/components/reports/fee-receipt';
import { Loader2 } from 'lucide-react';
import { generateBarcode } from '@/services/barcode-service';

export default function PublicReceiptPage() {
    const params = useParams();
    const { id } = params;
    const { fees: allFees, families, students: allStudents } = useData();
    const { settings } = useSettings();
    
    const [family, setFamily] = useState<Family | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [paidFees, setPaidFees] = useState<Fee[]>([]);
    const [totalDues, setTotalDues] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [remainingDues, setRemainingDues] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [barcodeDataUri, setBarcodeDataUri] = useState('');

    useEffect(() => {
        if (!id || !allFees.length || !families.length || !allStudents.length) {
            if (allFees.length > 0) setIsLoading(false);
            return;
        };

        const loadReceiptData = async () => {
            const receiptId = id as string;

            const transactionFees = allFees.filter(f => f.receiptId === receiptId && f.status === 'Paid');
            
            if (transactionFees.length === 0) {
                setIsLoading(false);
                return;
            }

            const familyId = transactionFees[0].familyId;
            const foundFamily = families.find(f => f.id === familyId);
            const familyStudents = allStudents.filter(s => s.familyId === familyId);
            
            const currentPaidAmount = transactionFees.reduce((acc, fee) => acc + fee.amount, 0);

            // To calculate the balance correctly, we need the state of dues *before* this transaction.
            const allFamilyFees = allFees.filter(f => f.familyId === familyId);
            const currentRemainingDues = allFamilyFees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
            
            const totalDuesBeforeTx = currentRemainingDues + currentPaidAmount;
            
            setPaidFees(transactionFees);
            setFamily(foundFamily || null);
            setStudents(familyStudents);
            setPaidAmount(currentPaidAmount);
            setTotalDues(totalDuesBeforeTx);
            setRemainingDues(currentRemainingDues);
            setPaymentMethod(transactionFees[0].paymentMethod || 'N/A');

            // Generate barcode
            const receiptUrl = `${window.location.origin}/receipt/${receiptId}`;
            try {
                const barcodeResult = await generateBarcode({ content: receiptUrl });
                setBarcodeDataUri(barcodeResult.barcodeDataUri);
            } catch (error) {
                console.error("Barcode generation failed for public receipt:", error);
            }

            setIsLoading(false);
        };

        loadReceiptData();

    }, [id, allFees, families, allStudents]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading Receipt...</p>
            </div>
        );
    }
    
    if (!family) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive">Receipt with ID "{id}" not found.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-200 p-4 sm:p-8 flex justify-center items-start min-h-screen">
           <div className="w-full max-w-4xl bg-white shadow-lg">
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
                    barcodeDataUri={barcodeDataUri}
                />
            </div>
        </div>
    );
}

