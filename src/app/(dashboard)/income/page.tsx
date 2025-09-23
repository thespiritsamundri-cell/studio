
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer, Trash2, Edit, Save, PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/context/settings-context';
import { IncomePrintReport } from '@/components/reports/income-report';
import { renderToString } from 'react-dom/server';
import { useSearchParams } from 'next/navigation';

export default function IncomePage() {
  const { fees, families, updateFee, deleteFee, hasPermission } = useData();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const familyIdFromQuery = searchParams.get('familyId');
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [familyFilter, setFamilyFilter] = useState('');

  useEffect(() => {
    if (familyIdFromQuery) {
        setFamilyFilter(familyIdFromQuery);
    }
  }, [familyIdFromQuery]);

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<Fee | null>(null);

  const canManageIncome = hasPermission('income');

  const paidFeesWithDetails = useMemo(() => {
    return fees
      .filter(fee => fee.status === 'Paid' && fee.paymentDate)
      .map(fee => {
        const family = families.find(f => f.id === fee.familyId);
        return { ...fee, fatherName: family?.fatherName || 'N/A' };
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [fees, families]);

  const filteredFees = useMemo(() => {
    let filtered = paidFeesWithDetails;

    if (familyFilter) {
      filtered = filtered.filter(e => 
          e.familyId.toLowerCase().includes(familyFilter.toLowerCase()) ||
          e.fatherName?.toLowerCase().includes(familyFilter.toLowerCase())
      );
    }

    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(e => {
        if (!e.paymentDate) return false;
        const feeDate = new Date(e.paymentDate);
        return feeDate >= dateRange.from! && feeDate <= dateRange.to!;
      });
    } else if (dateRange?.from) {
        filtered = filtered.filter(e => {
            if (!e.paymentDate) return false;
            const feeDate = new Date(e.paymentDate);
            return format(feeDate, 'yyyy-MM-dd') === format(dateRange.from!, 'yyyy-MM-dd');
        });
    }
    return filtered;
  }, [paidFeesWithDetails, dateRange, familyFilter]);
  
  const totalIncome = useMemo(() => {
      return filteredFees.reduce((acc, fee) => acc + fee.amount, 0);
  }, [filteredFees]);

  const handleOpenDialog = (fee: Fee | null) => {
    if (!canManageIncome) return;
    setSelectedFee(fee);
    setIsEditing(!!fee);
    setOpenDialog(true);
  };

  const handleSaveFee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFee) return;

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as {
        paymentDate: string;
        amount: string;
        paymentMethod: string;
    };
    
    if (!data.paymentDate || !data.amount || !data.paymentMethod) {
        toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
        return;
    }

    const feeData: Partial<Fee> = {
        paymentDate: data.paymentDate,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod,
    };

    updateFee(selectedFee.id, feeData);
    toast({ title: 'Income Record Updated' });
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (fee: Fee) => {
    if (!canManageIncome) return;
    setFeeToDelete(fee);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!feeToDelete) return;
    deleteFee(feeToDelete.id);
    toast({ title: "Income Record Deleted", description: "The fee record has been successfully deleted.", variant: "destructive" });
    setOpenDeleteDialog(false);
  };
  
  const triggerPrint = () => {
    const familyName = familyFilter && filteredFees.length > 0 ? filteredFees[0].fatherName : undefined;
    const printContent = renderToString(
      <IncomePrintReport fees={filteredFees} totalIncome={totalIncome} dateRange={dateRange} settings={settings} familyName={familyName} />
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Income</h1>
        <Button onClick={triggerPrint} variant="outline"><Printer className="mr-2 h-4 w-4"/> Print Report</Button>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Income / Fee Collection Report</CardTitle>
            <CardDescription>View a detailed history of all paid fees. Total for selection: PKR {totalIncome.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-8 w-full md:w-[250px]"
                  placeholder="Search by Family ID or Name..."
                  value={familyFilter}
                  onChange={(e) => setFamilyFilter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 flex-grow w-full">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className={cn("w-full md:w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Filter by date range</span>)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                    </PopoverContent>
                  </Popover>
              </div>
               <Button variant="ghost" onClick={() => { setDateRange(undefined); setFamilyFilter(''); }}>Clear Filters</Button>
            </div>
            <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Challan ID</TableHead>
                    <TableHead>Family ID</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Month/Year</TableHead>
                    <TableHead>Method</TableHead>
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
                        <TableCell>{fee.paymentMethod || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{fee.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                           {canManageIncome && (
                             <>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(fee)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(fee)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                             </>
                           )}
                        </TableCell>
                    </TableRow>
                    ))}
                    {filteredFees.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={8} className='text-center py-10 text-muted-foreground'>No income records found for the selected filters.</TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>

       <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will delete the income record and the amount will be added back to the family's unpaid dues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFeeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete & reverse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Income Record</DialogTitle>
                <DialogDescription>
                    Update the details for this paid fee record.
                </DialogDescription>
            </DialogHeader>
            <form id="fee-form" onSubmit={handleSaveFee}>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Fee For</Label>
                        <Input value={`${selectedFee?.fatherName} (Family ID: ${selectedFee?.familyId})`} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={`${selectedFee?.month}, ${selectedFee?.year}`} disabled />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="paymentDate">Payment Date</Label>
                            <Input id="paymentDate" name="paymentDate" type="date" defaultValue={selectedFee?.paymentDate || ''} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (PKR)</Label>
                            <Input id="amount" name="amount" type="number" defaultValue={selectedFee?.amount} required/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Input id="paymentMethod" name="paymentMethod" defaultValue={selectedFee?.paymentMethod} required />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" type="button" onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
