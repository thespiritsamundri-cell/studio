
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
import { TrendingUp, TrendingDown, Scale, BookCheck, Printer } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { FinancialsPrintReport } from '@/components/reports/financials-print-report';
import { renderToString } from 'react-dom/server';


export default function AccountsPage() {
    const { fees, expenses } = useData();
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
                incomeData={incomeData}
                expenseData={expenseData}
                totalIncome={totalIncome}
                totalExpenses={totalExpenses}
                netProfit={netProfit}
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

    const financialData = useMemo(() => {
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
            // Simple categorization for now
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

    const { totalIncome, totalExpenses, netProfit, incomeData, expenseData } = financialData;

    const years = eachYearOfInterval({
        start: new Date(currentYear - 5, 0),
        end: new Date(currentYear + 1, 0)
    }).map(date => getYear(date)).reverse();

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: format(new Date(0, i), 'MMMM')
    }));

    const trialBalanceLength = Math.max(incomeData.length, expenseData.length);
    const trialBalanceRows = Array.from({ length: trialBalanceLength }, (_, i) => ({
        income: incomeData[i],
        expense: expenseData[i]
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><BookCheck /> Financial Reports</h1>
                    <p className="text-muted-foreground">Generate monthly financial reports for your school.</p>
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
                        <Printer className="mr-2 h-4 w-4" /> Print Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">Total Income</CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">PKR {totalIncome.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card className="bg-red-500/5 border-red-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">PKR {totalExpenses.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card className={netProfit >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className={cn("text-sm font-medium", netProfit >=0 ? "text-primary" : "text-destructive")}>Net Profit / Loss</CardTitle>
                        <Scale className={cn("w-4 h-4", netProfit >=0 ? "text-primary" : "text-destructive")} />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", netProfit >=0 ? "text-primary" : "text-destructive")}>PKR {netProfit.toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle>Profit & Loss Statement</CardTitle>
                        <CardDescription>An itemized summary of income and expenses for {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-green-700">Income</h3>
                                <ScrollArea className="h-60 pr-4">
                                <Table>
                                    <TableBody>
                                        {incomeData.map(item => (
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
                                    <span>{totalIncome.toLocaleString()}</span>
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg mb-2 text-red-700">Expenses</h3>
                                <ScrollArea className="h-60 pr-4">
                                <Table>
                                    <TableBody>
                                        {expenseData.map(item => (
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
                                    <span>{totalExpenses.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Trial Balance</CardTitle>
                        <CardDescription>A summary of all debit and credit accounts for the period.</CardDescription>
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
                                <span className="text-red-700">{totalExpenses.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-green-700">Total Credits</span>
                                <span className="text-green-700">{totalIncome.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-center">
                            {totalIncome === totalExpenses ? 
                                <Badge variant="default" className="bg-green-600">Balanced</Badge> : 
                                <Badge variant="destructive">Not Balanced (Difference: {Math.abs(totalIncome-totalExpenses).toLocaleString()})</Badge>
                            }
                        </div>
                    </CardContent>
                 </Card>
            </div>

        </div>
    );
}
