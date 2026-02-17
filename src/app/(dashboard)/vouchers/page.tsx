
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  voucherId: string;
}

export default function VouchersPage() {
  const { classes } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [allFamilies, setAllFamilies] = useState<Family[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allFees, setAllFees] = useState<Fee[]>([]);

  // State for Individual Voucher
  const [individualFamilyId, setIndividualFamilyId] = useState('');
  const [searchedFamily, setSearchedFamily] = useState<Family | null>(null);
  const [individualIssueDate, setIndividualIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [individualDueDate, setIndividualDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 10)), 'yyyy-MM-dd'));
  const [individualLateFee, setIndividualLateFee] = useState(50);
  const [individualAnnualCharges, setIndividualAnnualCharges] = useState(0);
  const [individualBoardRegFee, setIndividualBoardRegFee] = useState(0);
  const [isPrintingIndividual, setIsPrintingIndividual] = useState(false);

  // State for Bulk Vouchers
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);
  const [bulkClassFilter, setBulkClassFilter] = useState('all');
  const [isLoadingBulk, setIsLoadingBulk] = useState(false);
  const [bulkIssueDate, setBulkIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bulkDueDate, setBulkDueDate] = useState(format(new Date(new Date().setDate(new Date().getDate() + 10)), 'yyyy-MM-dd'));
  const [bulkLateFee, setBulkLateFee] = useState(50);
  const [bulkAnnualCharges, setBulkAnnualCharges] = useState(0);
  const [bulkBoardRegFee, setBulkBoardRegFee] = useState(0);
  
  useEffect(() => {
    const fetchInitialData = async () => {
        const familiesQuery = query(collection(db, 'families'), where('status', '!=', 'Archived'));
        const studentsQuery = query(collection(db, 'students'), where('status', '!=', 'Archived'));
        const feesQuery = query(collection(db, 'fees'));
        
        const [familiesSnapshot, studentsSnapshot, feesSnapshot] = await Promise.all([
            getDocs(familiesQuery),
            getDocs(studentsQuery),
            getDocs(feesQuery),
        ]);

        setAllFamilies(familiesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Family)));
        setAllStudents(studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
        setAllFees(feesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Fee)));
    };
    fetchInitialData();
  }, []);

  // --- Individual Voucher Logic ---
  const handleIndividualSearch = () => {
    if (!individualFamilyId) return;
    const family = allFamilies.find(f => f.id === individualFamilyId);
    if (family) {
      setSearchedFamily(family);
      toast({ title: 'Family Found', description: `Displaying details for ${family.fatherName}` });
    } else {
      setSearchedFamily(null);
      toast({ title: 'Not Found', description: `No family with ID "${individualFamilyId}"`, variant: 'destructive' });
    }
  };
  
    const generateVoucherDataForFamily = (familyId: string, issueDate: string, dueDate: string, lateFee: number, annualCharges: number, boardRegFee: number): VoucherData | null => {
      const family = allFamilies.find(f => f.id === familyId);
      if (!family) return null;

      const familyUnpaidFees = allFees.filter(fee => fee.familyId === family.id && fee.status === 'Unpaid');
      if (familyUnpaidFees.length === 0 && annualCharges === 0 && boardRegFee === 0) return null;

      const feeMonths = [...new Set(familyUnpaidFees.map(f => f.month))].join(', ');
            
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
          concession: 0, // Concession logic can be added here if needed
      };
      
      const grandTotal = feeItems.monthlyFee + feeItems.admissionFee + feeItems.pendingDues + feeItems.annualCharges + feeItems.boardRegFee - feeItems.concession;
      const voucherId = `VCH-${family.id}-${Date.now()}`;
      
      return {
          issueDate: issueDate,
          dueDate: dueDate,
          feeMonths: feeMonths,
          feeItems,
          grandTotal,
          voucherId,
      };
  }

  const individualVoucherData = useMemo(() => {
    if (!searchedFamily) return null;
    return generateVoucherDataForFamily(searchedFamily.id, individualIssueDate, individualDueDate, individualLateFee, individualAnnualCharges, individualBoardRegFee);
  }, [searchedFamily, allFees, individualIssueDate, individualDueDate, individualLateFee, individualAnnualCharges, individualBoardRegFee, allFamilies]);

  const handlePrintIndividual = async () => {
    if (!searchedFamily || !individualVoucherData) return;
    const familyStudents = allStudents.filter(s => s.familyId === searchedFamily.id);
    if (familyStudents.length === 0) {
      toast({ title: 'No Students Found', description: `Family ${searchedFamily.id} has no active students.`, variant: 'destructive' });
      return;
    }

    setIsPrintingIndividual(true);
    
    let qrCodeDataUri = '';
    try {
        const url = `${window.location.origin}/receipt/${individualVoucherData.voucherId}`;
        const qrResult = await generateQrCode({ content: url });
        qrCodeDataUri = qrResult.qrCodeDataUri;
    } catch(e) {
        toast({ title: 'QR Generation Failed', variant: 'destructive'});
    }

    const voucherToPrint = { family: searchedFamily, students: familyStudents, voucherData: individualVoucherData, qrCodeDataUri };

    setTimeout(() => {
        const printContent = renderToString(
            <FeeVoucherPrint allVouchersData={[voucherToPrint]} settings={settings} />
        );
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Fee Voucher - ${searchedFamily.id}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
        }
        setIsPrintingIndividual(false);
    }, 500);
  };


  // --- Bulk Voucher Logic ---
  const handleBulkClassFilter = (className: string) => {
    setBulkClassFilter(className);
    if (className === 'all') {
        setSelectedFamilyIds(allFamilies.filter(f => f.status !== 'Archived').map(f => f.id));
        return;
    }
    const studentFamilyIds = allStudents.filter(s => s.class === className).map(s => s.familyId);
    const uniqueFamilyIds = [...new Set(studentFamilyIds)];
    setSelectedFamilyIds(uniqueFamilyIds);
  };
  
  useEffect(() => {
    setSelectedFamilyIds(allFamilies.filter(f => f.status !== 'Archived').map(f => f.id));
  }, [allFamilies]);

  const familiesForBulkSelection = useMemo(() => {
      return allFamilies.filter(f => f.status !== 'Archived');
  }, [allFamilies]);

  const handleSelectFamily = (familyId: string) => {
    setSelectedFamilyIds(prev =>
      prev.includes(familyId) ? prev.filter(id => id !== familyId) : [...prev, familyId]
    );
  };

  const isAllSelected = familiesForBulkSelection.length > 0 && selectedFamilyIds.length === familiesForBulkSelection.length;
  const handleSelectAll = (checked: boolean) => setSelectedFamilyIds(checked ? familiesForBulkSelection.map(f => f.id) : []);


  const handleBulkPrint = async () => {
    if(selectedFamilyIds.length === 0){
      toast({title: "No families selected.", variant: "destructive"});
      return;
    }
    setIsLoadingBulk(true);
    toast({ title: "Generating Vouchers...", description: `Please wait while we prepare vouchers for ${selectedFamilyIds.length} families.`});

    const allVouchersData: { family: Family; students: Student[]; voucherData: VoucherData, qrCodeDataUri: string }[] = [];

    for (const familyId of selectedFamilyIds) {
        const family = allFamilies.find(f => f.id === familyId);
        if (!family || family.status === 'Archived') continue;

        const familyStudents = allStudents.filter(s => s.familyId === family.id && s.status === 'Active');
        if (familyStudents.length === 0) continue;

        const voucherData = generateVoucherDataForFamily(familyId, bulkIssueDate, bulkDueDate, bulkLateFee, bulkAnnualCharges, bulkBoardRegFee);
        if (voucherData && voucherData.grandTotal > 0) {
            let qrCodeDataUri = '';
            try {
                const url = `${window.location.origin}/receipt/${voucherData.voucherId}`;
                const qrResult = await generateQrCode({ content: url });
                qrCodeDataUri = qrResult.qrCodeDataUri;
            } catch(e) {
                console.error(`QR generation failed for family ${familyId}`);
            }
            allVouchersData.push({ family, students: familyStudents, voucherData, qrCodeDataUri });
        }
    }
    
    if (allVouchersData.length === 0) {
        toast({ title: "No Dues Found", description: "None of the selected families have outstanding fees.", variant: "destructive"});
        setIsLoadingBulk(false);
        return;
    }

    const printContent = renderToString(
        <FeeVoucherPrint allVouchersData={allVouchersData} settings={settings} />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Fee Vouchers</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
    }

    setIsLoadingBulk(false);
    toast({ title: "Vouchers Generated!", description: `Successfully generated vouchers for ${allVouchersData.length} families.`});

  };


  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline">Fee Vouchers</h1>
        </div>

        {/* Individual Voucher Section */}
        <Card>
            <CardHeader>
                <CardTitle>Individual Fee Voucher</CardTitle>
                <CardDescription>Search for a family by their ID to generate a single fee voucher.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input placeholder="Family ID" value={individualFamilyId} onChange={e => setIndividualFamilyId(e.target.value)} />
                    <Button onClick={handleIndividualSearch}><Search className="h-4 w-4 mr-2"/>Search</Button>
                </div>

                {searchedFamily && individualVoucherData && (
                    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-bold text-lg">{searchedFamily.fatherName} (ID: {searchedFamily.id})</h3>
                        <p className="text-sm text-muted-foreground">Students: {allStudents.filter(s => s.familyId === searchedFamily.id).map(s => s.name).join(', ')}</p>
                        <p className="font-semibold mt-2">Total Dues: PKR {individualVoucherData.grandTotal}</p>
                        <Separator className="my-4"/>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                             <div className="space-y-2">
                                <Label htmlFor="ind-issueDate">Issue Date</Label>
                                <Input id="ind-issueDate" type="date" value={individualIssueDate} onChange={e => setIndividualIssueDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ind-dueDate">Due Date</Label>
                                <Input id="ind-dueDate" type="date" value={individualDueDate} onChange={e => setIndividualDueDate(e.target.value)} />
                            </div>
                            <Button onClick={handlePrintIndividual} disabled={isPrintingIndividual}>
                                {isPrintingIndividual ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                                Print Voucher
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Bulk Voucher Section */}
        <Card>
            <CardHeader>
                <CardTitle>Bulk Fee Vouchers</CardTitle>
                <CardDescription>Select multiple families, either by class or individually, to generate vouchers in bulk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label>Step 1: Select Families</Label>
                     <div className="flex items-center gap-4 mt-2">
                         <Select onValueChange={handleBulkClassFilter} value={bulkClassFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filter by Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Families</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">{selectedFamilyIds.length} families selected.</p>
                     </div>
                    <ScrollArea className="h-72 w-full rounded-md border mt-2">
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[50px]"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead><TableHead>Family ID</TableHead><TableHead>Father's Name</TableHead><TableHead>Students</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {familiesForBulkSelection.map(family => (
                                    <TableRow key={family.id} data-state={selectedFamilyIds.includes(family.id) && "selected"}>
                                        <TableCell><Checkbox checked={selectedFamilyIds.includes(family.id)} onCheckedChange={() => handleSelectFamily(family.id)} /></TableCell>
                                        <TableCell>{family.id}</TableCell>
                                        <TableCell>{family.fatherName}</TableCell>
                                        <TableCell><div className="flex items-center gap-1 text-xs"><Users className="h-3 w-3"/>{allStudents.filter(s => s.familyId === family.id).length}</div></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <Label>Step 2: Configure Voucher Details</Label>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={bulkIssueDate} onChange={e => setBulkIssueDate(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={bulkDueDate} onChange={e => setBulkDueDate(e.target.value)} /></div>
                    </div>
                     <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3 text-sm">Additional Charges (Applied to ALL selected families)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2"><Label>Annual Charges</Label><Input type="number" value={bulkAnnualCharges} onChange={e => setBulkAnnualCharges(Number(e.target.value))} /></div>
                            <div className="space-y-2"><Label>Board Reg / Other</Label><Input type="number" value={bulkBoardRegFee} onChange={e => setBulkBoardRegFee(Number(e.target.value))} /></div>
                            <div className="space-y-2"><Label>Late Fee Fine</Label><Input type="number" value={bulkLateFee} onChange={e => setBulkLateFee(Number(e.target.value))} /></div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-4">
                <Button size="lg" onClick={handleBulkPrint} disabled={isLoadingBulk}>
                    {isLoadingBulk ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Printer className="mr-2 h-5 w-5" />}
                    Generate & Print ({selectedFamilyIds.length})
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
