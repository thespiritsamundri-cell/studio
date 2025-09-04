
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useData } from '@/context/data-context';
import { getYear, getMonth, format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Scale, Users, FileSignature, PieChart as PieChartIcon, BarChart3, Medal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function YearbookPage() {
    const { fees, expenses, students, exams } = useData();
    const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));

    const years = useMemo(() => {
        const allYears = new Set<number>();
        fees.forEach(f => allYears.add(f.year));
        expenses.forEach(e => allYears.add(getYear(new Date(e.date))));
        students.forEach(s => allYears.add(getYear(new Date(s.admissionDate))));
        if(allYears.size === 0) allYears.add(getYear(new Date()));
        return Array.from(allYears).sort((a,b) => b-a);
    }, [fees, expenses, students]);

    // Financial Data Memoization
    const yearlyFinancialData = useMemo(() => {
        const yearlyIncome = fees.filter(f => f.status === 'Paid' && f.paymentDate && getYear(new Date(f.paymentDate)) === selectedYear);
        const yearlyExpenses = expenses.filter(e => getYear(new Date(e.date)) === selectedYear);

        const totalIncome = yearlyIncome.reduce((acc, fee) => acc + fee.amount, 0);
        const totalExpenses = yearlyExpenses.reduce((acc, exp) => acc + exp.amount, 0);

        const monthlyBreakdown = Array.from({length: 12}, (_, i) => ({
            name: format(new Date(selectedYear, i), 'MMM'),
            income: 0,
            expenses: 0
        }));

        yearlyIncome.forEach(f => {
            if (!f.paymentDate) return;
            const month = getMonth(new Date(f.paymentDate));
            monthlyBreakdown[month].income += f.amount;
        });

        yearlyExpenses.forEach(e => {
            const month = getMonth(new Date(e.date));
            monthlyBreakdown[month].expenses += e.amount;
        });
        
        return {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            monthlyBreakdown,
        };
    }, [fees, expenses, selectedYear]);

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
        const examsForYear = exams.filter(e => {
            // A simple heuristic for year, could be improved if exams have dates
            const examYearFromName = e.name.match(/\d{4}/);
            return examYearFromName ? parseInt(examYearFromName[0]) === selectedYear : true;
        });
        
        if (examsForYear.length === 0) return { passCount: 0, failCount: 0, topStudents: [] };

        let totalMarks = 0;
        let obtainedMarks = 0;
        let studentsProcessed = new Set<string>();
        let passCount = 0;
        let failCount = 0;
        let allStudentResults: {id: string, name: string, class: string, percentage: number}[] = [];

        examsForYear.forEach(exam => {
            exam.results.forEach(result => {
                if (studentsProcessed.has(result.studentId)) return;

                const student = students.find(s => s.id === result.studentId);
                if (!student) return;

                const total = Object.values(exam.subjectTotals).reduce((a, b) => a + b, 0);
                const obtained = Object.values(result.marks).reduce((a, b) => a + b, 0);

                if (total > 0) {
                    const percentage = (obtained / total) * 100;
                    if (percentage >= 40) passCount++; else failCount++;
                    allStudentResults.push({ id: student.id, name: student.name, class: student.class, percentage });
                }
                studentsProcessed.add(result.studentId);
            })
        });

        const topStudents = allStudentResults.sort((a,b) => b.percentage - a.percentage).slice(0, 10);
        
        return {
            passCount,
            failCount,
            topStudents
        };
    }, [exams, students, selectedYear]);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
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
                 <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="financial">Financial Report</TabsTrigger>
                    <TabsTrigger value="admissions">Admissions Report</TabsTrigger>
                    <TabsTrigger value="academic">Academic Report</TabsTrigger>
                </TabsList>
                
                <TabsContent value="financial" className="mt-6">
                    <div className="space-y-6">
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
                    </div>
                </TabsContent>

                 <TabsContent value="admissions" className="mt-6">
                    <div className="space-y-6">
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
                    </div>
                </TabsContent>

                <TabsContent value="academic" className="mt-6">
                   <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileSignature /> Annual Academic Overview</CardTitle>
                             <CardDescription>A summary of student performance in exams conducted in {selectedYear}.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="flex flex-col items-center justify-center p-6 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <h3 className="text-4xl font-bold text-green-700">{yearlyAcademicData.passCount}</h3>
                                <p className="text-green-800 font-medium">Students Passed</p>
                            </div>
                            <div className="flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <h3 className="text-4xl font-bold text-red-700">{yearlyAcademicData.failCount}</h3>
                                <p className="text-red-800 font-medium">Students Failed</p>
                            </div>
                        </CardContent>
                     </Card>
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
                   </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    