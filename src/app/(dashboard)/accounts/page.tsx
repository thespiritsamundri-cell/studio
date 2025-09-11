
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { format, startOfMonth, endOfMonth, eachYearOfInterval, getYear, getMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Scale, BookCheck, Printer, Landmark, Wallet, Banknote } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { FinancialsPrintReport } from '@/components/reports/financials-print-report';
import { renderToString } from 'react-dom/server';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function AccountsPage() {
    const { fees, expenses, families } = useData();
    const { settings } = useSettings();
    const currentYear = getYear(new Date());
    const currentMonth = getMonth(new Date());

    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

    const handlePrint = () => {
        const reportDate = new Date(selectedYear, selectedMonth);
        const printContent = renderToString(
           <FinancialsPrintReport
                date={reportDate}
                incomeData={monthlyFinancialData.incomeData}
                expenseData={monthlyFinancialData.expenseData}
                totalIncome={monthlyFinancialData.totalIncome}
                totalExpenses={monthlyFinancialData.totalExpenses}
                netProfit={monthlyFinancialData.netProfit}
                settings={settings}
           />
        );

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Financial Report - ${format(reportDate, 'MMMM yyyy')}</title>
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

    const monthlyFinancialData = useMemo(() => {
        const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
        const endDate = endOfMonth(new Date(selectedYear, selectedMonth));

        const monthlyIncome = fees.filter(fee => {
            if (fee.status !== 'Paid' || !fee.paymentDate) return false;
            const paymentDate = new Date(fee.paymentDate);
            return paymentDate >= startDate && paymentDate <= endDate;
        });

        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });

        const totalIncome = monthlyIncome.reduce((acc, fee) => acc + fee.amount, 0);
        const totalExpenses = monthlyExpenses.reduce((acc, exp) => acc + exp.amount, 0);

        const incomeByCategory = monthlyIncome.reduce((acc, fee) => {
            const category = fee.month.includes('Registration') || fee.month.includes('Annual') ? 'One-time Fees' : 'Tuition Fees';
            acc[category] = (acc[category] || 0) + fee.amount;
            return acc;
        }, {} as Record<string, number>);

        const expensesByCategory = monthlyExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            incomeData: Object.entries(incomeByCategory).map(([name, amount]) => ({ name, amount })),
            expenseData: Object.entries(expensesByCategory).map(([name, amount]) => ({ name, amount })),
        };
    }, [fees, expenses, selectedYear, selectedMonth]);
    
    const overallFinancialData = useMemo(() => {
        const totalCashIn = fees.filter(f => f.status === 'Paid').reduce((acc, fee) => acc + fee.amount, 0);
        const totalCashOut = expenses.reduce((acc, exp) => acc + exp.amount, 0);
        const cashInHand = totalCashIn - totalCashOut;
        
        const accountsReceivable = fees.filter(f => f.status === 'Unpaid').reduce((acc, fee) => acc + fee.amount, 0);
        
        const equity = cashInHand + accountsReceivable;
        
        return {
            assets: {
                cashInHand,
                accountsReceivable,
                total: cashInHand + accountsReceivable,
            },
            liabilities: {
                total: 0 // No accounts payable tracked yet
            },
            equity: {
                total: equity
            }
        }
    }, [fees, expenses]);


    const years = eachYearOfInterval({
        start: new Date(currentYear - 5, 0),
        end: new Date(currentYear + 1, 0)
    }).map(date => getYear(date)).reverse();

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: format(new Date(0, i), 'MMMM')
    }));

    const trialBalanceLength = Math.max(monthlyFinancialData.incomeData.length, monthlyFinancialData.expenseData.length);
    const trialBalanceRows = Array.from({ length: trialBalanceLength }, (_, i) => ({
        income: monthlyFinancialData.incomeData[i],
        expense: monthlyFinancialData.expenseData[i]
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><BookCheck /> Financial Accounts</h1>
                    <p className="text-muted-foreground">Generate and review financial reports for your school.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                             {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print P&L
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Income (This Month)</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">PKR {monthlyFinancialData.totalIncome.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card className="bg-red-500/5 border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Expenses (This Month)</CardTitle>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">PKR {monthlyFinancialData.totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card className={monthlyFinancialData.netProfit >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className={cn("text-sm font-medium", monthlyFinancialData.netProfit >=0 ? "text-primary" : "text-destructive")}>Net Profit / Loss</CardTitle>
                        <Scale className={cn("w-4 h-4", monthlyFinancialData.netProfit >=0 ? "text-primary" : "text-destructive")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", monthlyFinancialData.netProfit >=0 ? "text-primary" : "text-destructive")}>PKR {monthlyFinancialData.netProfit.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Tabs defaultValue="pnl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pnl">Profit & Loss Statement</TabsTrigger>
                    <TabsTrigger value="trial">Trial Balance</TabsTrigger>
                    <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                </TabsList>
                <TabsContent value="pnl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profit & Loss Statement</CardTitle>
                            <CardDescription>An itemized summary of income and expenses for {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 text-green-700">Income</h3>
                                    <ScrollArea className="h-60 pr-4">
                                    <Table>
                                        <TableBody>
                                            {monthlyFinancialData.incomeData.map(item => (
                                                <TableRow key={item.name}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell className="text-right font-medium">{item.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </ScrollArea>
                                    <div className="border-t-2 mt-2 pt-2 flex justify-between font-bold text-green-700">
                                        <span>Total Income</span>
                                        <span>{monthlyFinancialData.totalIncome.toLocaleString()}</span>
                                    </div>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-lg mb-2 text-red-700">Expenses</h3>
                                    <ScrollArea className="h-60 pr-4">
                                    <Table>
                                        <TableBody>
                                            {monthlyFinancialData.expenseData.map(item => (
                                                <TableRow key={item.name}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell className="text-right font-medium">{item.amount.toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </ScrollArea>
                                     <div className="border-t-2 mt-2 pt-2 flex justify-between font-bold text-red-700">
                                        <span>Total Expenses</span>
                                        <span>{monthlyFinancialData.totalExpenses.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="trial">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trial Balance</CardTitle>
                            <CardDescription>A summary of all debit and credit accounts for the selected period.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ScrollArea className="h-[345px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-red-700">Debits (Expenses)</TableHead>
                                            <TableHead className="text-right text-red-700">Amount</TableHead>
                                            <TableHead className="text-green-700">Credits (Income)</TableHead>
                                            <TableHead className="text-right text-green-700">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trialBalanceRows.map((row, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{row.expense?.name || ''}</TableCell>
                                                <TableCell className="text-right font-medium">{row.expense?.amount.toLocaleString() || ''}</TableCell>
                                                <TableCell>{row.income?.name || ''}</TableCell>
                                                <TableCell className="text-right font-medium">{row.income?.amount.toLocaleString() || ''}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </ScrollArea>
                             <div className="border-t-2 mt-2 pt-2 flex justify-between font-bold">
                                <div className="flex gap-4">
                                    <span className="text-red-700">Total Debits</span>
                                    <span className="text-red-700">{monthlyFinancialData.totalExpenses.toLocaleString()}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-green-700">Total Credits</span>
                                    <span className="text-green-700">{monthlyFinancialData.totalIncome.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="mt-2 text-center">
                                {monthlyFinancialData.totalIncome === monthlyFinancialData.totalExpenses ? 
                                    <Badge variant="default" className="bg-green-600">Balanced</Badge> : 
                                    <Badge variant="destructive">Not Balanced (Difference: {Math.abs(monthlyFinancialData.totalIncome-monthlyFinancialData.totalExpenses).toLocaleString()})</Badge>
                                }
                            </div>
                        </CardContent>
                     </Card>
                </TabsContent>
                 <TabsContent value="balance-sheet">
                    <Card>
                        <CardHeader>
                            <CardTitle>Balance Sheet</CardTitle>
                            <CardDescription>A snapshot of the school's financial position as of today.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Wallet /> Assets</h3>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Cash & Bank</TableCell>
                                                <TableCell className="text-right">{overallFinancialData.assets.cashInHand.toLocaleString()}</TableCell>
                                            </TableRow>
                                             <TableRow>
                                                <TableCell>Accounts Receivable (Unpaid Fees)</TableCell>
                                                <TableCell className="text-right">{overallFinancialData.assets.accountsReceivable.toLocaleString()}</TableCell>
                                            </TableRow>
                                             <TableRow className="font-bold bg-muted/50">
                                                <TableCell>Total Assets</TableCell>
                                                <TableCell className="text-right">{overallFinancialData.assets.total.toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                                <div>
                                     <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Landmark /> Liabilities & Equity</h3>
                                     <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Accounts Payable</TableCell>
                                                <TableCell className="text-right">{overallFinancialData.liabilities.total.toLocaleString()}</TableCell>
                                            </TableRow>
                                            <TableRow className="font-bold bg-muted/20">
                                                <TableCell>Total Liabilities</TableCell>
                                                <TableCell className="text-right">{overallFinancialData.liabilities.total.toLocaleString()}</TableCell>
                                            </TableRow>
                                             <TableRow>
                                                <TableCell>Owner's Equity</TableCell>
                                                <TableCell className="text-right">{overallFinancialData.equity.total.toLocaleString()}</TableCell>
                                            </TableRow>
                                             <TableRow className="font-bold bg-muted/50">
                                                <TableCell>Total Liabilities & Equity</TableCell>
                                                <TableCell className="text-right">{ (overallFinancialData.liabilities.total + overallFinancialData.equity.total).toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                           </div>
                           <div className="mt-6 text-center">
                                {overallFinancialData.assets.total === (overallFinancialData.liabilities.total + overallFinancialData.equity.total) ? 
                                    <Badge variant="default" className="bg-green-600">Assets = Liabilities + Equity (Balanced)</Badge> : 
                                    <Badge variant="destructive">Balance Sheet is Not Balanced</Badge>
                                }
                            </div>
                        </CardContent>
                     </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

}  
