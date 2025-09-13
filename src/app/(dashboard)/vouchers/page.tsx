
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Loader2, ArrowRight } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import type { Family, Student, Fee } from '@/lib/types';
import { format } from 'date-fns';
import { FeeVoucherPrint } from '@/components/reports/fee-voucher-print';
import { renderToString } from 'react-dom/server';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Voucher Parameters State
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

  const handleSelectFamily = (familyId: string) => {
    setSelectedFamilyIds(prev =>
      prev.includes(familyId) ? prev.filter(id => id !== familyId) : [...prev, familyId]
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedFamilyIds(families.map(f => f.id));
    } else {
        setSelectedFamilyIds([]);
    }
  }

  const isAllSelected = families.length > 0 && selectedFamilyIds.length === families.length;

  const handleProceedToConfig = () => {
    if (selectedFamilyIds.length === 0) {
        toast({ title: 'No Families Selected', description: 'Please select at least one family to generate vouchers for.', variant: 'destructive'});
        return;
    }
    setCurrentStep(2);
  }
  
  const generateVoucherDataForFamily = (familyId: string) => {
      const family = families.find(f => f.id === familyId);
      if (!family) return null;

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
      
      return {
          issueDate,
          dueDate,
          feeMonths,
          feeItems,
          grandTotal,
          notes,
      };
  }

  const previewVoucherData = useMemo(() => {
    if (selectedFamilyIds.length > 0) {
        const firstFamilyId = selectedFamilyIds[0];
        const firstFamily = families.find(f => f.id === firstFamilyId);
        const firstFamilyStudents = students.filter(s => s.familyId === firstFamilyId);
        const data = generateVoucherDataForFamily(firstFamilyId);
        if (firstFamily && data) {
            return { family: firstFamily, students: firstFamilyStudents, voucherData: data };
        }
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFamilyIds, families, students, issueDate, dueDate, feeMonths, lateFee, annualCharges, boardRegFee, notes]);

  const handleBulkPrint = () => {
    setIsLoading(true);
    toast({ title: "Generating Vouchers...", description: `Please wait while we prepare vouchers for ${selectedFamilyIds.length} families.`});

    setTimeout(() => {
        const allVouchersData: { family: Family; students: Student[]; voucherData: VoucherData }[] = [];

        selectedFamilyIds.forEach(familyId => {
            const family = families.find(f => f.id === familyId);
            if (!family) return;

            const familyStudents = students.filter(s => s.familyId === family.id);
            if (familyStudents.length === 0) return;

            const voucherData = generateVoucherDataForFamily(familyId);
            if (voucherData && voucherData.grandTotal > 0) {
                 allVouchersData.push({
                    family,
                    students: familyStudents,
                    voucherData
                });
            }
        });

        if (allVouchersData.length === 0) {
            toast({ title: "No Dues Found", description: "None of the selected families have outstanding fees to generate vouchers for.", variant: "destructive"});
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
                        <title>Fee Vouchers - ${allVouchersData.length} Families</title>
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

    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Bulk Fee Vouchers</h1>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Families</CardTitle>
            <CardDescription>Choose which families to generate fee vouchers for. {selectedFamilyIds.length} families selected.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Family ID</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map(family => (
                    <TableRow key={family.id} data-state={selectedFamilyIds.includes(family.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFamilyIds.includes(family.id)}
                          onCheckedChange={() => handleSelectFamily(family.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{family.id}</TableCell>
                      <TableCell>{family.fatherName}</TableCell>
                      <TableCell>{family.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          <div className="flex justify-end p-6">
            <Button size="lg" onClick={handleProceedToConfig}>
              Configure Vouchers <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle>Step 2: Configure & Print</CardTitle>
                    <CardDescription>Set parameters for the challans. These will apply to all {selectedFamilyIds.length} selected families.</CardDescription>
                 </div>
                 <Button variant="outline" onClick={() => setCurrentStep(1)}>Back to Selection</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Additional Charges (Optional)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  </div>
                </div>

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
                      <Label htmlFor="copies">Voucher Copies</Label>
                      <Select value={copies} onValueChange={setCopies}>
                          <SelectTrigger id="copies">
                              <SelectValue placeholder="Select copies" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="1">1 Copy per Page</SelectItem>
                              <SelectItem value="2">2 Copies per Page</SelectItem>
                              <SelectItem value="3">3 Copies per Page</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <Button size="lg" onClick={handleBulkPrint} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Generating...' : `Generate Vouchers (${selectedFamilyIds.length} Selected)`}
                  </Button>
                </div>
            </CardContent>
          </Card>
          
           <Card className="lg:col-span-1 sticky top-20">
            <CardHeader>
                <CardTitle>Voucher Preview</CardTitle>
                <CardDescription>This is a preview of the voucher for the first selected family.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="scale-75 -translate-x-12 -translate-y-10 origin-top-left">
                    {previewVoucherData ? (
                        <FeeVoucherPrint
                            allVouchersData={[previewVoucherData]}
                            settings={settings}
                            copies={1} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-96 bg-muted rounded-md">
                            <p className="text-muted-foreground">No preview available.</p>
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
