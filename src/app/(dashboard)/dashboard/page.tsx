
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Wallet, UserCheck, UserPlus, History, Landmark, DollarSign } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Line, LineChart, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useData } from '@/context/data-context';
import { useMemo } from 'react';
import { subMonths, format, formatDistanceToNow } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
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
    const netProfit = totalIncome - totalExpenses;
    
    const newAdmissions = useMemo(() => {
        const oneMonthAgo = subMonths(new Date(), 1);
        return students.filter(s => new Date(s.admissionDate) > oneMonthAgo).length;
    }, [students]);

    // Dummy data for attendance as we don't have historical attendance data in context
    const attendanceToday = 95.5;
    const weeklyAttendanceData = [
      { day: 'Mon', attendance: 96 },
      { day: 'Tue', attendance: 92 },
      { day: 'Wed', attendance: 98 },
      { day: 'Thu', attendance: 94 },
      { day: 'Fri', attendance: 95.5 },
    ];
    
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
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
             <div className="p-2 rounded-full bg-green-500/10">
                <Wallet className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">PKR {totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
         <Card className="bg-card shadow-lg border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
             <div className="p-2 rounded-full bg-red-500/10">
                <Landmark className="w-5 h-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">PKR {totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
         <Card className="bg-card shadow-lg border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
             <div className="p-2 rounded-full bg-yellow-500/10">
                <DollarSign className="w-5 h-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">PKR {netProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This fiscal year</p>
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
            <CardContent className="h-[300px] p-0">
                <Carousel
                    className="w-full h-full"
                    opts={{ align: "start", loop: true, direction: "vertical" }}
                    plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
                    orientation="vertical"
                >
                    <CarouselContent className="h-full -mt-0">
                        {activityLog.length > 0 ? (
                            activityLog.slice(0, 10).map((log, index) => (
                                <CarouselItem key={index} className="pt-2 basis-auto">
                                    <div className="p-4">
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
                                </CarouselItem>
                            ))
                        ) : (
                             <CarouselItem className="pt-0">
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No recent activities.
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                </Carousel>
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Attendance Trend</CardTitle>
            <CardDescription>Attendance percentage for the current week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <LineChart accessibilityLayer data={weeklyAttendanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickFormatter={(value) => `${value}%`} domain={[80, 100]} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                <Line type="monotone" dataKey="attendance" stroke="var(--color-attendance)" strokeWidth={3} dot={{ r: 6, fill: "var(--color-attendance)" }} activeDot={{ r: 8 }} />
              </LineChart>
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
                        <Pie data={classDistributionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
