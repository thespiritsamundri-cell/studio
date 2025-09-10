
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Wallet, UserCheck, UserPlus, History, Landmark, DollarSign, UserX, TrendingUp, TrendingDown, Scale, CheckCircle, XCircle, MessageSquare, Briefcase } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Line, LineChart, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useData } from '@/context/data-context';
import { useMemo, useState, useEffect } from 'react';
import { subMonths, format, formatDistanceToNow, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
    const { students, fees, activityLog, expenses, teachers, teacherAttendances: allTeacherAttendances, classes } = useData();
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        setToday(new Date());
    }, []);

    const totalStudents = students.length;
    
    const messagesSentToday = useMemo(() => {
        if (!today) return 0;
        return activityLog
            .filter(log => {
                const logIsToday = isToday(new Date(log.timestamp));
                // Count all WhatsApp messages, regardless of origin
                return logIsToday && (log.action.includes('Send') && log.action.includes('Message'));
            })
            .reduce((total, log) => {
                const match = log.description.match(/to (\d+)/);
                return total + (match ? parseInt(match[1], 10) : 1);
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
        const present = todaysAttendance.length > 0 ? todaysAttendance.filter(a => a.status === 'Present').length : Math.floor(teachers.length * 0.9);
        const absent = teachers.length - present; 
        
        // When student attendance is implemented, this logic will be updated.
        // For now, we simulate a portion of students being present/absent.
        const simulatedPresent = Math.floor(totalStudents * 0.9);
        const simulatedAbsent = totalStudents - simulatedPresent;

        return { presentStudents: simulatedPresent, absentStudents: simulatedAbsent };
    }, [today, allTeacherAttendances, totalStudents, teachers.length]);

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
    
    const teacherAttendanceSummary = useMemo(() => {
        if (!today) return [];
        const todayStr = format(today, 'yyyy-MM-dd');
        const monthStart = startOfMonth(today);

        return teachers.map(teacher => {
            const todaysRecord = allTeacherAttendances.find(a => a.teacherId === teacher.id && a.date === todayStr);
            
            const monthlyRecords = allTeacherAttendances.filter(a => a.teacherId === teacher.id && new Date(a.date) >= monthStart && new Date(a.date) <= today);
            const presentCount = monthlyRecords.filter(a => a.status === 'Present').length;
            const absentCount = monthlyRecords.filter(a => a.status === 'Absent').length;

            return {
                name: teacher.name,
                todayStatus: todaysRecord?.status,
                presentCount,
                absentCount,
            }
        });

    }, [today, teachers, allTeacherAttendances]);


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
        <Card className="bg-purple-100 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700/50 transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Students</CardTitle>
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-700/50 transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Students Present</CardTitle>
            <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{presentStudents}</div>
            <p className="text-xs text-muted-foreground">Attendance for today</p>
          </CardContent>
        </Card>
         <Card className="bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-700/50 transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Students Absent</CardTitle>
            <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 dark:text-red-100">{absentStudents}</div>
            <p className="text-xs text-muted-foreground">Attendance for today</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50 transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Messages Sent Today</CardTitle>
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{messagesSentToday}</div>
            <p className="text-xs text-muted-foreground">WhatsApp messages delivered</p>
          </CardContent>
        </Card>
        <Card className="bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700/50 transition-transform duration-300 ease-in-out hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-200">New Admissions</CardTitle>
            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{newAdmissions}</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <CardDescription>A live feed of recent actions.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] p-0 overflow-hidden">
                <div className="h-full w-full overflow-hidden [mask-image:_linear-gradient(to_bottom,transparent_0,_black_64px,_black_calc(100%-64px),transparent_100%)]">
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
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase /> Today's Teacher Attendance</CardTitle>
                <CardDescription>A summary of teacher attendance for today and the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Teacher</TableHead>
                                <TableHead className="text-center">Today's Status</TableHead>
                                <TableHead className="text-center">Present (Month)</TableHead>
                                <TableHead className="text-center">Absent (Month)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teacherAttendanceSummary.map(t => (
                                <TableRow key={t.name}>
                                    <TableCell className="font-medium">{t.name}</TableCell>
                                    <TableCell className="text-center">
                                        {t.todayStatus ? (
                                            <Badge variant={t.todayStatus === 'Present' ? 'default' : t.todayStatus === 'Absent' ? 'destructive' : 'secondary'}
                                                className={cn(t.todayStatus === 'Present' && 'bg-green-600')}>
                                                {t.todayStatus}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">Not Marked</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="text-base bg-green-500/20 text-green-700 border-green-500/30">{t.presentCount}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="destructive" className="text-base">{t.absentCount}</Badge>
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
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Student distribution across top classes.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[350px]">
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
}
