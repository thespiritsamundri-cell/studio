'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Loader2, Search } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import type { Family, Fee } from '@/lib/types';
import { format } from 'date-fns';
import { FeeVoucherPrint } from '@/components/reports/fee-voucher-print';
import { renderToString } from 'react-dom/server';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { openPrintWindow } from '@/lib/print-helper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function VouchersPage() {
  const { families, students, fees, classes } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  
  // Common voucher settings
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 10)), 'yyyy-MM-dd'));
  const [lateFee, setLateFee] = useState(settings.lateFeeFine || 100);

  // State for Bulk Generation
  const [bulkClassFilter, setBulkClassFilter] = useState('all');
  const [selectedBulkFamilyIds, setSelectedBulkFamilyIds] = useState<string[]>([]);
  const [selectedBulkFeeIds, setSelectedBulkFeeIds] = useState<string[]>([]);
  
  // State for Single Family Generation
  const [singleFamilySearchId, setSingleFamilySearchId] = useState('');
  const [searchedFamily, setSearchedFamily] = useState<Family | null>(null);
  const [searchedFamilyFees, setSearchedFamilyFees] = useState<Fee[]>([]);
  const [selectedSingleFeeIds, setSelectedSingleFeeIds] = useState<string[]>([]);

  // Memo for bulk selection
  const familiesForBulkSelection = useMemo(() => {
    let familySet = new Set<string>();
    if (bulkClassFilter === 'all') {
      families.filter(f => f.status === 'Active').forEach(f => familySet.add(f.id));
    } else {
      students.forEach(s => {
        if (s.class === bulkClassFilter && s.status === 'Active') {
          familySet.add(s.familyId);
        }
      });
    }
    return families.filter(f => familySet.has(f.id) && f.status === 'Active');
  }, [bulkClassFilter, families, students]);
  
  const unpaidFeesForBulkSelection = useMemo(() => {
    return fees.filter(fee => selectedBulkFamilyIds.includes(fee.familyId) && fee.status === 'Unpaid');
  }, [selectedBulkFamilyIds, fees]);
  
  // Effects for bulk selection
  useEffect(() => {
    setSelectedBulkFamilyIds(familiesForBulkSelection.map(f => f.id));
  }, [familiesForBulkSelection]);
  
  useEffect(() => {
    setSelectedBulkFeeIds(unpaidFeesForBulkSelection.map(f => f.id));
  }, [unpaidFeesForBulkSelection]);

  // Handlers for bulk selection
  const handleBulkFamilySelection = (familyId: string, checked: boolean) => {
    const familyFees = fees.filter(f => f.familyId === familyId && f.status === 'Unpaid').map(f => f.id);
    if (checked) {
      setSelectedBulkFamilyIds(prev => [...prev, familyId]);
      setSelectedBulkFeeIds(prev => [...new Set([...prev, ...familyFees])]);
    } else {
      setSelectedBulkFamilyIds(prev => prev.filter(id => id !== familyId));
      setSelectedBulkFeeIds(prev => prev.filter(id => !familyFees.includes(id)));
    }
  };

  const handleBulkFeeSelection = (feeId: string, checked: boolean) => {
     if (checked) { setSelectedBulkFeeIds(prev => [...prev, feeId]); } 
     else { setSelectedBulkFeeIds(prev => prev.filter(id => id !== feeId)); }
  };
  
  // Handler for single family search
  const handleSingleSearch = () => {
    const family = families.find(f => f.id === singleFamilySearchId);
    if (family) {
      setSearchedFamily(family);
      const familyUnpaidFees = fees.filter(f => f.familyId === family.id && f.status === 'Unpaid');
      setSearchedFamilyFees(familyUnpaidFees);
      setSelectedSingleFeeIds(familyUnpaidFees.map(f => f.id)); // Auto-select all
    } else {
      toast({ title: 'Family Not Found', variant: 'destructive' });
      setSearchedFamily(null);
      setSearchedFamilyFees([]);
      setSelectedSingleFeeIds([]);
    }
  };

  const handleSingleFeeSelection = (feeId: string, checked: boolean) => {
     if (checked) { setSelectedSingleFeeIds(prev => [...prev, feeId]); } 
     else { setSelectedSingleFeeIds(prev => prev.filter(id => id !== feeId)); }
  };

  // Generic Print Handler
  const handlePrint = async (activeTab: 'bulk' | 'single') => {
    const finalFeeIds = activeTab === 'bulk' ? selectedBulkFeeIds : selectedSingleFeeIds;

    if (finalFeeIds.length === 0) {
      toast({ title: 'No fees selected.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    toast({ title: "Generating Vouchers...", description: `Preparing vouchers.`});
    
    const feesToPrint = fees.filter(f => finalFeeIds.includes(f.id));
    const feesByFamily = feesToPrint.reduce((acc, fee) => {
      if (!acc[fee.familyId]) { acc[fee.familyId] = []; }
      acc[fee.familyId].push(fee);
      return acc;
    }, {} as Record<string, Fee[]>);

    const allVouchersData = [];

    for (const familyId in feesByFamily) {
      const family = families.find(f => f.id === familyId);
      const familyStudents = students.filter(s => s.familyId === familyId && s.status === 'Active');
      if (!family || familyStudents.length === 0) continue;

      const familyFees = feesByFamily[familyId];
      const totalForVoucher = familyFees.reduce((sum, fee) => sum + fee.amount, 0);

      const qrContent = `${window.location.origin}/profile/family/${family.id}`;
      let qrCodeDataUri = '';
      try {
        qrCodeDataUri = (await generateQrCode({ content: qrContent })).qrCodeDataUri;
      } catch (error) { console.error(`QR generation failed for family ${familyId}`); }
      
      allVouchersData.push({
        family,
        students: familyStudents,
        fees: familyFees,
        totalAmount: totalForVoucher,
        voucherId: familyFees[0].id,
        issueDate, dueDate, lateFee, qrCodeDataUri,
      });
    }

    if (allVouchersData.length === 0) {
      toast({ title: 'Nothing to Print', description: 'No valid families with fees found.', variant: 'destructive'});
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

      <Tabs defaultValue="bulk">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
            <TabsTrigger value="single">Single Family</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bulk">
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Fee Voucher Generator</CardTitle>
                    <CardDescription>Select a class to generate vouchers for all families within it.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <Label>Step 1: Select Families by Class</Label>
                     <Select onValueChange={setBulkClassFilter} value={bulkClassFilter}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Active Families</SelectItem>
                            {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <ScrollArea className="h-96 w-full rounded-md border">
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Family</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {familiesForBulkSelection.map(family => (
                            <TableRow key={family.id} data-state={selectedBulkFamilyIds.includes(family.id) ? 'selected' : ''}>
                              <TableCell><Checkbox checked={selectedBulkFamilyIds.includes(family.id)} onCheckedChange={(checked) => handleBulkFamilySelection(family.id, !!checked)} /></TableCell>
                              <TableCell>
                                <div className="font-medium">{family.fatherName}</div>
                                <div className="text-xs text-muted-foreground">ID: {family.id}</div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                  <div className="space-y-4">
                     <Label>Step 2: Select Unpaid Fees</Label>
                     <ScrollArea className="h-96 w-full rounded-md border">
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Challan</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {unpaidFeesForBulkSelection.map(fee => (
                                    <TableRow key={fee.id} data-state={selectedBulkFeeIds.includes(fee.id) ? 'selected' : ''}>
                                        <TableCell><Checkbox checked={selectedBulkFeeIds.includes(fee.id)} onCheckedChange={(checked) => handleBulkFeeSelection(fee.id, !!checked)} /></TableCell>
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
                <CardFooter>
                    <Button size="lg" onClick={() => handlePrint('bulk')} disabled={isLoading || selectedBulkFeeIds.length === 0} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                        Generate Vouchers for Bulk ({new Set(unpaidFeesForBulkSelection.filter(f=>selectedBulkFeeIds.includes(f.id)).map(f=>f.familyId)).size} Families)
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        <TabsContent value="single">
           <Card>
             <CardHeader>
                <CardTitle>Single Family Voucher</CardTitle>
                <CardDescription>Search for an individual family to generate their fee voucher.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input placeholder="Enter Family ID" value={singleFamilySearchId} onChange={e => setSingleFamilySearchId(e.target.value)} />
                    <Button onClick={handleSingleSearch}><Search className="mr-2 h-4 w-4" />Search</Button>
                 </div>
                 {searchedFamily && (
                     <div className="space-y-4 pt-4 border-t">
                        <Label>Select Unpaid Fees for <span className="font-bold">{searchedFamily.fatherName}</span></Label>
                        <ScrollArea className="h-72 w-full rounded-md border">
                            <Table>
                                <TableHeader><TableRow><TableHead className="w-[50px]"></TableHead><TableHead>Challan</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {searchedFamilyFees.length > 0 ? searchedFamilyFees.map(fee => (
                                        <TableRow key={fee.id} data-state={selectedSingleFeeIds.includes(fee.id) ? 'selected' : ''}>
                                            <TableCell><Checkbox checked={selectedSingleFeeIds.includes(fee.id)} onCheckedChange={(checked) => handleSingleFeeSelection(fee.id, !!checked)} /></TableCell>
                                            <TableCell>
                                                <div className="font-medium">{fee.month}, {fee.year}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{fee.amount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No unpaid fees found for this family.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                         <Button size="lg" onClick={() => handlePrint('single')} disabled={isLoading || selectedSingleFeeIds.length === 0} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                            Generate Voucher for {searchedFamily.fatherName}
                        </Button>
                     </div>
                 )}
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-6">
        <CardHeader><CardTitle>Voucher Settings</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
            <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Late Fee Fine</Label><Input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
