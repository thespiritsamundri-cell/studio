
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Wallet, UserCheck, UserPlus, History, Landmark, DollarSign, UserX, TrendingDown, TrendingUp, Scale, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Line, LineChart, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useData } from '@/context/data-context';
import { useMemo, useState, useEffect } from 'react';
import { subMonths, format, formatDistanceToNow, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const chartConfig = {
  attendance: {
    label: 'Attendance',
    color: 'hsl(var(--chart-1))',
  },
  count: {
    label: 'Admissions',
     color: 'hsl(var(--chart-1))',
  }
};

export default function DashboardPage() {
    const { students, fees, activityLog, expenses, teacherAttendances: allTeacherAttendances, classes } = useData();
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        setToday(new Date());
    }, []);

    const totalStudents = students.length;
    
    const messagesSentToday = useMemo(() => {
        if (!today) return 0;
        return activityLog.filter(log => {
            return log.action === 'Send Custom Message' && isToday(new Date(log.timestamp));
        }).reduce((total, log) => {
            const match = log.description.match(/Sent message to (\d+)/);
            return total + (match ? parseInt(match[1], 10) : 0);
        }, 0);
    }, [activityLog, today]);

    const { monthlyIncome, monthlyExpenses, netProfitThisMonth } = useMemo(() => {
        if (!today) return { monthlyIncome: 0, monthlyExpenses: 0, netProfitThisMonth: 0 };
        const startDate = startOfMonth(today);
        const endDate = endOfMonth(today);

        const income = fees
            .filter(f => f.status === 'Paid' && f.paymentDate && new Date(f.paymentDate) >= startDate && new Date(f.paymentDate) <= endDate)
            .reduce((acc, fee) => acc + fee.amount, 0);

        const exp = expenses
            .filter(e => new Date(e.date) >= startDate && new Date(e.date) <= endDate)
            .reduce((acc, exp) => acc + exp.amount, 0);
        
        return { monthlyIncome: income, monthlyExpenses: exp, netProfitThisMonth: income - exp };
    }, [fees, expenses, today]);

    
    const { presentStudents, absentStudents } = useMemo(() => {
        if (!today) return { presentStudents: 0, absentStudents: 0 };
        const todayStr = format(today, 'yyyy-MM-dd');
        // This is a placeholder for student attendance, as we don't have that data structure yet.
        // We will use teacher attendance as a proxy for now to show functionality.
        const todaysAttendance = allTeacherAttendances.filter(a => a.date === todayStr);
        const present = todaysAttendance.filter(a => a.status === 'Present').length;
        // This is a mock calculation, assuming total students.
        const absent = totalStudents > present ? totalStudents - present : 0; 
        
        // When student attendance is implemented, this logic will be updated.
        // For now, we simulate a portion of students being present/absent.
        const simulatedPresent = Math.floor(totalStudents * 0.9);
        const simulatedAbsent = totalStudents - simulatedPresent;

        return { presentStudents: simulatedPresent, absentStudents: simulatedAbsent };
    }, [today, allTeacherAttendances, totalStudents]);

    const classAttendanceSummary = useMemo(() => {
        return classes.map(c => {
            const studentsInClass = students.filter(s => s.class === c.name);
            const total = studentsInClass.length;
            // NOTE: This is a placeholder logic for attendance
            const present = Math.floor(total * 0.9); // Simulate 90% attendance
            const absent = total - present;
            return {
                name: c.name,
                total,
                present,
                absent
            };
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [classes, students]);


    const newAdmissions = useMemo(() => {
        if (!today) return 0;
        const oneMonthAgo = subMonths(today, 1);
        return students.filter(s => new Date(s.admissionDate) > oneMonthAgo).length;
    }, [students, today]);
    
    const classDistributionData = useMemo(() => {
        const dist = students.reduce((acc, student) => {
            acc[student.class] = (acc[student.class] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
        
        return Object.entries(dist)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value], i) => ({
                name,
                value,
                fill: chartColors[i % chartColors.length],
            }));
    }, [students]);

    const newAdmissionsData = useMemo(() => {
        if (!today) return [];
        const sixMonthsAgo = subMonths(today, 5);
        const months = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(today, 5 - i);
            return { month: format(date, 'MMM'), count: 0 };
        });

        students.forEach(student => {
            const admissionDate = new Date(student.admissionDate);
            if (admissionDate >= sixMonthsAgo) {
                const monthStr = format(admissionDate, 'MMM');
                const monthData = months.find(m => m.month === monthStr);
                if (monthData) {
                    monthData.count++;
                }
            }
        });
        return months;

    }, [students, today]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="animated-gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>
        <Card className="animated-gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Students Present</CardTitle>
            <UserCheck className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presentStudents}</div>
            <p className="text-xs text-muted-foreground">Attendance for today</p>
          </CardContent>
        </Card>
        <Card className="animated-gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Students Absent</CardTitle>
            <UserX className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{absentStudents}</div>
            <p className="text-xs text-muted-foreground">Attendance for today</p>
          </CardContent>
        </Card>
        <Card className="animated-gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Messages Sent Today</CardTitle>
            <MessageSquare className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{messagesSentToday}</div>
            <p className="text-xs text-muted-foreground">WhatsApp messages delivered</p>
          </CardContent>
        </Card>
        <Card className="animated-gradient-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">New Admissions</CardTitle>
            <UserPlus className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{newAdmissions}</div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Income (This Month)</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-700">PKR {monthlyIncome.toLocaleString()}</div>
                </CardContent>
            </Card>
                <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-red-800">Expenses (This Month)</CardTitle>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-700">PKR {monthlyExpenses.toLocaleString()}</div>
                </CardContent>
            </Card>
                <Card className={netProfitThisMonth >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className={cn("text-sm font-medium", netProfitThisMonth >=0 ? "text-primary" : "text-destructive")}>Net Profit / Loss</CardTitle>
                    <Scale className={cn("w-4 h-4", netProfitThisMonth >=0 ? "text-primary" : "text-destructive")} />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", netProfitThisMonth >=0 ? "text-primary" : "text-destructive")}>PKR {netProfitThisMonth.toLocaleString()}</div>
                </CardContent>
            </Card>
       </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Today's Attendance by Class</CardTitle>
                <CardDescription>A summary of student attendance for today.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Class</TableHead>
                                <TableHead className="text-center">Total Students</TableHead>
                                <TableHead className="text-center">Present</TableHead>
                                <TableHead className="text-center">Absent</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classAttendanceSummary.map(c => (
                                <TableRow key={c.name}>
                                    <TableCell className="font-medium">{c.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="text-base">{c.total}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="text-base bg-green-500/20 text-green-700 border-green-500/30">{c.present}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="destructive" className="text-base">{c.absent}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-6 h-6" />
                    Recent Activities
                </CardTitle>
                <CardDescription>A live feed of recent actions in the system.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] p-0 overflow-hidden">
                <div className="h-full w-full overflow-hidden [mask-image:_linear-gradient(to_bottom,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
                    <div className="animate-scroll">
                        {activityLog.length > 0 ? (
                            [...activityLog, ...activityLog].slice(0, 20).map((log, index) => (
                                <div key={`${log.id}-${index}`} className="p-4 border-b">
                                    <div className="flex items-start gap-4">
                                        <div className="text-sm">
                                            <p className="font-medium">{log.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary">{log.action}</Badge>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })} by {log.user}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No recent activities.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
           <CardHeader>
            <CardTitle>Financial Summary (All Time)</CardTitle>
            <CardDescription>
                A quick overview of total income vs. total expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={[{ name: 'Financials', income: fees.filter(f=>f.status === 'Paid').reduce((acc, f) => acc + f.amount, 0), expenses: expenses.reduce((acc, e) => acc + e.amount, 0) }]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => `PKR ${value.toLocaleString()}`} />} />
                    <Bar dataKey="income" fill="hsl(var(--chart-2))" radius={4} name="Total Income" />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-5))" radius={4} name="Total Expenses" />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Student distribution across top classes.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <ChartContainer config={{}} className="w-full h-full">
                    <PieChart>
                         <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={classDistributionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                             {classDistributionData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );

    

    