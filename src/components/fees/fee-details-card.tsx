
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
import { Printer } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import type { SchoolSettings } from '@/context/settings-context';


interface FeeDetailsCardProps {
    family: Family;
    students: Student[];
    fees: Fee[];
    onUpdateFee: (id: string, fee: Fee) => void;
    settings: SchoolSettings;
}

export function FeeDetailsCard({ family, students, fees: initialFees, onUpdateFee, settings }: FeeDetailsCardProps) {
    const { toast } = useToast();
    const [fees, setFees] = useState(initialFees);
    
    useEffect(() => {
        setFees(initialFees);
    }, [initialFees, family.id]);

    const unpaidFees = fees.filter(f => f.status === 'Unpaid');
    const totalDues = unpaidFees.reduce((acc, fee) => acc + fee.amount, 0);

    const [paidAmount, setPaidAmount] = useState<number>(0);
    
    useEffect(() => {
        setPaidAmount(totalDues);
    }, [totalDues]);

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

        const sortedUnpaidFees = [...unpaidFees].sort((a,b) => {
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

                onUpdateFee(fee.id, paidFee);
            } else {
                break; 
            }
        }
        
        const collectedAmount = paidAmount - amountToSettle;
        
        toast({
            title: 'Fee Collected',
            description: `PKR ${collectedAmount.toLocaleString()} collected for Family ${family.id}.`,
        });
        
        // Update local state to re-render the component with new data
        setFees(updatedLocalFees);
        const newDues = updatedLocalFees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
        setPaidAmount(newDues);
        
        triggerPrint(newlyPaidFees, collectedAmount, newDues);
    };

    const triggerPrint = (paidFeesForReceipt: Fee[], collectedAmount: number, newRemainingDues: number) => {
        if (collectedAmount === 0 && unpaidFees.length === 0) {
             toast({ title: 'No Dues', description: 'There are no outstanding fees to generate a receipt for.', variant: 'destructive' });
            return;
        }
        
        const totalPaidOnReceipt = paidFeesForReceipt.reduce((acc, f) => acc + f.amount, 0);

        const receiptData = {
            fees: paidFeesForReceipt.length > 0 ? paidFeesForReceipt : unpaidFees,
            paidAmount: collectedAmount > 0 ? totalPaidOnReceipt : 0,
            totalDues: paidFeesForReceipt.length > 0 ? totalPaidOnReceipt : totalDues,
            remainingDues: paidFeesForReceipt.length > 0 ? newRemainingDues : remainingDues,
        };

        const printContent = renderToString(
            <FeeReceipt
                family={family}
                students={students}
                fees={receiptData.fees}
                totalDues={receiptData.totalDues}
                paidAmount={receiptData.paidAmount}
                remainingDues={receiptData.remainingDues}
                settings={settings}
            />
        );
        const printWindow = window.open('', '_blank');
        if(printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Fee Receipt - Family ${family.id}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                    </head>
                    <body>
                        ${printContent}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
        }
    };


    return (
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
                        <Button variant="outline" onClick={() => triggerPrint([], 0, totalDues)}><Printer className="h-4 w-4 mr-2" />Print Receipt</Button>
                     </div>
                </div>

            </CardContent>
        </Card>
    );
}
