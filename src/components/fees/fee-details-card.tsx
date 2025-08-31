
'use client';

import { useState, useRef, useEffect } from 'react';
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
import { fees as allFees } from '@/lib/data';


interface FeeDetailsCardProps {
    family: Family;
    students: Student[];
    fees: Fee[];
}

export function FeeDetailsCard({ family, students, fees: initialFees }: FeeDetailsCardProps) {
    const { toast } = useToast();
    const [fees, setFees] = useState(initialFees);

    const unpaidFees = fees.filter(f => f.status === 'Unpaid');
    const totalDues = unpaidFees.reduce((acc, fee) => acc + fee.amount, 0);

    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [isPrinting, setIsPrinting] = useState(false);
    
    useEffect(() => {
        setPaidAmount(totalDues);
    }, [totalDues]);

    const remainingDues = totalDues - paidAmount;

    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        onAfterPrint: () => setIsPrinting(false),
    });

    const triggerPrint = () => {
        if (paidAmount <= 0) {
            toast({
                title: 'Invalid Amount',
                description: 'Paid amount must be greater than zero.',
                variant: 'destructive',
            });
            return;
        }
        if (paidAmount > totalDues) {
            toast({
                title: 'Invalid Amount',
                description: 'Paid amount cannot be greater than total dues.',
                variant: 'destructive',
            });
            return;
        }

        // This is a mock update. In a real app, you'd send this to an API.
        const now = new Date();
        let amountToSettle = paidAmount;

        const updatedFees = fees.map(fee => {
            if (fee.status === 'Unpaid' && amountToSettle > 0) {
                const settleAmount = Math.min(amountToSettle, fee.amount);
                // For simplicity, we mark the whole challan as paid if any amount is paid.
                // A real app might handle partial payments.
                if(paidAmount >= fee.amount) {
                        amountToSettle -= settleAmount;
                    return { ...fee, status: 'Paid' as 'Paid', paymentDate: now.toISOString().split('T')[0] };
                }
            }
            return fee;
        });
        
        // This is where we would typically update a global state or database
        // For now, we update the local component state to reflect the change
        setFees(updatedFees);
        
        // Also updating the global mock data for persistence across navigation
        unpaidFees.forEach(fee => {
            if(paidAmount >= fee.amount) {
                const feeInGlobalData = allFees.find(f => f.id === fee.id);
                if (feeInGlobalData) {
                    feeInGlobalData.status = 'Paid';
                    feeInGlobalData.paymentDate = new Date().toISOString().split('T')[0];
                }
            }
        });


        toast({
            title: 'Fee Collected',
            description: `PKR ${paidAmount.toLocaleString()} collected for Family ${family.id}.`,
        });

        setIsPrinting(true);
    }
    
    useEffect(() => {
        if (isPrinting) {
            handlePrint();
        }
    }, [isPrinting, handlePrint]);


    return (
        <>
            <div style={{ display: 'none' }}>
                {isPrinting && (
                     <div ref={printRef}>
                        <FeeReceipt
                            family={family}
                            students={students}
                            fees={unpaidFees.filter(fee => paidAmount >= fee.amount)}
                            totalDues={totalDues}
                            paidAmount={paidAmount}
                            remainingDues={remainingDues}
                        />
                    </div>
                )}
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
                            <Button variant="outline">Add Other Charges</Button>
                            <Button disabled={totalDues === 0 || paidAmount <= 0} onClick={triggerPrint}>Collect Fee &amp; Print Receipt</Button>
                         </div>
                    </div>

                </CardContent>
            </Card>
        </>
    );
}
