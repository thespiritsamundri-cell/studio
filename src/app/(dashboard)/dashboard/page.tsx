
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Wallet, UserCheck, UserPlus, AreaChart, Donut, LineChart } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const totalStudents = 1250;
const feeCollected = 567800;
const attendanceToday = 95.5;
const newAdmissions = 42;

const weeklyAttendanceData = [
  { day: 'Mon', attendance: 96 },
  { day: 'Tue', attendance: 92 },
  { day: 'Wed', attendance: 98 },
  { day: 'Thu', attendance: 94 },
  { day: 'Fri', attendance: 95.5 },
];

const classDistributionData = [
    { name: 'Nursery', value: 150, fill: 'hsl(var(--chart-1))' },
    { name: 'KG', value: 120, fill: 'hsl(var(--chart-2))' },
    { name: '1st', value: 130, fill: 'hsl(var(--chart-3))' },
    { name: '2nd', value: 110, fill: 'hsl(var(--chart-4))' },
    { name: '3rd', value: 100, fill: 'hsl(var(--chart-5))' },
    { name: 'Other', value: 640, fill: 'hsl(var(--muted))' },
];

const newAdmissionsData = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 18 },
  { month: 'Mar', count: 25 },
  { month: 'Apr', count: 31 },
  { month: 'May', count: 28 },
  { month: 'Jun', count: 42 },
];


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
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card shadow-lg border-l-4 border-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <div className="p-2 rounded-full bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20 from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-l-4 border-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Fee Collection (MTD)</CardTitle>
             <div className="p-2 rounded-full bg-green-500/10">
                <Wallet className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">PKR {feeCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-l-4 border-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Attendance (Today)</CardTitle>
            <div className="p-2 rounded-full bg-yellow-500/10">
                <UserCheck className="w-5 h-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attendanceToday}%</div>
            <p className="text-xs text-muted-foreground">+1.2% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-lg border-l-4 border-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">New Admissions (MTD)</CardTitle>
            <div className="p-2 rounded-full bg-red-500/10">
                <UserPlus className="w-5 h-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{newAdmissions}</div>
            <p className="text-xs text-muted-foreground">+5 this week</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Attendance percentage for the current week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={weeklyAttendanceData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickFormatter={(value) => `${value}%`} domain={[80, 100]} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                <Bar dataKey="attendance" fill="var(--color-attendance)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Student distribution across primary classes.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <ChartContainer config={{}} className="w-full h-full">
                    <PieChart>
                         <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={classDistributionData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2}>
                             {classDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
       <Card>
          <CardHeader>
            <CardTitle>New Admissions Trend</CardTitle>
            <CardDescription>Monthly new admissions for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <LineChart data={newAdmissionsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
    </div>
  );
}
