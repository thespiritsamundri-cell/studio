

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import type { Teacher, TeacherAttendance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { TeacherAttendancePrintReport } from '@/components/reports/teacher-attendance-report';
import { useSettings } from '@/context/settings-context';
import { Input } from '@/components/ui/input';


type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';

export default function TeacherAttendancePage() {
  const { teachers, teacherAttendances, saveTeacherAttendance } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; time?: string }>>({});

  useEffect(() => {
    if (today) {
        const initialState: Record<string, { status: AttendanceStatus; time?: string }> = {};
        const todayStr = format(today, 'yyyy-MM-dd');
        teachers.forEach((t) => {
            const todaysRecord = teacherAttendances.find(a => a.teacherId === t.id && a.date === todayStr);
            initialState[t.id] = {
                status: todaysRecord?.status || 'Present',
                time: todaysRecord?.time || (todaysRecord?.status === 'Present' || todaysRecord?.status === 'Late' ? format(new Date(), 'HH:mm') : undefined)
            };
        });
        setAttendance(initialState);
    }
  }, [today, teachers, teacherAttendances]);


  const handleAttendanceChange = (teacherId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
        const currentTime = format(new Date(), 'HH:mm');
        const isTimeApplicable = status === 'Present' || status === 'Late';
        return {
            ...prev,
            [teacherId]: {
                status: status,
                time: isTimeApplicable ? (prev[teacherId]?.time || currentTime) : undefined
            }
        };
    });
  };

  const handleTimeChange = (teacherId: string, time: string) => {
    setAttendance(prev => ({
        ...prev,
        [teacherId]: {
            ...prev[teacherId],
            status: prev[teacherId]?.status || 'Present',
            time: time
        }
    }));
  };

  const handleSaveAttendance = () => {
    if (!today) return;
    const todayStr = format(today, 'yyyy-MM-dd');
    const newAttendances: TeacherAttendance[] = teachers.map(teacher => ({
        teacherId: teacher.id,
        date: todayStr,
        status: attendance[teacher.id].status,
        time: attendance[teacher.id].time
    }));

    saveTeacherAttendance(newAttendances);
    toast({
      title: 'Attendance Saved',
      description: `Teacher attendance for ${format(today, 'PPP')} has been successfully saved.`,
    });
  };

  // Monthly Report Logic
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedTeacherId, setSelectedTeacherId] = useState('all');
  
  const monthlyReportData = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    const filteredTeachers = selectedTeacherId === 'all'
      ? teachers
      : teachers.filter(t => t.id === selectedTeacherId);

    const report = filteredTeachers.map(teacher => {
        const attendanceByDate: Record<string, TeacherAttendance | undefined> = {};
        daysInMonth.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = teacherAttendances.find(a => a.teacherId === teacher.id && a.date === dateStr);
            attendanceByDate[dateStr] = record;
        });
        return { teacher, attendanceByDate };
    });

    return { report, daysInMonth, filteredTeachers };
  }, [teachers, teacherAttendances, selectedMonth, selectedTeacherId]);

  const handlePrint = () => {
    const printContent = renderToString(
        <TeacherAttendancePrintReport
            teachers={monthlyReportData.filteredTeachers}
            daysInMonth={monthlyReportData.daysInMonth}
            attendanceData={monthlyReportData.report}
            month={selectedMonth}
            settings={settings}
        />
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Teacher Attendance Report - ${format(selectedMonth, 'MMMM yyyy')}</title>
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

  
  const getStatusBadge = (attendanceRecord: TeacherAttendance | undefined) => {
      if (!attendanceRecord) return <span className="text-muted-foreground">-</span>;
      const { status, time } = attendanceRecord;
      
      const badge = (() => {
           switch(status) {
              case 'Present': return <Badge className="bg-green-500/80 text-white">P</Badge>
              case 'Absent': return <Badge variant="destructive">A</Badge>
              case 'Leave': return <Badge variant="secondary" className="bg-yellow-500/80 text-white">L</Badge>
              case 'Late': return <Badge variant="secondary" className="bg-orange-500/80 text-white">LT</Badge>
              default: return <span className="text-muted-foreground">-</span>;
          }
      })();
  
      return (
          <div className="flex flex-col items-center gap-1">
              {badge}
              {(status === 'Present' || status === 'Late') && time && (
                  <span className="text-[10px] text-muted-foreground">{time}</span>
              )}
          </div>
      );
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
      setSelectedMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Teacher Attendance</h1>
      
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Mark Daily Attendance</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
            <Card>
                <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Daily Attendance</CardTitle>
                        <CardDescription>Mark attendance for all teachers for today, {today ? format(today, 'PPP') : '...'}.</CardDescription>
                    </div>
                    <Button onClick={handleSaveAttendance}>Save Attendance</Button>
                </div>
                </CardHeader>
                <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Teacher Name</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {teachers.map((teacher) => (
                            <TableRow key={teacher.id}>
                            <TableCell className="font-medium">{teacher.name}</TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end items-center gap-4">
                                  {(attendance[teacher.id]?.status === 'Present' || attendance[teacher.id]?.status === 'Late') && (
                                    <Input
                                        type="time"
                                        value={attendance[teacher.id]?.time || ''}
                                        onChange={(e) => handleTimeChange(teacher.id, e.target.value)}
                                        className="w-28 h-8"
                                    />
                                  )}
                                  <RadioGroup
                                    value={attendance[teacher.id]?.status}
                                    onValueChange={(value) => handleAttendanceChange(teacher.id, value as AttendanceStatus)}
                                    className="flex justify-end gap-4"
                                  >
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Present" id={`p-${teacher.id}`} /><Label htmlFor={`p-${teacher.id}`}>Present</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Late" id={`lt-${teacher.id}`} /><Label htmlFor={`lt-${teacher.id}`}>Late</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Absent" id={`a-${teacher.id}`} /><Label htmlFor={`a-${teacher.id}`}>Absent</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Leave" id={`l-${teacher.id}`} /><Label htmlFor={`l-${teacher.id}`}>Leave</Label></div>
                                  </RadioGroup>
                                </div>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="monthly">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <CardTitle>Monthly Attendance Sheet</CardTitle>
                            <CardDescription>View the complete attendance record for the selected month.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}><ChevronLeft className="h-4 w-4"/></Button>
                           <h3 className="text-lg font-semibold w-36 text-center">{format(selectedMonth, 'MMMM yyyy')}</h3>
                           <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}><ChevronRight className="h-4 w-4"/></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-full max-w-xs">
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Teachers</SelectItem>
                                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" /> Print Report
                        </Button>
                    </div>

                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-background z-10 w-[200px] min-w-[200px]">Teacher</TableHead>
                                    {monthlyReportData.daysInMonth.map(day => (
                                        <TableHead key={day.toISOString()} className="text-center">{format(day, 'd')}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monthlyReportData.report.map(({ teacher, attendanceByDate }) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-medium sticky left-0 bg-background z-10">{teacher.name}</TableCell>
                                        {monthlyReportData.daysInMonth.map(day => (
                                            <TableCell key={day.toISOString()} className="text-center p-1 h-14">
                                                {getStatusBadge(attendanceByDate[format(day, 'yyyy-MM-dd')])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
