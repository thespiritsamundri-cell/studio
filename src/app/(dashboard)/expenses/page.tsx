

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer, Trash2, Edit, Save, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useSettings } from '@/context/settings-context';
import type { Expense } from '@/lib/types';
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
import { ExpenseVoucherPrint } from '@/components/reports/expense-voucher-print';
import { renderToString } from 'react-dom/server';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { openPrintWindow } from '@/lib/print-helper';

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);


  const expenseCategories = useMemo(() => settings.expenseCategories || ['Salaries', 'Utilities', 'Rent', 'Maintenance', 'Supplies', 'Marketing', 'Transportation', 'Miscellaneous'], [settings.expenseCategories]);

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !expenseCategories.includes(newCategoryName.trim())) {
      const updatedCategories = [...expenseCategories, newCategoryName.trim()];
      setSettings(prev => ({...prev, expenseCategories: updatedCategories}));
      setNewCategoryName('');
      toast({ title: 'Category Added', description: `"${newCategoryName}" has been added.`});
    }
  };

  const handleUpdateCategory = () => {
    if (editingCategory && newCategoryName.trim()) {
      const updatedCategories = expenseCategories.map(cat => cat === editingCategory ? newCategoryName.trim() : cat);
      setSettings(prev => ({ ...prev, expenseCategories: updatedCategories }));
      setNewCategoryName('');
      setEditingCategory(null);
      toast({ title: 'Category Updated', description: `"${editingCategory}" has been updated to "${newCategoryName.trim()}".`});
    }
  };
  
  const handleDeleteCategory = (category: string) => {
      // Optional: Check if category is in use
      const isUsed = expenses.some(exp => exp.category === category);
      if(isUsed) {
        toast({ title: 'Cannot Delete', description: `Category "${category}" is currently in use.`, variant: 'destructive'});
        return;
      }
      const updatedCategories = expenseCategories.filter(cat => cat !== category);
      setSettings(prev => ({...prev, expenseCategories: updatedCategories}));
      toast({ title: 'Category Deleted', description: `"${category}" has been removed.`});
  }


  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(e => {
        if (!e.date) return false;
        const expenseDate = new Date(e.date);
        return expenseDate >= dateRange.from! && expenseDate <= dateRange.to!;
      });
    } else if (dateRange?.from) {
        filtered = filtered.filter(e => {
            if (!e.date) return false;
            const expenseDate = new Date(e.date);
            return format(expenseDate, 'yyyy-MM-dd') === format(dateRange.from!, 'yyyy-MM-dd');
        });
    }

    return filtered.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
  }, [expenses, dateRange, categoryFilter]);
  
  const totalExpenses = useMemo(() => {
      return filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [filteredExpenses]);

  const handleOpenDialog = (expense: Expense | null) => {
    setSelectedExpense(expense);
    setIsEditing(!!expense);
    setOpenDialog(true);
  };

  const handleSaveExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as {
        date: string;
        category: string;
        description: string;
        amount: string;
        vendor: string;
    };
    
    if (!data.date || !data.category || !data.description || !data.amount) {
        toast({ title: "Missing Information", description: "Please fill all required fields.", variant: "destructive" });
        return;
    }

    const expenseData: Omit<Expense, 'id'> = {
        date: data.date,
        category: data.category,
        description: data.description,
        amount: Number(data.amount),
        vendor: data.vendor
    };

    if (isEditing && selectedExpense) {
      updateExpense(selectedExpense.id, { ...selectedExpense, ...expenseData });
      toast({ title: 'Expense Updated', description: `Expense for ${expenseData.category} has been updated.` });
    } else {
      addExpense(expenseData);
      toast({ title: 'Expense Added', description: `New expense of PKR ${expenseData.amount} has been added.` });
    }
    setOpenDialog(false);
  };

  const handleOpenDeleteDialog = (expense: Expense) => {
    setExpenseToDelete(expense);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!expenseToDelete) return;
    deleteExpense(expenseToDelete.id);
    setOpenDeleteDialog(false);
  };
  
  const triggerPrint = (expense: Expense) => {
    const printContent = renderToString(
      <ExpenseVoucherPrint expense={expense} settings={settings} />
    );
    openPrintWindow(printContent, `Expense Voucher - ${expense.id}`, '/print/expense.css');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Expenses</h1>
        <div className='flex gap-2'>
            <Button variant="outline" onClick={() => setOpenCategoryDialog(true)}>Manage Categories</Button>
            <Button onClick={() => handleOpenDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/> Add Expense</Button>
        </div>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Expenses Report</CardTitle>
            <CardDescription>View a detailed history of all school expenses. Total for selection: PKR {totalExpenses.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 flex-grow w-full">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by category..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="date" variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                    </PopoverContent>
                  </Popover>
              </div>
               <Button variant="ghost" onClick={() => { setDateRange(undefined); setCategoryFilter(''); }}>Clear Filters</Button>
            </div>
            <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="hidden md:table-cell">Voucher ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden lg:table-cell">Vendor</TableHead>
                    <TableHead className="text-right">Amount (PKR)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                        <TableCell className="hidden md:table-cell">{expense.id}</TableCell>
                        <TableCell className="font-medium">{expense.date ? format(new Date(expense.date), 'PPP') : 'N/A'}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="hidden lg:table-cell">{expense.vendor || 'N/A'}</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">{expense.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerPrint(expense)}>
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Print Voucher</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(expense)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                    {filteredExpenses.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>No expense records found for the selected filters.</TableCell>
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
              This will permanently delete the expense record for <strong>{expenseToDelete?.description}</strong> of <strong>PKR {expenseToDelete?.amount.toLocaleString()}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                <DialogDescription>
                    {isEditing ? 'Update the details for this expense.' : 'Enter the details for a new expense.'}
                </DialogDescription>
            </DialogHeader>
            <form id="expense-form" onSubmit={handleSaveExpense}>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" name="date" type="date" defaultValue={selectedExpense?.date || format(new Date(), 'yyyy-MM-dd')} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select name="category" defaultValue={selectedExpense?.category || ''} required>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="e.g., Teacher salaries for May" defaultValue={selectedExpense?.description} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="amount">Amount (PKR)</Label>
                            <Input id="amount" name="amount" type="number" placeholder="e.g., 50000" defaultValue={selectedExpense?.amount} required/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor / Payee (Optional)</Label>
                            <Input id="vendor" name="vendor" placeholder="e.g., Staff, WAPDA" defaultValue={selectedExpense?.vendor} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" type="button" onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button type="submit"><Save className="mr-2 h-4 w-4"/> {isEditing ? 'Save Changes' : 'Add Expense'}</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
      
       <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Manage Expense Categories</DialogTitle>
                <DialogDescription>Add, edit, or remove expense categories.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter new category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                editingCategory ? handleUpdateCategory() : handleAddCategory();
                            }
                        }}
                    />
                    <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                        {editingCategory ? 'Update' : 'Add'}
                    </Button>
                     {editingCategory && <Button variant="ghost" onClick={() => { setEditingCategory(null); setNewCategoryName(''); }}>Cancel</Button>}
                </div>
                <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                        <TableBody>
                            {expenseCategories.map(cat => (
                                <TableRow key={cat}>
                                    <TableCell className="font-medium">{cat}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setNewCategoryName(cat); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </DialogContent>
       </Dialog>
    </div>
  );
}
