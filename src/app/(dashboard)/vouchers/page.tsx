'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Loader2, Search, Users } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { openPrintWindow } from '@/lib/print-helper';


export default function VouchersPage() {
  const { families, students, fees, classes } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  
  const [bulkClassFilter, setBulkClassFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 10)), 'yyyy-MM-dd'));
  const [lateFee, setLateFee] = useState(settings.lateFeeFine || 100);

  const familiesForSelection = useMemo(() => {
    let familySet = new Set<string>();
    if (bulkClassFilter === 'all') {
      families.forEach(f => familySet.add(f.id));
    } else {
      students.forEach(s => {
        if (s.class === bulkClassFilter) {
          familySet.add(s.familyId);
        }
      });
    }
    return families.filter(f => familySet.has(f.id));
  }, [bulkClassFilter, families, students]);
  
  const unpaidFeesForSelectedFamilies = useMemo(() => {
    return fees.filter(fee => selectedFamilyIds.includes(fee.familyId) && fee.status === 'Unpaid');
  }, [selectedFamilyIds, fees]);
  
  useEffect(() => {
    // When the filter changes, update the selected families
    setSelectedFamilyIds(familiesForSelection.map(f => f.id));
  }, [familiesForSelection]);
  
  useEffect(() => {
    // When selected families change, select all their unpaid fees by default
    setSelectedFeeIds(unpaidFeesForSelectedFamilies.map(f => f.id));
  }, [unpaidFeesForSelectedFamilies]);


  const handleFamilySelection = (familyId: string, checked: boolean) => {
    const familyFees = fees.filter(f => f.familyId === familyId && f.status === 'Unpaid').map(f => f.id);
    if (checked) {
      setSelectedFamilyIds(prev => [...prev, familyId]);
      setSelectedFeeIds(prev => [...new Set([...prev, ...familyFees])]);
    } else {
      setSelectedFamilyIds(prev => prev.filter(id => id !== familyId));
      setSelectedFeeIds(prev => prev.filter(id => !familyFees.includes(id)));
    }
  };

  const handleFeeSelection = (feeId: string, checked: boolean) => {
     if (checked) {
      setSelectedFeeIds(prev => [...prev, feeId]);
    } else {
      setSelectedFeeIds(prev => prev.filter(id => id !== feeId));
    }
  };


  const handlePrint = async () => {
    if (selectedFeeIds.length === 0) {
      toast({ title: 'No fees selected.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    toast({ title: "Generating Vouchers...", description: `Preparing ${selectedFeeIds.length} fee vouchers.`});
    
    const feesToPrint = fees.filter(f => selectedFeeIds.includes(f.id));
    
    // Group fees by family
    const feesByFamily = feesToPrint.reduce((acc, fee) => {
      if (!acc[fee.familyId]) {
        acc[fee.familyId] = [];
      }
      acc[fee.familyId].push(fee);
      return acc;
    }, {} as Record<string, Fee[]>);

    const allVouchersData = [];

    for (const familyId in feesByFamily) {
      const family = families.find(f => f.id === familyId);
      const familyStudents = students.filter(s => s.familyId === familyId);
      if (!family || familyStudents.length === 0) continue;

      const familyFees = feesByFamily[familyId];
      const totalForVoucher = familyFees.reduce((sum, fee) => sum + fee.amount, 0);

      const voucherId = familyFees[0].id; // Use first fee id as a representative ID
      const qrContent = `${window.location.origin}/voucher/${voucherId}`;
      let qrCodeDataUri = '';
      try {
        qrCodeDataUri = (await generateQrCode({ content: qrContent })).qrCodeDataUri;
      } catch (error) {
        console.error(`QR generation failed for voucher ${voucherId}`);
      }
      
      allVouchersData.push({
        family,
        students: familyStudents,
        fees: familyFees,
        totalAmount: totalForVoucher,
        voucherId,
        issueDate,
        dueDate,
        lateFee,
        qrCodeDataUri,
      });
    }

    if (allVouchersData.length === 0) {
      toast({ title: 'Nothing to Print', description: 'No valid families with fees found.', variant: 'destructive'});
      setIsLoading(false);
      return;
    }
    
    const printContent = renderToString(
        <FeeVoucherPrint allVouchersData={allVouchersData} settings={settings} />
    );
    
    openPrintWindow(printContent, 'Fee Vouchers');
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Fee Vouchers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Voucher Generator</CardTitle>
          <CardDescription>Select families and their outstanding fees to generate printable vouchers.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <Label>Step 1: Select Families</Label>
             <Select onValueChange={setBulkClassFilter} value={bulkClassFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Active Families</SelectItem>
                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <ScrollArea className="h-96 w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {familiesForSelection.map(family => (
                    <TableRow key={family.id} data-state={selectedFamilyIds.includes(family.id) ? 'selected' : ''}>
                      <TableCell><Checkbox checked={selectedFamilyIds.includes(family.id)} onCheckedChange={(checked) => handleFamilySelection(family.id, !!checked)} /></TableCell>
                      <TableCell>
                        <div className="font-medium">{family.fatherName}</div>
                        <div className="text-xs text-muted-foreground">ID: {family.id}</div>
                      </TableCell>
                      <TableCell className="text-right">{students.filter(s => s.familyId === family.id).length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          <div className="space-y-4">
             <Label>Step 2: Select Unpaid Fees to Include</Label>
             <p className="text-xs text-muted-foreground">{selectedFeeIds.length} challans selected.</p>
             <ScrollArea className="h-96 w-full rounded-md border">
                <Table>
                    <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Challan Details</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {unpaidFeesForSelectedFamilies.map(fee => (
                            <TableRow key={fee.id} data-state={selectedFeeIds.includes(fee.id) ? 'selected' : ''}>
                                <TableCell><Checkbox checked={selectedFeeIds.includes(fee.id)} onCheckedChange={(checked) => handleFeeSelection(fee.id, !!checked)} /></TableCell>
                                <TableCell>
                                    <div className="font-medium">{fee.month}, {fee.year}</div>
                                    <div className="text-xs text-muted-foreground">Family ID: {fee.familyId}</div>
                                </TableCell>
                                <TableCell className="text-right">{fee.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
            <Label>Step 3: Configure and Print</Label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full items-end">
                <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Late Fee Fine</Label><Input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} /></div>
                <Button size="lg" onClick={handlePrint} disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                    Generate Vouchers ({selectedFeeIds.length})
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
