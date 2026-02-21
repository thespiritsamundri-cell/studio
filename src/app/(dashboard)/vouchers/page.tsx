
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
import type { Family, Fee, Student } from '@/lib/types';
import { format } from 'date-fns';
import { FeeVoucherPrint } from '@/components/reports/fee-voucher-print';
import { renderToString } from 'react-dom/server';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { openPrintWindow } from '@/lib/print-helper';
import { Separator } from '@/components/ui/separator';

export default function VouchersPage() {
  const { families, students, fees } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  
  // Common voucher settings
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 10)), 'yyyy-MM-dd'));
  const [lateFee, setLateFee] = useState(settings.lateFeeFine || 100);

  // State for Single Family Generation
  const [familySearchId, setFamilySearchId] = useState('');
  const [searchedFamily, setSearchedFamily] = useState<Family | null>(null);

  const searchedFamilyFees = useMemo(() => {
    if (!searchedFamily) return [];
    return fees.filter(f => f.familyId === searchedFamily.id && f.status === 'Unpaid');
  }, [searchedFamily, fees]);


  const handleSearch = () => {
    if (!familySearchId) {
      setSearchedFamily(null);
      return;
    }
    const family = families.find(f => f.id === familySearchId);
    if (family) {
      setSearchedFamily(family);
    } else {
      toast({ title: 'Family Not Found', variant: 'destructive' });
      setSearchedFamily(null);
    }
  };

  // Generic Print Handler
  const handlePrint = async (mode: 'single' | 'all') => {
    setIsLoading(true);

    let familiesToProcess: Family[] = [];
    if (mode === 'single' && searchedFamily) {
        familiesToProcess = [searchedFamily];
    } else if (mode === 'all') {
        const familiesWithUnpaidDues = new Set(fees.filter(f => f.status === 'Unpaid').map(f => f.familyId));
        familiesToProcess = families.filter(f => familiesWithUnpaidDues.has(f.id) && f.status === 'Active');
    }

    if (familiesToProcess.length === 0) {
      toast({ title: 'No families with unpaid fees found.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    toast({ title: "Generating Vouchers...", description: `Preparing vouchers for ${familiesToProcess.length} family(s).`});
    
    const allVouchersData = [];

    for (const family of familiesToProcess) {
      const familyStudents = students.filter(s => s.familyId === family.id && s.status === 'Active');
      if (familyStudents.length === 0) continue;

      const familyUnpaidFees = fees.filter(f => f.familyId === family.id && f.status === 'Unpaid');
      if (familyUnpaidFees.length === 0) continue;

      const totalForVoucher = familyUnpaidFees.reduce((sum, fee) => sum + fee.amount, 0);
      const voucherId = `VCH-${family.id}-${format(new Date(issueDate), 'yyyy-MM')}`;

      // Point QR to the family's public profile page for live status
      const qrContent = `${window.location.origin}/profile/family/${family.id}`;
      let qrCodeDataUri = '';
      try {
        qrCodeDataUri = (await generateQrCode({ content: qrContent })).qrCodeDataUri;
      } catch (error) { console.error(`QR generation failed for family ${family.id}`); }
      
      allVouchersData.push({
        family,
        students: familyStudents,
        fees: familyUnpaidFees,
        totalAmount: totalForVoucher,
        voucherId,
        issueDate, dueDate, lateFee, qrCodeDataUri,
      });
    }

    if (allVouchersData.length === 0) {
      toast({ title: 'Nothing to Print', description: 'No valid data found to generate vouchers.', variant: 'destructive'});
      setIsLoading(false);
      return;
    }
    
    const printContent = renderToString(<FeeVoucherPrint allVouchersData={allVouchersData} settings={settings} />);
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
          <CardDescription>Generate fee vouchers for a single family or for all families with outstanding dues.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Generate for a Single Family</h3>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input placeholder="Enter Family ID" value={familySearchId} onChange={e => setFamilySearchId(e.target.value)} />
                    <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" />Search</Button>
                </div>
            </div>
             {searchedFamily && (
                <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Unpaid Fees for <span className="font-bold">{searchedFamily.fatherName} (ID: {searchedFamily.id})</span></h3>
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>Challan</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {searchedFamilyFees.length > 0 ? searchedFamilyFees.map(fee => (
                                    <TableRow key={fee.id}>
                                        <TableCell>{fee.month}, {fee.year}</TableCell>
                                        <TableCell className="text-right">{fee.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={2} className="text-center h-24">No unpaid fees found for this family.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                     </div>
                     <Button size="lg" onClick={() => handlePrint('single')} disabled={isLoading || searchedFamilyFees.length === 0} className="w-full mt-4">
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                        Generate Voucher for {searchedFamily.fatherName}
                    </Button>
                </div>
            )}
             <Separator />
             <div className="p-4 border rounded-lg bg-muted/30">
                 <h3 className="font-semibold mb-2">Generate for All Families</h3>
                 <p className="text-sm text-muted-foreground mb-4">This will generate a fee voucher for every active family that has at least one unpaid fee challan.</p>
                 <Button size="lg" onClick={() => handlePrint('all')} disabled={isLoading} variant="secondary" className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Users className="mr-2 h-5 w-5" />}
                    Generate Vouchers for All Families with Dues
                </Button>
            </div>

        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader><CardTitle>Voucher Settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Late Fee Fine (PKR)</Label><Input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
