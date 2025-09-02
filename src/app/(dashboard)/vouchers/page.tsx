
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Loader2 } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import type { Family, Student, Fee } from '@/lib/types';
import { format } from 'date-fns';
import { FeeVoucherPrint } from '@/components/reports/fee-voucher-print';
import { renderToString } from 'react-dom/server';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface VoucherData {
  issueDate: string;
  dueDate: string;
  feeMonths: string;
  feeItems: {
    admissionFee: number;
    monthlyFee: number;
    concession: number;
    annualCharges: number;
    boardRegFee: number;
    pendingDues: number;
    lateFeeFine: number;
  };
  grandTotal: number;
  notes: string;
}

export default function VouchersPage() {
  const { families, students, fees: allFees } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 10)), 'yyyy-MM-dd'));
  const [feeMonths, setFeeMonths] = useState(format(new Date(), 'MMMM'));
  const [lateFee, setLateFee] = useState(50);
  const [annualCharges, setAnnualCharges] = useState(0);
  const [boardRegFee, setBoardRegFee] = useState(0);

  const [notes, setNotes] = useState(
    '1. Dues, once paid, are not refundable in any case.\n' +
    "2. If a student doesn't pay the dues by the due date, a fine will be charged.\n" +
    '3. The amount of fines can only be changed within three days after display of fines on Notice Board.'
  );

  const [copies, setCopies] = useState('3');

  const handleBulkPrint = () => {
    setIsLoading(true);
    toast({ title: "Generating Vouchers...", description: `Please wait while we prepare vouchers for all ${families.length} families.`});

    // Use a timeout to allow the UI to update and show the loading state
    setTimeout(() => {
        const allVouchersData: { family: Family; students: Student[]; voucherData: VoucherData }[] = [];

        families.forEach(family => {
            const familyStudents = students.filter(s => s.familyId === family.id);
            if (familyStudents.length === 0) return;

            const familyUnpaidFees = allFees.filter(fee => fee.familyId === family.id && fee.status === 'Unpaid');
            
            const monthlyFeeTotal = familyUnpaidFees
                .filter(fee => !['Registration', 'Annual', 'Admission'].some(type => fee.month.includes(type)))
                .reduce((acc, fee) => acc + fee.amount, 0);

            const admissionFeeTotal = familyUnpaidFees
                .filter(fee => fee.month.includes('Registration') || fee.month.includes('Admission'))
                .reduce((acc, fee) => acc + fee.amount, 0);
                
            const pendingDuesTotal = familyUnpaidFees
                .filter(fee => !fee.month.includes('Registration') && !['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].includes(fee.month))
                .reduce((acc, fee) => acc + fee.amount, 0);

            const feeItems = {
                monthlyFee: monthlyFeeTotal,
                admissionFee: admissionFeeTotal,
                pendingDues: pendingDuesTotal,
                annualCharges: annualCharges,
                boardRegFee: boardRegFee,
                lateFeeFine: lateFee,
                concession: 0, // Placeholder for future logic
            };
            
            const grandTotal = Object.values(feeItems).reduce((acc, val) => acc + val, 0) - feeItems.concession;

            // Only generate a voucher if there is an amount due
            if (grandTotal > 0) {
                 allVouchersData.push({
                    family,
                    students: familyStudents,
                    voucherData: {
                        issueDate,
                        dueDate,
                        feeMonths,
                        feeItems,
                        grandTotal,
                        notes,
                    }
                });
            }
        });

        if (allVouchersData.length === 0) {
            toast({ title: "No Dues Found", description: "No families have outstanding fees to generate vouchers for.", variant: "destructive"});
            setIsLoading(false);
            return;
        }

        const printContent = renderToString(
            <FeeVoucherPrint
                allVouchersData={allVouchersData}
                settings={settings}
                copies={parseInt(copies)}
            />
        );

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Fee Vouchers - All Families</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link rel="stylesheet" href="/print-styles.css">
                    </head>
                    <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
        }

        setIsLoading(false);
        toast({ title: "Vouchers Generated!", description: `Successfully generated vouchers for ${allVouchersData.length} families.`});

    }, 500); // 500ms delay
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Bulk Fee Vouchers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Vouchers for All Families</CardTitle>
          <CardDescription>Set the parameters for the fee challans and generate them for all families with outstanding dues at once.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="feeMonths">Fee Month(s)</Label>
                  <Input id="feeMonths" placeholder="e.g., Aug, Sep" value={feeMonths} onChange={(e) => setFeeMonths(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Charges (Optional)</CardTitle>
                  <CardDescription>These charges will be added to every family's voucher. Base fees and pending dues are calculated automatically.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="annualCharges">Annual Charges</Label>
                      <Input id="annualCharges" type="number" value={annualCharges || ''} onChange={(e) => setAnnualCharges(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="boardRegFee">Board Reg / Other</Label>
                      <Input id="boardRegFee" type="number" value={boardRegFee || ''} onChange={(e) => setBoardRegFee(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lateFee">Late Fee Fine</Label>
                      <Input id="lateFee" type="number" value={lateFee} onChange={(e) => setLateFee(Number(e.target.value))} />
                    </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes Section</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                />
              </div>

              <div className="flex justify-end items-center gap-4 pt-4 border-t">
                <div className="space-y-2 w-48">
                    <Label htmlFor="copies">Print Layout</Label>
                    <Select value={copies} onValueChange={setCopies}>
                        <SelectTrigger id="copies">
                            <SelectValue placeholder="Select copies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Copy per Page (Portrait)</SelectItem>
                            <SelectItem value="2">2 Copies per Page (Portrait)</SelectItem>
                            <SelectItem value="3">3 Copies per Page (Landscape)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button size="lg" onClick={handleBulkPrint} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Generating...' : `Generate Vouchers (${families.length} Families)`}
                </Button>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
