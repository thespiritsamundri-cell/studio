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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedFamily, setSearchedFamily] = useState<Family | null>(null);
  const [familyStudents, setFamilyStudents] = useState<Student[]>([]);
  const [unpaidFees, setUnpaidFees] = useState<Fee[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  
  // State for student name search
  const [studentSearchResults, setStudentSearchResults] = useState<Student[]>([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  
  // Memo for All Families Tab
  const familiesWithDues = useMemo(() => {
    const familiesWithUnpaidFees = new Set(fees.filter(f => f.status === 'Unpaid').map(f => f.familyId));
    return families.filter(f => familiesWithUnpaidFees.has(f.id) && f.status === 'Active');
  }, [fees, families]);
  
  
  useEffect(() => {
    if (searchedFamily) {
        const familyStudents = students.filter(s => s.familyId === searchedFamily.id && s.status === 'Active');
        setFamilyStudents(familyStudents);

        const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const specialFeeOrder = ['Registration', 'Admission', 'Annual'];
        
        const familyUnpaid = fees
            .filter(f => f.familyId === searchedFamily.id && f.status === 'Unpaid')
            .sort((a, b) => {
                const aIsSpecial = specialFeeOrder.some(prefix => a.month.startsWith(prefix));
                const bIsSpecial = specialFeeOrder.some(prefix => b.month.startsWith(prefix));

                if (aIsSpecial && !bIsSpecial) return -1;
                if (!aIsSpecial && bIsSpecial) return 1;
                if (aIsSpecial && bIsSpecial) {
                    return specialFeeOrder.indexOf(a.month) - specialFeeOrder.indexOf(b.month);
                }
                const dateA = new Date(a.year, monthOrder.indexOf(a.month));
                const dateB = new Date(b.year, monthOrder.indexOf(b.month));
                return dateA.getTime() - dateB.getTime();
            });
        setUnpaidFees(familyUnpaid);
        setSelectedFeeIds(familyUnpaid.map(f => f.id)); // Auto-select all by default
    } else {
        setFamilyStudents([]);
        setUnpaidFees([]);
        setSelectedFeeIds([]);
    }
  }, [searchedFamily, students, fees]);

  const processFamilySearch = (family: Family) => {
    setSearchedFamily(family);
    // The useEffect above will handle updating students and fees.
  };

  const handleSearch = () => {
    if (!searchQuery) {
      toast({ title: 'Please enter a Family ID or Student Name.', variant: 'destructive' });
      return;
    }
    setSearchedFamily(null);
    setStudentSearchResults([]);

    const familyById = families.find(f => f.id.toLowerCase() === searchQuery.toLowerCase());
    if (familyById) {
      processFamilySearch(familyById);
      return;
    }

    const matchingStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (matchingStudents.length === 0) {
      toast({ title: 'Not Found', description: `No family or student found for "${searchQuery}".`, variant: 'destructive' });
    } else if (matchingStudents.length === 1) {
      const student = matchingStudents[0];
      const family = families.find(f => f.id === student.familyId);
      if (family) {
        processFamilySearch(family);
        setSearchQuery(family.id);
      } else {
        toast({ title: 'Family Not Found', description: `Could not find family for student ${student.name}.`, variant: 'destructive' });
      }
    } else {
      setStudentSearchResults(matchingStudents);
      setShowSelectionDialog(true);
    }
  };

  const handleStudentSelect = (student: Student) => {
    const family = families.find(f => f.id === student.familyId);
    if (family) {
      setSearchQuery(family.id);
      processFamilySearch(family);
    }
    setShowSelectionDialog(false);
  };

  const handleFeeSelection = (feeId: string, checked: boolean) => {
    const feeIndex = unpaidFees.findIndex(f => f.id === feeId);
    if (feeIndex === -1) return;

    if (checked) {
        const idsToSelect = unpaidFees.slice(0, feeIndex + 1).map(f => f.id);
        setSelectedFeeIds(prev => [...new Set([...prev, ...idsToSelect])]);
    } else {
        const idsToDeselect = unpaidFees.slice(feeIndex).map(f => f.id);
        setSelectedFeeIds(prev => prev.filter(id => !idsToDeselect.includes(id)));
    }
  };

  const handlePrint = async (mode: 'single' | 'all') => {
    setIsLoading(true);

    let familiesToProcess: Family[] = [];
    if (mode === 'single' && searchedFamily) {
        if (selectedFeeIds.length === 0) {
            toast({ title: 'No Fees Selected', description: 'Please select at least one fee challan to include in the voucher.', variant: 'destructive' });
            setIsLoading(false);
            return;
        }
        familiesToProcess = [searchedFamily];
    } else if (mode === 'all') {
        familiesToProcess = familiesWithDues;
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

      let familyUnpaidFees;
      if (mode === 'single') {
          familyUnpaidFees = unpaidFees.filter(f => selectedFeeIds.includes(f.id));
      } else {
          familyUnpaidFees = fees.filter(f => f.familyId === family.id && f.status === 'Unpaid');
      }

      if (familyUnpaidFees.length === 0) continue;

      const totalForVoucher = familyUnpaidFees.reduce((sum, fee) => sum + fee.amount, 0);
      const voucherId = `VCH-${family.id}-${format(new Date(issueDate), 'yyyy-MM')}`;

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
  
  const getStudentNamesForFamily = (familyId: string) => {
      return students.filter(s => s.familyId === familyId && s.status !== 'Archived').map(s => s.name).join(', ');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Fee Vouchers</h1>
      </div>
        <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Multiple Students Found</DialogTitle>
                    <DialogDescription>Select the correct student to generate their family's voucher.</DialogDescription>
                </DialogHeader>
                <div className="max-h-96 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Father's Name</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentSearchResults.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.fatherName}</TableCell>
                                    <TableCell>{student.class}</TableCell>
                                    <TableCell>
                                        <Button size="sm" onClick={() => handleStudentSelect(student)}>Select</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
       <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Family Voucher</TabsTrigger>
                <TabsTrigger value="all">All Families Vouchers</TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate for a Single Family</CardTitle>
                        <CardDescription>Search for a family by ID or student name, select their dues, and generate a consolidated voucher.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input placeholder="Enter Family ID or Student Name" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                            <Button onClick={handleSearch}><Search className="mr-2 h-4 w-4" />Search</Button>
                        </div>
                        {searchedFamily && (
                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-2">Details for <span className="font-bold">{searchedFamily.fatherName} (ID: {searchedFamily.id})</span></h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium mb-2">Enrolled Students</h4>
                                        <div className="border rounded-md p-2">
                                            {familyStudents.length > 0 ? familyStudents.map(s => <p key={s.id} className="text-sm">{s.name} ({s.class})</p>) : <p className="text-sm text-muted-foreground">No active students.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Unpaid Fee Challans</h4>
                                        <div className="border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12"><Checkbox checked={unpaidFees.length > 0 && selectedFeeIds.length === unpaidFees.length} onCheckedChange={(checked) => setSelectedFeeIds(checked ? unpaidFees.map(f => f.id) : [])} /></TableHead>
                                                        <TableHead>Challan</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {unpaidFees.length > 0 ? unpaidFees.map(fee => (
                                                        <TableRow key={fee.id}>
                                                            <TableCell><Checkbox checked={selectedFeeIds.includes(fee.id)} onCheckedChange={(checked) => handleFeeSelection(fee.id, !!checked)} /></TableCell>
                                                            <TableCell>{fee.month}, {fee.year}</TableCell>
                                                            <TableCell className="text-right">{fee.amount.toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No unpaid fees.</TableCell></TableRow>}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                                <Button size="lg" onClick={() => handlePrint('single')} disabled={isLoading || selectedFeeIds.length === 0} className="w-full mt-6">
                                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                                    Generate Voucher for {searchedFamily.fatherName}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="all" className="mt-4">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                               <CardTitle>Generate for All Families</CardTitle>
                               <CardDescription>Generate a voucher for every family with outstanding dues.</CardDescription>
                            </div>
                            <Button size="lg" onClick={() => handlePrint('all')} disabled={isLoading} variant="secondary">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Users className="mr-2 h-5 w-5" />}
                                Generate Vouchers for All ({familiesWithDues.length})
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Family ID</TableHead>
                                        <TableHead>Father's Name</TableHead>
                                        <TableHead>Students</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {familiesWithDues.length > 0 ? familiesWithDues.map(family => (
                                        <TableRow key={family.id}>
                                            <TableCell>{family.id}</TableCell>
                                            <TableCell className="font-medium">{family.fatherName}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{getStudentNamesForFamily(family.id)}</TableCell>
                                        </TableRow>
                                    )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No families with unpaid dues.</TableCell></TableRow>}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
      </Tabs>
      
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
