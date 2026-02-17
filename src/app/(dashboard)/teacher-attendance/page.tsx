

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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSunday } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Printer, CalendarOff, UserCheck, UserX, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { TeacherAttendancePrintReport } from '@/components/reports/teacher-attendance-report';
import { IndividualTeacherAttendancePrintReport } from '@/components/reports/individual-teacher-attendance-report';
import { useSettings } from '@/context/settings-context';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';


const IndividualReportView = ({ teacherData, daysInMonth }: { teacherData: any, daysInMonth: Date[] }) => {
    if (!teacherData) {
        return <div className="text-center p-8 text-muted-foreground">Select a teacher to view their detailed report.</div>;
    }

    const { teacher, attendanceByDate } = teacherData;
    const summary = { present: 0, absent: 0, late: 0, leave: 0 };
    Object.values(attendanceByDate).forEach((record: any) => {
        if (record) {
            if (record.status === 'Present') summary.present++;
            else if (record.status === 'Absent') summary.absent++;
            else if (record.status === 'Late') summary.late++;
            else if (record.status === 'Leave') summary.leave++;
        }
    });

    return (
        <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-green-500/10 border-green-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-green-700">Present</CardTitle><UserCheck className="w-4 h-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-700">{summary.present}</div></CardContent></Card>
                <Card className="bg-red-500/10 border-red-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-red-700">Absent</CardTitle><UserX className="w-4 h-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-700">{summary.absent}</div></CardContent></Card>
                <Card className="bg-orange-500/10 border-orange-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-orange-700">Late</CardTitle><Clock className="w-4 h-4 text-orange-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-700">{summary.late}</div></CardContent></Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-yellow-700">On Leave</CardTitle><Calendar className="w-4 h-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-700">{summary.leave}</div></CardContent></Card>
            </div>
            <div className="border rounded-lg">
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10"><TableRow><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Status</TableHead><TableHead>Time In</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const record = attendanceByDate[dateStr] as TeacherAttendance | undefined;
                            const isSun = isSunday(day);
                            return (
                                <TableRow key={dateStr} className={cn(isSun && "bg-muted/50")}>
                                    <TableCell>{format(day, 'dd-MMM-yyyy')}</TableCell>
                                    <TableCell>{format(day, 'EEEE')}</TableCell>
                                    <TableCell>
                                        {isSun ? ( <Badge variant="outline">Holiday</Badge> ) : record ? (
                                            <Badge variant={
                                                record.status === 'Present' ? 'default' : 
                                                record.status === 'Absent' ? 'destructive' : 'secondary'
                                            } className={cn(record.status === 'Present' && 'bg-green-600', record.status === 'Late' && 'bg-orange-500')}>
                                                {record.status}
                                            </Badge>
                                        ) : <Badge variant="outline">N/A</Badge>}
                                    </TableCell>
                                    <TableCell>{record?.time || (isSun ? '-' : 'N/A')}</TableCell>
                                </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
};


export default function TeacherAttendancePage() {
  const { teachers, teacherAttendances, saveTeacherAttendance } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);
  
  const isSundayToday = today ? isSunday(today) : false;

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
    if (!today || isSundayToday) return;
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
    let printContent = '';
    let printTitle = `Teacher Attendance - ${format(selectedMonth, 'MMMM yyyy')}`;
    let bodyClass = '';

    if (selectedTeacherId === 'all') {
        printContent = renderToString(
            <TeacherAttendancePrintReport
                teachers={monthlyReportData.filteredTeachers}
                daysInMonth={monthlyReportData.daysInMonth}
                attendanceData={monthlyReportData.report}
                month={selectedMonth}
                settings={settings}
            />
        );
        bodyClass = 'data-layout="landscape"';
    } else {
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        if (!teacher) return;
        
        const teacherData = monthlyReportData.report.find(r => r.teacher.id === selectedTeacherId);
        if (!teacherData) return;

        const summary = { present: 0, absent: 0, late: 0, leave: 0 };
        Object.values(teacherData.attendanceByDate).forEach(record => {
            if (record) {
                if (record.status === 'Present') summary.present++;
                else if (record.status === 'Absent') summary.absent++;
                else if (record.status === 'Late') summary.late++;
                else if (record.status === 'Leave') summary.leave++;
            }
        });

        printContent = renderToString(
            <IndividualTeacherAttendancePrintReport
                teacher={teacher}
                attendanceForMonth={teacherData.attendanceByDate}
                daysInMonth={monthlyReportData.daysInMonth}
                summary={summary}
                month={selectedMonth}
                settings={settings}
            />
        );
        printTitle = `Attendance - ${teacher.name} - ${format(selectedMonth, 'MMMM yyyy')}`;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${printTitle}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="/print-styles.css">
          </head>
          <body ${bodyClass}>
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
                    <Button onClick={handleSaveAttendance} disabled={isSundayToday}>Save Attendance</Button>
                </div>
                </CardHeader>
                <CardContent>
                {isSundayToday ? (
                     <Alert variant="default" className="border-orange-500/50 bg-orange-500/5 text-orange-700">
                        <CalendarOff className="h-4 w-4 text-orange-600" />
                        <AlertTitle>Holiday</AlertTitle>
                        <AlertDescription>
                            Today is Sunday. Attendance cannot be marked.
                        </AlertDescription>
                    </Alert>
                ) : (
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
                )}
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

                    {selectedTeacherId === 'all' ? (
                         <div className="border rounded-lg overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Teacher</TableHead>
                                        {monthlyReportData.daysInMonth.map(day => (
                                            <TableHead key={day.toISOString()} className={cn("text-center w-14", isSunday(day) && "bg-muted/50")}>{format(day, 'd')}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlyReportData.report.map(({ teacher, attendanceByDate }) => (
                                        <TableRow key={teacher.id}>
                                            <TableCell className="font-medium sticky left-0 bg-background z-10">{teacher.name}</TableCell>
                                            {monthlyReportData.daysInMonth.map(day => {
                                                const isSun = isSunday(day);
                                                const record = attendanceByDate[format(day, 'yyyy-MM-dd')];
                                                return (
                                                    <TableCell key={day.toISOString()} className={cn("text-center p-1 h-14", isSun && "bg-muted/50")}>
                                                        {isSun ? (
                                                            <span className="font-semibold text-muted-foreground">SUN</span>
                                                        ) : (
                                                            getStatusBadge(record)
                                                        )}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    ) : (
                        <IndividualReportView teacherData={monthlyReportData.report[0]} daysInMonth={monthlyReportData.daysInMonth} />
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
