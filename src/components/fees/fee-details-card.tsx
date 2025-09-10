
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useData } from '@/context/data-context';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';


interface FeeDetailsCardProps {
    family: Family;
    students: Student[];
    fees: Fee[];
    onUpdateFee: (id: string, fee: Partial<Fee>) => void;
    onAddFee: (fee: Omit<Fee, 'id'>) => Promise<string | undefined>;
    onDeleteFee: (id: string) => void; 
    settings: SchoolSettings;
}

type PrintType = 'normal' | 'thermal';

export function FeeDetailsCard({ family, students, fees, onUpdateFee, onAddFee, onDeleteFee, settings }: FeeDetailsCardProps) {
    const { toast } = useToast();
    const { addActivityLog } = useData();

    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('By Hand');
    const [printType, setPrintType] = useState<PrintType>('normal');
    
    const unpaidFees = useMemo(() => fees.filter(f => f.status === 'Unpaid'), [fees]);
    const totalDues = useMemo(() => unpaidFees.reduce((acc, fee) => acc + fee.amount, 0), [unpaidFees]);
    
    useEffect(() => {
        setPaidAmount(totalDues);
    }, [totalDues]);

    const remainingDues = totalDues - paidAmount;

    const handleCollectFee = async () => {
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
        
        const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const specialFeeOrder = ['Registration', 'Admission', 'Annual'];
        
        const sortedUnpaidFees = [...unpaidFees].sort((a,b) => {
            if (a.year !== b.year) return a.year - b.year;
            
            const aIsSpecial = specialFeeOrder.some(s => a.month.includes(s));
            const bIsSpecial = specialFeeOrder.some(s => b.month.includes(s));

            if(aIsSpecial && !bIsSpecial) return -1;
            if(!aIsSpecial && bIsSpecial) return 1;

            return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });

        for (const fee of sortedUnpaidFees) {
            if (amountToSettle <= 0) break;
            
            const paymentForThisChallan = Math.min(amountToSettle, fee.amount);

            const paymentRecord: Omit<Fee, 'id'> = {
                familyId: fee.familyId,
                amount: paymentForThisChallan,
                month: fee.month,
                year: fee.year,
                status: 'Paid',
                paymentDate: new Date().toISOString().split('T')[0],
                originalChallanId: fee.id, 
                paymentMethod: paymentMethod,
            };
            
            const newFeeId = await onAddFee(paymentRecord);
            if (newFeeId) {
                newlyPaidFees.push({ ...paymentRecord, id: newFeeId });
            }
            
            const remainingAmountInChallan = fee.amount - paymentForThisChallan;
            
            if (remainingAmountInChallan > 0) {
                 const updatedChallan: Partial<Fee> = { amount: remainingAmountInChallan };
                 await onUpdateFee(fee.id, updatedChallan);
            } else {
                 await onDeleteFee(fee.id);
            }

            amountToSettle -= paymentForThisChallan;
        }
        
        const collectedAmount = paidAmount - amountToSettle;
        const newDues = totalDues - collectedAmount;
        
        addActivityLog({ user: 'Admin', action: 'Collect Fee', description: `Collected PKR ${collectedAmount.toLocaleString()} from family ${family.id} (${family.fatherName})`});

        toast({
            title: 'Fee Collected',
            description: `PKR ${collectedAmount.toLocaleString()} collected for Family ${family.id}.`,
        });
        
        triggerPrint(newlyPaidFees, collectedAmount, newDues, paymentMethod);

        if(settings.automatedMessages?.payment.enabled) {
             const paymentTemplate = settings.messageTemplates?.find(t => t.id === settings.automatedMessages?.payment.templateId);
             if (paymentTemplate) {
                let message = paymentTemplate.content;
                message = message.replace(/{father_name}/g, family.fatherName);
                message = message.replace(/{paid_amount}/g, collectedAmount.toLocaleString());
                message = message.replace(/{remaining_dues}/g, newDues.toLocaleString());
                message = message.replace(/{school_name}/g, settings.schoolName);
                try {
                     await sendWhatsAppMessage(
                        family.phone, 
                        message,
                        settings.whatsappApiUrl,
                        settings.whatsappApiKey,
                        settings.whatsappInstanceId,
                        settings.whatsappPriority
                    );
                    addActivityLog({ user: 'System', action: 'Send WhatsApp Message', description: 'Sent fee payment receipt to 1 recipient.' });
                } catch (error) {
                    console.error("Failed to send payment receipt.", error);
                }
             }
        }
    };
    
    const triggerPrint = (paidFeesForReceipt: Fee[], collectedAmount: number, newRemainingDues: number, method: string) => {
        if (collectedAmount === 0 && unpaidFees.length === 0) {
             toast({ title: 'No Dues', description: 'There are no outstanding fees to generate a receipt for.', variant: 'destructive' });
            return;
        }
        
        const printContent = renderToString(
            <FeeReceipt
                family={family}
                students={students}
                fees={paidFeesForReceipt}
                totalDues={totalDues}
                paidAmount={collectedAmount}
                remainingDues={newRemainingDues}
                settings={settings}
                paymentMethod={method}
                printType={printType}
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
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                 <Label htmlFor="payment-method">Payment Method</Label>
                                 <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                     <SelectTrigger id="payment-method">
                                         <SelectValue placeholder="Select method" />
                                     </SelectTrigger>
                                     <SelectContent>
                                         <SelectItem value="By Hand">By Hand</SelectItem>
                                         <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                                         <SelectItem value="Jazz Cash">Jazz Cash</SelectItem>
                                         <SelectItem value="Bank Account">Bank Account</SelectItem>
                                     </SelectContent>
                                 </Select>
                             </div>
                             <div className="space-y-2">
                                 <Label>Remaining Dues (PKR)</Label>
                                 <Input value={remainingDues.toLocaleString()} disabled className="font-bold text-destructive" />
                             </div>
                         </div>
                     </div>
                     <div className="flex justify-end gap-2">
                        <Button disabled={totalDues === 0 || paidAmount <= 0} onClick={handleCollectFee}>Collect Fee</Button>
                        <Select value={printType} onValueChange={(value) => setPrintType(value as PrintType)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Print Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">Normal (A4)</SelectItem>
                                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => triggerPrint([], 0, totalDues, paymentMethod)}><Printer className="h-4 w-4" /></Button>
                     </div>
                </div>

            </CardContent>
        </Card>
    );
}
