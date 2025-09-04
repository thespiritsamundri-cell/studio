
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useData } from '@/context/data-context';
import { getYear, getMonth, format, startOfMonth, endOfMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Scale, Users, FileSignature, PieChart as PieChartIcon, BarChart3, Medal, Percent, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { YearlyFinancialPrintReport } from '@/components/reports/yearly-financial-report';
import { YearlyAdmissionsPrintReport } from '@/components/reports/yearly-admissions-report';
import { YearlyAcademicPrintReport } from '@/components/reports/yearly-academic-report';


const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function YearbookPage() {
    const { fees, expenses, students, exams, classes, teacherAttendances } = useData();
    const { settings } = useSettings();
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
    const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 0-11

    const years = useMemo(() => {
        const allYears = new Set<number>();
        fees.forEach(f => allYears.add(f.year));
        expenses.forEach(e => allYears.add(getYear(new Date(e.date))));
        students.forEach(s => allYears.add(getYear(new Date(s.admissionDate))));
        if(allYears.size === 0) allYears.add(getYear(new Date()));
        return Array.from(allYears).sort((a,b) => b-a);
    }, [fees, expenses, students]);
    
    const months = Array.from({ length: 12 }, (_, i) => ({
        value: String(i),
        label: format(new Date(0, i), 'MMMM')
    }));

    // Financial Data Memoization
    const yearlyFinancialData = useMemo(() => {
        const isMonthView = selectedMonth !== 'all';
        const monthIndex = parseInt(selectedMonth, 10);
        
        const yearlyIncome = fees.filter(f => {
            if (f.status !== 'Paid' || !f.paymentDate) return false;
            const paymentDate = new Date(f.paymentDate);
            const yearMatch = getYear(paymentDate) === selectedYear;
            if (!isMonthView) return yearMatch;
            return yearMatch && getMonth(paymentDate) === monthIndex;
        });

        const yearlyExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            const yearMatch = getYear(expenseDate) === selectedYear;
            if (!isMonthView) return yearMatch;
            return yearMatch && getMonth(expenseDate) === monthIndex;
        });


        const totalIncome = yearlyIncome.reduce((acc, fee) => acc + fee.amount, 0);
        const totalExpenses = yearlyExpenses.reduce((acc, exp) => acc + exp.amount, 0);

        const monthlyBreakdown = Array.from({length: 12}, (_, i) => ({
            name: format(new Date(selectedYear, i), 'MMM'),
            income: 0,
            expenses: 0
        }));

        if (!isMonthView) {
            fees.filter(f => f.status === 'Paid' && f.paymentDate && getYear(new Date(f.paymentDate)) === selectedYear).forEach(f => {
                if (!f.paymentDate) return;
                const month = getMonth(new Date(f.paymentDate));
                monthlyBreakdown[month].income += f.amount;
            });

            expenses.filter(e => getYear(new Date(e.date)) === selectedYear).forEach(e => {
                const month = getMonth(new Date(e.date));
                monthlyBreakdown[month].expenses += e.amount;
            });
        }
        
        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            monthlyBreakdown,
        };
    }, [fees, expenses, selectedYear, selectedMonth]);

    // Admissions Data Memoization
    const yearlyAdmissionsData = useMemo(() => {
        const admissions = students.filter(s => getYear(new Date(s.admissionDate)) === selectedYear);
        const totalAdmissions = admissions.length;

        const monthlyAdmissions = Array.from({ length: 12 }, (_, i) => ({
             name: format(new Date(selectedYear, i), 'MMM'),
             count: 0
        }));

        admissions.forEach(s => {
            const month = getMonth(new Date(s.admissionDate));
            monthlyAdmissions[month].count += 1;
        });

        const classDistribution = admissions.reduce((acc, student) => {
            acc[student.class] = (acc[student.class] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const classDistributionChartData = Object.entries(classDistribution)
            .map(([name, value], i) => ({ name, value, fill: chartColors[i % chartColors.length] }));

        return { totalAdmissions, monthlyAdmissions, classDistributionChartData };
    }, [students, selectedYear]);

    // Academic Data Memoization
    const yearlyAcademicData = useMemo(() => {
        let classResults: { [className: string]: { pass: number, fail: number, total: number } } = {};
        classes.forEach(c => {
            classResults[c.name] = { pass: 0, fail: 0, total: students.filter(s => s.class === c.name).length };
        });

        const examsForYear = exams.filter(e => {
            const examYearFromName = e.name.match(/\d{4}/);
            return examYearFromName ? parseInt(examYearFromName[0]) === selectedYear : true;
        });

        const studentOverallPercentages: { [studentId: string]: { totalMarks: number, obtainedMarks: number } } = {};

        examsForYear.forEach(exam => {
            exam.results.forEach(result => {
                const total = Object.values(exam.subjectTotals).reduce((a, b) => a + b, 0);
                const obtained = Object.values(result.marks).reduce((a, b) => a + b, 0);

                if (!studentOverallPercentages[result.studentId]) {
                    studentOverallPercentages[result.studentId] = { totalMarks: 0, obtainedMarks: 0 };
                }
                studentOverallPercentages[result.studentId].totalMarks += total;
                studentOverallPercentages[result.studentId].obtainedMarks += obtained;
            });
        });

        let topStudents: {id: string, name: string, class: string, percentage: number}[] = [];

        Object.keys(studentOverallPercentages).forEach(studentId => {
            const student = students.find(s => s.id === studentId);
            if (!student) return;
            const { totalMarks, obtainedMarks } = studentOverallPercentages[studentId];
            if (totalMarks > 0) {
                const percentage = (obtainedMarks / totalMarks) * 100;
                topStudents.push({ id: student.id, name: student.name, class: student.class, percentage });
                if (percentage >= 40) {
                    classResults[student.class].pass++;
                } else {
                    classResults[student.class].fail++;
                }
            }
        });

        topStudents.sort((a,b) => b.percentage - a.percentage).slice(0, 10);
        
        // Placeholder for attendance - needs real data
        const classAttendance = classes.map(c => ({
            name: c.name,
            rate: 90 + Math.random() * 10 // Mock data
        }));

        return { classResults, topStudents, classAttendance };
    }, [exams, students, classes, selectedYear]);

    const financialChartConfig = {
        income: { label: "Income", color: "hsl(var(--chart-2))" },
        expenses: { label: "Expenses", color: "hsl(var(--chart-5))" },
    };

    const admissionsChartConfig = {
        count: { label: "Admissions", color: "hsl(var(--chart-1))" },
    };
    
    const classDistributionChartConfig = yearlyAdmissionsData.classDistributionChartData.reduce((acc, item) => {
        acc[item.name] = { label: item.name, color: item.fill };
        return acc;
    }, {} as any);
    
    const handlePrint = (type: 'financial' | 'admissions' | 'academic') => {
        let printContent: string = '';
        let title: string = '';

        if (type === 'financial') {
            title = `Financial Report - ${selectedMonth === 'all' ? selectedYear : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}`;
            printContent = renderToString(<YearlyFinancialPrintReport settings={settings} title={title} data={yearlyFinancialData} isMonthView={selectedMonth !== 'all'} />);
        } else if (type === 'admissions') {
            title = `Admissions Report - ${selectedYear}`;
            printContent = renderToString(<YearlyAdmissionsPrintReport settings={settings} title={title} data={yearlyAdmissionsData} />);
        } else if (type === 'academic') {
            title = `Academic Report - ${selectedYear}`;
            printContent = renderToString(<YearlyAcademicPrintReport settings={settings} title={title} data={yearlyAcademicData} />);
        }

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>${title}</title><script src="https://cdn.tailwindcss.com"></script></head>
                <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between print:hidden">
                 <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">Yearbook & Records</h1>
                    <p className="text-muted-foreground">Annual financial, admissions, and academic reports for your school.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
            </div>

            <Tabs defaultValue="financial">
                 <TabsList className="grid w-full grid-cols-3 print:hidden">
                    <TabsTrigger value="financial">Financial Report</TabsTrigger>
                    <TabsTrigger value="admissions">Admissions Report</TabsTrigger>
                    <TabsTrigger value="academic">Academic Report</TabsTrigger>
                </TabsList>
                
                <TabsContent value="financial" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center print:hidden">
                                <div>
                                    <CardTitle>Financial Report</CardTitle>
                                    <CardDescription>
                                        {`A summary of financials for ${selectedMonth === 'all' ? selectedYear : `${months.find(m=>m.value === selectedMonth)?.label} ${selectedYear}`}.`}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Full Year</SelectItem>
                                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={() => handlePrint('financial')}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid gap-6 md:grid-cols-3">
                                <Card className="bg-green-500/5 border-green-500/20">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-green-800">Total Income</CardTitle>
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-700">PKR {yearlyFinancialData.totalIncome.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-red-500/5 border-red-500/20">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-red-800">Total Expenses</CardTitle>
                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-700">PKR {yearlyFinancialData.totalExpenses.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card className={yearlyFinancialData.netProfit >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className={yearlyFinancialData.netProfit >=0 ? "text-primary" : "text-destructive"}>Net Profit / Loss</CardTitle>
                                        <Scale className={yearlyFinancialData.netProfit >=0 ? "text-primary" : "text-destructive"} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-primary">PKR {yearlyFinancialData.netProfit.toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                            </div>
                            {selectedMonth === 'all' && (
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><BarChart3 /> Monthly Financial Summary</CardTitle>
                                        <CardDescription>Income vs. expenses for each month of {selectedYear}.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[350px]">
                                        <ChartContainer config={financialChartConfig} className="w-full h-full">
                                            <BarChart data={yearlyFinancialData.monthlyBreakdown}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                                <YAxis tickFormatter={(value) => `${(value as number / 1000).toFixed(0)}k`} />
                                                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `PKR ${value.toLocaleString()}`} />} />
                                                <Legend />
                                                <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} name="Income" />
                                                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} name="Expenses" />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                 </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="admissions" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center print:hidden">
                                <div>
                                    <CardTitle>Admissions Report</CardTitle>
                                    <CardDescription>{`A summary of student admissions for ${selectedYear}.`}</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handlePrint('admissions')}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total New Admissions</CardTitle>
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{yearlyAdmissionsData.totalAdmissions}</div>
                                    <p className="text-xs text-muted-foreground">New students enrolled in {selectedYear}</p>
                                </CardContent>
                            </Card>
                             <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><BarChart3 />Monthly Admissions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ChartContainer config={admissionsChartConfig} className="w-full h-full">
                                            <BarChart data={yearlyAdmissionsData.monthlyAdmissions}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                                                <YAxis allowDecimals={false} />
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} name="Admissions" />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><PieChartIcon />Admissions by Class</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ChartContainer config={classDistributionChartConfig} className="w-full h-full">
                                            <PieChart>
                                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                <Pie data={yearlyAdmissionsData.classDistributionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                                    {yearlyAdmissionsData.classDistributionChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="academic" className="mt-6">
                   <Card>
                        <CardHeader>
                             <div className="flex justify-between items-center print:hidden">
                                <div>
                                    <CardTitle>Academic Report</CardTitle>
                                    <CardDescription>{`A summary of academic performance for ${selectedYear}.`}</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => handlePrint('academic')}><Printer className="mr-2 h-4 w-4"/> Print</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Percent /> Attendance Rate by Class</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-48">
                                            {yearlyAcademicData.classAttendance.map(c => (
                                                <div key={c.name} className="flex justify-between items-center mb-2">
                                                    <span className="font-medium">{c.name}</span>
                                                    <Badge variant="secondary">{c.rate.toFixed(1)}%</Badge>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><FileSignature /> Pass/Fail Rate by Class</CardTitle>
                                    </CardHeader>
                                     <CardContent>
                                         <ScrollArea className="h-48">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Class</TableHead>
                                                        <TableHead className="text-center text-green-600">Pass</TableHead>
                                                        <TableHead className="text-center text-red-600">Fail</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(yearlyAcademicData.classResults).map(([className, results]) => (
                                                        <TableRow key={className}>
                                                            <TableCell className="font-medium">{className}</TableCell>
                                                            <TableCell className="text-center font-semibold text-green-600">{results.pass}</TableCell>
                                                            <TableCell className="text-center font-semibold text-red-600">{results.fail}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                     </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Medal />Top Performing Students</CardTitle>
                                    <CardDescription>Top 10 students across all classes based on exam performance in {selectedYear}.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-72">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Rank</TableHead>
                                                    <TableHead>Student Name</TableHead>
                                                    <TableHead>Class</TableHead>
                                                    <TableHead className="text-right">Percentage</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {yearlyAcademicData.topStudents.map((s, index) => (
                                                    <TableRow key={s.id}>
                                                        <TableCell className="font-bold">
                                                            <Badge className={index < 3 ? 'bg-yellow-400 text-yellow-900' : ''}>{index + 1}</Badge>
                                                        </TableCell>
                                                        <TableCell>{s.name}</TableCell>
                                                        <TableCell>{s.class}</TableCell>
                                                        <TableCell className="text-right font-semibold">{s.percentage.toFixed(2)}%</TableCell>
                                                    </TableRow>
                                                ))}
                                                {yearlyAcademicData.topStudents.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center h-24">No exam data available for {selectedYear}.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
