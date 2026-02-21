
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
    const [discount, setDiscount] = useState<number>(0);

    const unpaidFees = useMemo(() => {
        const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const specialFeeOrder = ['Registration', 'Admission', 'Annual'];
        
        return fees
            .filter(f => f.status === 'Unpaid')
            .sort((a, b) => {
                const aIsSpecial = specialFeeOrder.some(prefix => a.month.startsWith(prefix));
                const bIsSpecial = specialFeeOrder.some(prefix => b.month.startsWith(prefix));

                if (aIsSpecial && !bIsSpecial) return -1;
                if (!aIsSpecial && bIsSpecial) return 1;
                if (aIsSpecial && bIsSpecial) {
                    return specialFeeOrder.indexOf(a.month) - specialFeeOrder.indexOf(b.month);
                }

                // Both are regular month fees
                const dateA = new Date(a.year, monthOrder.indexOf(a.month));
                const dateB = new Date(b.year, monthOrder.indexOf(b.month));
                return dateA.getTime() - dateB.getTime();
            });
    }, [fees]);

    const totalDues = useMemo(() => unpaidFees.reduce((acc, fee) => acc + fee.amount, 0), [unpaidFees]);
    
    const selectedDues = useMemo(() => {
        return unpaidFees
            .filter(f => selectedFeeIds.includes(f.id))
            .reduce((acc, fee) => acc + fee.amount, 0);
    }, [unpaidFees, selectedFeeIds]);
    
    const finalAmount = useMemo(() => Math.max(0, selectedDues - discount), [selectedDues, discount]);
    
    useEffect(() => {
        // Auto-select all unpaid fees when component loads or fees change
        setSelectedFeeIds(unpaidFees.map(f => f.id));
    }, [unpaidFees]);


    const handleCollectFee = async () => {
        if (selectedFeeIds.length === 0) {
            toast({ title: 'No Fees Selected', description: 'Please select at least one fee challan to pay.', variant: 'destructive' });
            return;
        }

        if (discount > selectedDues) {
            toast({ title: 'Invalid Discount', description: 'Discount cannot be greater than the selected dues.', variant: 'destructive'});
            return;
        }

        const feesToPay = unpaidFees.filter(f => selectedFeeIds.includes(f.id));
        const receiptId = `REC-${Date.now()}`;

        for (let i = 0; i < feesToPay.length; i++) {
            const fee = feesToPay[i];
            const isLastFee = i === feesToPay.length - 1;
            
            await onUpdateFee(fee.id, {
                status: 'Paid',
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: paymentMethod,
                receiptId: receiptId,
                discount: isLastFee ? discount : 0,
            });
        }
        
        toast({
            title: 'Fee Collected',
            description: `PKR ${finalAmount.toLocaleString()} collected for Family ${family.id}.`,
        });

        addActivityLog({ action: 'Collect Fee', description: `Collected PKR ${finalAmount.toLocaleString()} from family ${family.id} (${family.fatherName}) with a discount of PKR ${discount}.`});
        
        addNotification({
            title: 'Fee Collected',
            description: `PKR ${finalAmount.toLocaleString()} collected from ${family.fatherName} (Family ID: ${family.id})`,
            link: `/income?familyId=${family.id}`
        });
        
        // Reset selections and discount
        setSelectedFeeIds([]);
        setDiscount(0);
    };

    const handleFeeSelection = (feeId: string, checked: boolean) => {
        const feeIndex = unpaidFees.findIndex(f => f.id === feeId);
        if (feeIndex === -1) return;
    
        if (checked) {
            // When checking an item, also check all previous items
            const idsToSelect = unpaidFees.slice(0, feeIndex + 1).map(f => f.id);
            setSelectedFeeIds(prev => [...new Set([...prev, ...idsToSelect])]);
        } else {
            // When unchecking an item, also uncheck all subsequent items
            const idsToDeselect = unpaidFees.slice(feeIndex).map(f => f.id);
            setSelectedFeeIds(prev => prev.filter(id => !idsToDeselect.includes(id)));
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

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Collection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Selected Dues (PKR)</Label>
                            <Input value={selectedDues.toLocaleString()} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount">Discount (PKR)</Label>
                            <Input id="discount" type="number" value={discount === 0 ? '' : discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Total to Collect</Label>
                            <Input value={finalAmount.toLocaleString()} disabled className="font-bold border-primary" />
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
                    </div>
                     <div className="flex justify-end">
                        <Button className="w-full sm:w-auto" size="lg" disabled={selectedDues <= 0} onClick={handleCollectFee}>Collect Fee (PKR {finalAmount.toLocaleString()})</Button>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
