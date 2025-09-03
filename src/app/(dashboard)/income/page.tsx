
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer, FileSpreadsheet, Trash2, Edit, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IncomePrintReport } from '@/components/reports/income-report';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import type { Fee } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';


export default function IncomePage() {
  const { fees: allFees, families, deleteFee, updateFee, addFee } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [familyIdFilter, setFamilyIdFilter] = useState('');
  const [feeToCancel, setFeeToCancel] = useState<Fee | null>(null);
  
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [feeToEdit, setFeeToEdit] = useState<Fee | null>(null);
  const [editAmount, setEditAmount] = useState(0);


  const paidFees = useMemo(() => {
    return allFees
      .filter((fee) => fee.status === 'Paid' && fee.paymentDate)
      .map(fee => {
        const family = families.find(f => f.id === fee.familyId);
        return { ...fee, fatherName: family?.fatherName || 'N/A' };
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [allFees, families]);

  const filteredFees = useMemo(() => {
    let fees = paidFees;

    if (familyIdFilter) {
      fees = fees.filter(fee => fee.familyId.toLowerCase().includes(familyIdFilter.toLowerCase()));
    }

    if (dateRange?.from && dateRange?.to) {
      fees = fees.filter(fee => {
        const paymentDate = new Date(fee.paymentDate);
        return paymentDate >= dateRange.from! && paymentDate <= dateRange.to!;
      });
    } else if (dateRange?.from) {
        fees = fees.filter(fee => {
            const paymentDate = new Date(fee.paymentDate);
            return format(paymentDate, 'yyyy-MM-dd') === format(dateRange.from!, 'yyyy-MM-dd');
        });
    }

    return fees;
  }, [paidFees, dateRange, familyIdFilter]);
  
  const totalIncome = useMemo(() => {
      return filteredFees.reduce((acc, fee) => acc + fee.amount, 0);
  }, [filteredFees]);

  const handleOpenCancelDialog = (fee: Fee) => {
    setFeeToCancel(fee);
  };
  
  const handleConfirmCancel = () => {
    if (!feeToCancel) return;

    const originalChallanId = feeToCancel.originalChallanId;
    if (!originalChallanId) {
        toast({ title: 'Error', description: 'Cannot find original challan to revert. This might be a legacy record.', variant: 'destructive' });
        setFeeToCancel(null);
        return;
    }
    
    const existingChallan = allFees.find(f => f.id === originalChallanId);

    if (existingChallan) {
        const revertedChallan: Fee = {
            ...existingChallan,
            amount: existingChallan.amount + feeToCancel.amount,
        };
        updateFee(existingChallan.id, revertedChallan);
    } else {
        const newChallan: Fee = {
            id: originalChallanId,
            familyId: feeToCancel.familyId,
            amount: feeToCancel.amount,
            month: feeToCancel.month,
            year: feeToCancel.year,
            status: 'Unpaid',
            paymentDate: '',
        };
        addFee(newChallan);
    }

    deleteFee(feeToCancel.id);

    toast({
        title: 'Payment Cancelled',
        description: `Payment of PKR ${feeToCancel.amount.toLocaleString()} has been successfully reversed.`,
    });

    setFeeToCancel(null);
  };

  const handleOpenEditDialog = (fee: Fee) => {
    setFeeToEdit(fee);
    setEditAmount(fee.amount);
    setOpenEditDialog(true);
  };

  const handleConfirmEdit = () => {
    if (!feeToEdit || editAmount < 0) {
      toast({ title: "Invalid amount", variant: "destructive"});
      return;
    }

    const difference = feeToEdit.amount - editAmount;
    
    if (difference === 0) {
      toast({ title: "No Changes", description: "The amount is the same." });
      setOpenEditDialog(false);
      return;
    }
    
    if (difference > 0) { 
      const originalChallanId = feeToEdit.originalChallanId;
       if (!originalChallanId) {
          toast({ title: 'Error', description: 'Cannot find original challan to revert to. This might be a legacy record.', variant: 'destructive' });
          return;
       }
       
       const existingChallan = allFees.find(f => f.id === originalChallanId);
       if (existingChallan) {
           updateFee(existingChallan.id, { ...existingChallan, amount: existingChallan.amount + difference });
       } else {
            let lastFeeId = allFees.reduce((max, f) => {
                const idNum = parseInt(f.id.replace('A', ''), 10);
                return !isNaN(idNum) && idNum > max ? idNum : max;
            }, 0);
           addFee({
               id: `A${String(++lastFeeId).padStart(3, '0')}`,
               familyId: feeToEdit.familyId,
               amount: difference,
               month: feeToEdit.month,
               year: feeToEdit.year,
               status: 'Unpaid',
               paymentDate: '',
           });
       }
    } else { 
       toast({ title: 'Not Supported', description: 'Increasing a payment amount is not supported. Please cancel and re-enter.', variant: 'destructive'});
       return;
    }

    updateFee(feeToEdit.id, { ...feeToEdit, amount: editAmount });
    
    toast({ title: "Payment Updated", description: `Payment has been adjusted to PKR ${editAmount.toLocaleString()}`});
    setOpenEditDialog(false);
  };
  
  const triggerPrint = () => {
    const printContent = renderToString(
      <IncomePrintReport fees={filteredFees} totalIncome={totalIncome} dateRange={dateRange} settings={settings} />
    );
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Income Report</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleExportCsv = () => {
    const headers = ['Payment ID', 'Family ID', "Father's Name", 'Payment Date', 'Description', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredFees.map((fee) => 
        [
          fee.id,
          fee.familyId,
          `"${fee.fatherName}"`,
          fee.paymentDate ? format(new Date(fee.paymentDate), 'yyyy-MM-dd') : '',
          `${fee.month}, ${fee.year}`,
          fee.amount
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'income-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold font-headline">Income</h1>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Income Report</CardTitle>
            <CardDescription>View a detailed history of all collected fees. Total income for selection: PKR {totalIncome.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-4 flex-grow">
                  <Input
                    placeholder="Filter by Family ID..."
                    value={familyIdFilter}
                    onChange={(e) => setFamilyIdFilter(e.target.value)}
                    className="max-w-xs"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-[300px] justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="ghost" onClick={() => { setDateRange(undefined); setFamilyIdFilter(''); }}>Clear Filters</Button>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={triggerPrint}><Printer className="mr-2 h-4 w-4" />Print Report</Button>
                  <Button variant="outline" onClick={handleExportCsv}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel Export</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Family ID</TableHead>
                  <TableHead>Father's Name</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount (PKR)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>{fee.id}</TableCell>
                    <TableCell className="font-medium">{fee.familyId}</TableCell>
                    <TableCell>{fee.fatherName}</TableCell>
                    <TableCell>{fee.paymentDate && format(new Date(fee.paymentDate), 'PPP')}</TableCell>
                    <TableCell>{fee.month}, {fee.year}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{fee.amount.toLocaleString()}</TableCell>
                     <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(fee)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Payment</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenCancelDialog(fee)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Cancel Payment</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredFees.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>No income records found for the selected filters.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={!!feeToCancel} onOpenChange={(open) => !open && setFeeToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel the payment of <strong>PKR {feeToCancel?.amount.toLocaleString()}</strong> for Family <strong>{feeToCancel?.familyId}</strong> ({feeToCancel?.fatherName}). The amount will be added back to the family's outstanding dues. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeeToCancel(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive hover:bg-destructive/90">
              Yes, cancel payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Payment</DialogTitle>
                <DialogDescription>
                    Adjust the payment amount. The difference will be returned to the family's outstanding dues.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>Family</Label>
                    <Input value={`${feeToEdit?.fatherName} (ID: ${feeToEdit?.familyId})`} disabled />
                </div>
                <div className="space-y-2">
                    <Label>Original Paid Amount</Label>
                    <Input value={`PKR ${feeToEdit?.amount.toLocaleString()}`} disabled />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="edit-amount">New Paid Amount (PKR)</Label>
                    <Input 
                        id="edit-amount" 
                        type="number" 
                        value={editAmount} 
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        max={feeToEdit?.amount}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                <Button onClick={handleConfirmEdit}><Save className="mr-2 h-4 w-4"/> Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
