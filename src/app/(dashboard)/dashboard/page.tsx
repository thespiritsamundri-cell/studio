
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Wallet, UserCheck, UserPlus, History, Landmark, DollarSign, UserX } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Line, LineChart, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useData } from '@/context/data-context';
import { useMemo } from 'react';
import { subMonths, format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

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
    const { students, fees, activityLog, expenses } = useData();

    const totalStudents = students.length;
    const totalIncome = fees.filter(f => f.status === 'Paid').reduce((acc, fee) => acc + fee.amount, 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    
    // Dummy data for attendance as we don't have historical attendance data in context
    const presentStudents = 190;
    const absentStudents = totalStudents - presentStudents;

    const newAdmissions = useMemo(() => {
        const oneMonthAgo = subMonths(new Date(), 1);
        return students.filter(s => new Date(s.admissionDate) > oneMonthAgo).length;
    }, [students]);
    
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
        const sixMonthsAgo = subMonths(new Date(), 5);
        const months = Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(new Date(), 5 - i);
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

    }, [students]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-card shadow-lg border-l-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <div className="p-2 rounded-full bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Students Present</CardTitle>
             <div className="p-2 rounded-full bg-green-500/10">
                <UserCheck className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presentStudents}</div>
            <p className="text-xs text-muted-foreground">Attendance for today</p>
          </CardContent>
        </Card>
         <Card className="bg-card shadow-lg border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Students Absent</CardTitle>
             <div className="p-2 rounded-full bg-red-500/10">
                <UserX className="w-5 h-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{absentStudents}</div>
            <p className="text-xs text-muted-foreground">Attendance for today</p>
          </CardContent>
        </Card>
         <Card className="bg-card shadow-lg border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
             <div className="p-2 rounded-full bg-yellow-500/10">
                <Wallet className="w-5 h-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">PKR {totalIncome.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-l-4 border-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">New Admissions</CardTitle>
            <div className="p-2 rounded-full bg-blue-500/10">
                <UserPlus className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{newAdmissions}</div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New Admissions Trend</CardTitle>
            <CardDescription>Monthly new admissions for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <LineChart data={newAdmissionsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
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
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>
                A quick overview of total income vs. total expenses.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart data={[{ name: 'Financials', income: totalIncome, expenses: totalExpenses }]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
}
