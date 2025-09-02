
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Printer } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import type { Family, Student, Fee } from '@/lib/types';
import { format } from 'date-fns';
import { FeeVoucherPrint } from '@/components/reports/fee-voucher-print';
import { renderToString } from 'react-dom/server';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VouchersPage() {
  const { families, students, fees: allFees } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [familyId, setFamilyId] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [familyStudents, setFamilyStudents] = useState<Student[]>([]);
  
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [feeMonths, setFeeMonths] = useState(format(new Date(), 'MMMM'));
  const [lateFee, setLateFee] = useState(50);
  const [notes, setNotes] = useState(
    '1. Dues, once paid, are not refundable in any case.\n' +
    "2. If a student doesn't pay the dues by the due date, a fine of Rs. 50 will be charged per week.\n" +
    '3. The amount of fines can only be changed within three days after display of fines on Notice Board.'
  );

  const [feeItems, setFeeItems] = useState({
    admissionFee: 0,
    monthlyFee: 0,
    concession: 0,
    annualCharges: 0,
    boardRegFee: 0,
    pendingDues: 0,
  });

  const [copies, setCopies] = useState('3');

  const handleFamilySearch = () => {
    const family = families.find(f => f.id === familyId);
    if (family) {
      setSelectedFamily(family);
      const foundStudents = students.filter(s => s.familyId === family.id);
      setFamilyStudents(foundStudents);
      
      const familyUnpaidFees = allFees.filter(fee => fee.familyId === family.id && fee.status === 'Unpaid');
      
      // Separate different types of fees
      const monthlyFeeTotal = familyUnpaidFees
        .filter(fee => !['Registration', 'Admission', 'Annual'].some(type => fee.month.includes(type)))
        .reduce((acc, fee) => acc + fee.amount, 0);

      const admissionFeeTotal = familyUnpaidFees
        .filter(fee => fee.month.includes('Registration'))
        .reduce((acc, fee) => acc + fee.amount, 0);
        
      const pendingDuesTotal = familyUnpaidFees
        .filter(fee => !fee.month.includes('Registration') && !['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].includes(fee.month))
        .reduce((acc, fee) => acc + fee.amount, 0);


      setFeeItems(prev => ({
          ...prev,
          monthlyFee: monthlyFeeTotal,
          admissionFee: admissionFeeTotal,
          pendingDues: pendingDuesTotal
      }));
      
      toast({ title: 'Family Found', description: `Selected family: ${family.fatherName}. Fees auto-populated.` });
    } else {
      setSelectedFamily(null);
      setFamilyStudents([]);
      setFeeItems({
        admissionFee: 0,
        monthlyFee: 0,
        concession: 0,
        annualCharges: 0,
        boardRegFee: 0,
        pendingDues: 0,
      });
      toast({ title: 'Family Not Found', variant: 'destructive' });
    }
  };

  const handleFeeItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFeeItems(prev => ({ ...prev, [id]: Number(value) }));
  };

  const grandTotal = Object.values(feeItems).reduce((acc, val) => acc + val, 0) - feeItems.concession;

  const handlePrint = () => {
    if (!selectedFamily) {
      toast({ title: 'No family selected', variant: 'destructive' });
      return;
    }

    const printContent = renderToString(
      <FeeVoucherPrint
        family={selectedFamily}
        students={familyStudents}
        settings={settings}
        voucherData={{
          issueDate,
          dueDate,
          feeMonths,
          feeItems: { ...feeItems, lateFeeFine: lateFee },
          grandTotal,
          notes,
        }}
        copies={parseInt(copies)}
      />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fee Voucher - Family ${familyId}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .voucher-container { page-break-inside: avoid; }
                .page-break { page-break-before: always; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Fee Vouchers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Fee Voucher</CardTitle>
          <CardDescription>Create and print fee vouchers for families. Unpaid fees are loaded automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-end gap-2 max-w-sm">
            <div className="flex-grow space-y-2">
              <Label htmlFor="family-id">Family Number</Label>
              <Input
                id="family-id"
                placeholder="Enter family number"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
              />
            </div>
            <Button type="button" onClick={handleFamilySearch}>
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>

          {selectedFamily && (
            <div className="space-y-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Family</Label>
                  <Input value={`${selectedFamily.fatherName} (ID: ${selectedFamily.id})`} disabled />
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
                  <CardTitle>Fee Particulars</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-4">
                      <Label htmlFor="feeMonths">Fee Month(s)</Label>
                      <Input id="feeMonths" placeholder="e.g., Aug, Sep" value={feeMonths} onChange={(e) => setFeeMonths(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyFee">Monthly Fee</Label>
                      <Input id="monthlyFee" type="number" value={feeItems.monthlyFee || ''} onChange={handleFeeItemChange} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="admissionFee">Admission Fee</Label>
                      <Input id="admissionFee" type="number" value={feeItems.admissionFee || ''} onChange={handleFeeItemChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annualCharges">Annual Charges</Label>
                      <Input id="annualCharges" type="number" value={feeItems.annualCharges || ''} onChange={handleFeeItemChange} />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="boardRegFee">Board Reg / Other</Label>
                      <Input id="boardRegFee" type="number" value={feeItems.boardRegFee || ''} onChange={handleFeeItemChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pendingDues">Pending Dues</Label>
                      <Input id="pendingDues" type="number" value={feeItems.pendingDues || ''} onChange={handleFeeItemChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="concession">Concession (-)</Label>
                      <Input id="concession" type="number" value={feeItems.concession || ''} onChange={handleFeeItemChange} className="text-destructive" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="lateFee">Late Fee Fine</Label>
                      <Input id="lateFee" type="number" value={lateFee} onChange={(e) => setLateFee(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2 p-4 rounded-md bg-muted flex items-center justify-between col-span-full">
                        <Label className="text-lg font-bold">Grand Total</Label>
                        <span className="text-2xl font-bold">PKR {grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded-md min-h-[100px] text-sm"
                />
              </div>

              <div className="flex justify-end items-center gap-4 pt-4 border-t">
                <div className="space-y-2 w-48">
                    <Label htmlFor="copies">Copies per Page</Label>
                    <Select value={copies} onValueChange={setCopies}>
                        <SelectTrigger id="copies">
                            <SelectValue placeholder="Select copies" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Copy (Page Breaks)</SelectItem>
                            <SelectItem value="2">2 Copies (Side-by-side)</SelectItem>
                            <SelectItem value="3">3 Copies (Vertical)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button size="lg" onClick={handlePrint} disabled={!selectedFamily}>
                  <Printer className="mr-2 h-5 w-5" /> Generate & Print
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
