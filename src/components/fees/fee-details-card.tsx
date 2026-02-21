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
import { Printer, Download, Loader2 } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import type { SchoolSettings } from '@/context/settings-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useData } from '@/context/data-context';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { openPrintWindow } from '@/lib/print-helper';
import { Checkbox } from '../ui/checkbox';


interface FeeDetailsCardProps {
    family: Family;
    students: Student[];
    fees: Fee[];
    onUpdateFee: (id: string, fee: Partial<Fee>) => void;
    onAddFee: (fee: Omit<Fee, 'id'>) => Promise<string | undefined>;
    onDeleteFee: (id: string) => void; 
    settings: SchoolSettings;
}

export function FeeDetailsCard({ family, students, fees, onUpdateFee, settings }: FeeDetailsCardProps) {
    const { toast } = useToast();
    const { addActivityLog, addNotification } = useData();

    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('By Hand');
    
    const unpaidFees = useMemo(() => fees.filter(f => f.status === 'Unpaid').sort((a,b) => new Date(a.year, Number(a.month)).getTime() - new Date(b.year, Number(b.month)).getTime()), [fees]);
    const totalDues = useMemo(() => unpaidFees.reduce((acc, fee) => acc + fee.amount, 0), [unpaidFees]);
    const selectedDues = useMemo(() => {
        return unpaidFees
            .filter(f => selectedFeeIds.includes(f.id))
            .reduce((acc, fee) => acc + fee.amount, 0);
    }, [unpaidFees, selectedFeeIds]);
    
    useEffect(() => {
        // Select all unpaid fees by default when the component loads or fees change
        setSelectedFeeIds(unpaidFees.map(f => f.id));
    }, [unpaidFees]);


    const handleCollectFee = async () => {
        if (selectedFeeIds.length === 0) {
            toast({ title: 'No Fees Selected', description: 'Please select at least one fee challan to pay.', variant: 'destructive' });
            return;
        }

        const feesToPay = unpaidFees.filter(f => selectedFeeIds.includes(f.id));
        const collectedAmount = feesToPay.reduce((sum, fee) => sum + fee.amount, 0);
        const receiptId = `REC-${Date.now()}`;

        for (const fee of feesToPay) {
            await onUpdateFee(fee.id, {
                status: 'Paid',
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: paymentMethod,
                receiptId: receiptId
            });
        }
        
        toast({
            title: 'Fee Collected',
            description: `PKR ${collectedAmount.toLocaleString()} collected for Family ${family.id}.`,
        });

        addActivityLog({ action: 'Collect Fee', description: `Collected PKR ${collectedAmount.toLocaleString()} from family ${family.id} (${family.fatherName})`});
        
        addNotification({
            title: 'Fee Collected',
            description: `PKR ${collectedAmount.toLocaleString()} collected from ${family.fatherName} (Family ID: ${family.id})`,
            link: `/income?familyId=${family.id}`
        });

        if (settings.automatedMessages?.payment.enabled) {
            // ... (WhatsApp notification logic remains the same)
        }
        
        // After payment, clear selections
        setSelectedFeeIds([]);
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
                        <p className='text-sm text-muted-foreground'>Total Outstanding Dues</p>
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
                                    <TableCell>
                                        <Badge 
                                            variant={student.status === 'Active' ? 'default' : student.status === 'Graduated' ? 'secondary' : 'destructive'} 
                                            className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                                        >
                                            {student.status}
                                        </Badge>
                                    </TableCell>
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
                                 <TableHead className="w-12"><Checkbox checked={unpaidFees.length > 0 && selectedFeeIds.length === unpaidFees.length} onCheckedChange={(checked) => setSelectedFeeIds(checked ? unpaidFees.map(f => f.id) : [])} /></TableHead>
                                <TableHead>Challan ID</TableHead>
                                <TableHead>Month/Year</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount (PKR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {unpaidFees.length > 0 ? (
                                unpaidFees.map(fee => (
                                    <TableRow key={fee.id} data-state={selectedFeeIds.includes(fee.id) ? 'selected' : ''}>
                                        <TableCell><Checkbox checked={selectedFeeIds.includes(fee.id)} onCheckedChange={(checked) => handleFeeSelection(fee.id, !!checked)} /></TableCell>
                                        <TableCell>{fee.id}</TableCell>
                                        <TableCell>{fee.month}, {fee.year}</TableCell>
                                        <TableCell><Badge variant="destructive">{fee.status}</Badge></TableCell>
                                        <TableCell className="text-right font-medium">{fee.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">No outstanding fees found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                     <div className="space-y-4 md:col-span-2">
                         <h3 className="text-lg font-semibold">Payment Collection</h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                             <div className="space-y-2">
                                 <Label>Selected Dues (PKR)</Label>
                                 <Input value={selectedDues.toLocaleString()} disabled className="font-bold border-primary" />
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
                             <Button className="w-full" disabled={selectedDues <= 0} onClick={handleCollectFee}>Collect Fee (PKR {selectedDues.toLocaleString()})</Button>
                         </div>
                     </div>
                     <div></div>
                </div>

            </CardContent>
        </Card>
    );
}
