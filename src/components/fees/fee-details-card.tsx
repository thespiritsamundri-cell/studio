
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Family, Student, Fee } from '@/lib/types';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { FeeReceipt } from '../reports/fee-receipt';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';


interface FeeDetailsCardProps {
    family: Family;
    students: Student[];
    fees: Fee[];
    onUpdateFee: (id: string, fee: Fee) => void;
}

export function FeeDetailsCard({ family, students, fees: initialFees, onUpdateFee }: FeeDetailsCardProps) {
    const { toast } = useToast();
    const [fees, setFees] = useState(initialFees);
    const [receiptDataForPrint, setReceiptDataForPrint] = useState<{fees: Fee[], paidAmount: number, totalDues: number, remainingDues: number} | null>(null);
    const printRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setFees(initialFees);
        setReceiptDataForPrint(null);
    }, [initialFees, family.id]);

    const unpaidFees = fees.filter(f => f.status === 'Unpaid');
    const totalDues = unpaidFees.reduce((acc, fee) => acc + fee.amount, 0);

    const [paidAmount, setPaidAmount] = useState<number>(0);
    
    useEffect(() => {
        // Automatically set paid amount to total dues when family changes
        setPaidAmount(totalDues);
    }, [totalDues]);


    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => {
            setReceiptDataForPrint(null); // Clean up after printing
        },
    });

    useEffect(() => {
        if (receiptDataForPrint) {
           setTimeout(() => handlePrint(), 0);
        }
    }, [receiptDataForPrint, handlePrint]);

    const remainingDues = totalDues - paidAmount;

    const handleCollectFee = () => {
        if (paidAmount <= 0) {
            toast({ title: 'Invalid Amount', description: 'Paid amount must be greater than zero.', variant: 'destructive' });
            return;
        }
        if (paidAmount > totalDues) {
            toast({ title: 'Invalid Amount', description: 'Paid amount cannot be greater than total dues.', variant: 'destructive' });
            return;
        }

        let amountToSettle = paidAmount;
        const newlyPaidFees: Fee[] = [];
        const updatedLocalFees = [...fees]; 

        // Sort unpaid fees by date to ensure oldest are paid first
        const sortedUnpaidFees = [...unpaidFees].sort((a,b) => {
            // A simple way to sort by month, not perfect for cross-year but works for typical school years
            const monthA = new Date(Date.parse(a.month +" 1, 2012")).getMonth();
            const monthB = new Date(Date.parse(b.month +" 1, 2012")).getMonth();
            if (a.year !== b.year) {
                return a.year - b.year;
            }
            return monthA - monthB;
        });

        for (const fee of sortedUnpaidFees) {
            if (amountToSettle >= fee.amount) {
                amountToSettle -= fee.amount;
                
                const paidFee: Fee = { ...fee, status: 'Paid', paymentDate: new Date().toISOString().split('T')[0] };
                newlyPaidFees.push(paidFee);

                const indexInLocal = updatedLocalFees.findIndex(f => f.id === fee.id);
                if (indexInLocal !== -1) {
                    updatedLocalFees[indexInLocal] = paidFee;
                }

                // Update global state via the passed function
                onUpdateFee(fee.id, paidFee);
            } else {
                // Stop if the paid amount doesn't cover the full fee for the month
                break; 
            }
        }
        
        toast({
            title: 'Fee Collected',
            description: `PKR ${paidAmount.toLocaleString()} collected for Family ${family.id}.`,
        });
        
        // Update the local state to re-render the component
        setFees(updatedLocalFees);
        // Reset paid amount for the next transaction
        const newDues = updatedLocalFees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
        setPaidAmount(newDues);
        
        // Trigger the printing of the receipt with the fees that were just paid
        triggerPrint(newlyPaidFees, paidAmount, newlyPaidFees.reduce((acc, f) => acc + f.amount, 0), newDues);
    };

    const triggerPrint = (paidFeesForReceipt: Fee[], collectedAmount: number, totalPaid: number, newRemainingDues: number) => {
        if (collectedAmount === 0 && unpaidFees.length === 0) {
             toast({ title: 'No Dues', description: 'There are no outstanding fees to generate a receipt for.', variant: 'destructive' });
            return;
        }
        setReceiptDataForPrint({
            fees: paidFeesForReceipt.length > 0 ? paidFeesForReceipt : unpaidFees,
            paidAmount: collectedAmount > 0 ? totalPaid : paidAmount,
            totalDues: paidFeesForReceipt.length > 0 ? totalPaid : totalDues,
            remainingDues: paidFeesForReceipt.length > 0 ? newRemainingDues : remainingDues,
        });
    };


    return (
        <>
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    {receiptDataForPrint && (
                        <FeeReceipt
                            family={family}
                            students={students}
                            fees={receiptDataForPrint.fees}
                            totalDues={receiptDataForPrint.totalDues}
                            paidAmount={receiptDataForPrint.paidAmount}
                            remainingDues={receiptDataForPrint.remainingDues}
                        />
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle>Fee Details for Family: {family.id}</CardTitle>
                            <CardDescription>Father&apos;s Name: {family.fatherName} | Phone: {family.phone}</CardDescription>
                        </div>
                        <div className='text-right'>
                            <p className='text-sm text-muted-foreground'>Total Dues</p>
                            <p className='text-2xl font-bold text-destructive'>PKR {totalDues.toLocaleString()}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-2">Students</h3>
                    <div className="border rounded-md mb-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.id}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.class}</TableCell>
                                        <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{student.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">Outstanding Fee Challans</h3>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Challan ID</TableHead>
                                    <TableHead>Month/Year</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount (PKR)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unpaidFees.length > 0 ? (
                                    unpaidFees.map(fee => (
                                        <TableRow key={fee.id}>
                                            <TableCell>{fee.id}</TableCell>
                                            <TableCell>{fee.month}, {fee.year}</TableCell>
                                            <TableCell><Badge variant="destructive">{fee.status}</Badge></TableCell>
                                            <TableCell className="text-right font-medium">{fee.amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-10">No outstanding fees found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <Separator className="my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                         <div className="space-y-4 md:col-span-2">
                             <h3 className="text-lg font-semibold">Payment Collection</h3>
                             <div className="grid grid-cols-3 gap-4">
                                 <div className="space-y-2">
                                     <Label>Total Dues (PKR)</Label>
                                     <Input value={totalDues.toLocaleString()} disabled className="font-bold" />
                                 </div>
                                 <div className="space-y-2">
                                     <Label htmlFor="paid-amount">Amount Paid (PKR)</Label>
                                     <Input
                                        id="paid-amount"
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                                        className="font-bold border-primary"
                                        />
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Remaining Dues (PKR)</Label>
                                     <Input value={remainingDues.toLocaleString()} disabled className="font-bold text-destructive" />
                                 </div>
                             </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            <Button disabled={totalDues === 0 || paidAmount <= 0} onClick={handleCollectFee}>Collect Fee</Button>
                            <Button variant="outline" onClick={() => triggerPrint([], 0, 0, totalDues)}><Printer className="h-4 w-4 mr-2" />Print Receipt</Button>
                         </div>
                    </div>

                </CardContent>
            </Card>
        </>
    );
}
