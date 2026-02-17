

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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isSunday, getYear, getMonth } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Printer, CalendarOff, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { TeacherAttendancePrintReport } from '@/components/reports/teacher-attendance-report';
import { IndividualTeacherAttendancePrintReport } from '@/components/reports/individual-teacher-attendance-report';
import { useSettings } from '@/context/settings-context';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';

// -- Daily Attendance Tab Component --
const DailyAttendanceTab = () => {
    const { teachers, teacherAttendances, saveTeacherAttendance } = useData();
    const { toast } = useToast();
    const [today, setToday] = useState(new Date());
    const isSundayToday = isSunday(today);
    const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; time?: string }>>({});

    useEffect(() => {
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
        setAttendance(prev => ({ ...prev, [teacherId]: { ...prev[teacherId], status: prev[teacherId]?.status || 'Present', time: time } }));
    };

    const handleSaveAttendance = () => {
        if (isSundayToday) return;
        const todayStr = format(today, 'yyyy-MM-dd');
        const newAttendances: TeacherAttendance[] = teachers.map(teacher => ({
            teacherId: teacher.id,
            date: todayStr,
            status: attendance[teacher.id].status,
            time: attendance[teacher.id].time
        }));
        saveTeacherAttendance(newAttendances);
        toast({ title: 'Attendance Saved', description: `Teacher attendance for ${format(today, 'PPP')} has been saved.` });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Daily Attendance</CardTitle>
                        <CardDescription>Mark attendance for all teachers for today, {format(today, 'PPP')}.</CardDescription>
                    </div>
                    <Button onClick={handleSaveAttendance} disabled={isSundayToday}>Save Attendance</Button>
                </div>
            </CardHeader>
            <CardContent>
                {isSundayToday ? (
                    <Alert variant="default" className="border-orange-500/50 bg-orange-500/5 text-orange-700">
                        <CalendarOff className="h-4 w-4 text-orange-600" />
                        <AlertTitle>Holiday</AlertTitle>
                        <AlertDescription>Today is Sunday. Attendance cannot be marked.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Teacher Name</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {teachers.map((teacher) => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-medium">{teacher.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-4">
                                                {(attendance[teacher.id]?.status === 'Present' || attendance[teacher.id]?.status === 'Late') && (
                                                    <Input type="time" value={attendance[teacher.id]?.time || ''} onChange={(e) => handleTimeChange(teacher.id, e.target.value)} className="w-28 h-8" />
                                                )}
                                                <RadioGroup value={attendance[teacher.id]?.status} onValueChange={(value) => handleAttendanceChange(teacher.id, value as AttendanceStatus)} className="flex justify-end gap-4">
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
    );
};


// -- Teacher Report Tab Component --
const TeacherReportTab = () => {
    const { teachers, teacherAttendances } = useData();
    const { settings } = useSettings();
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const teacherReportData = useMemo(() => {
        if (!selectedTeacherId) return null;
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        if (!teacher) return null;

        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        const daysInMonth = eachDayOfInterval({ start, end });
        
        const attendanceByDate: Record<string, TeacherAttendance | undefined> = {};
        daysInMonth.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = teacherAttendances.find(a => a.teacherId === selectedTeacherId && a.date === dateStr);
            attendanceByDate[dateStr] = record;
        });
        
        return { teacher, daysInMonth, attendanceByDate };
    }, [selectedTeacherId, selectedMonth, teachers, teacherAttendances]);

    const handlePrint = () => {
        if (!teacherReportData) return;
        const { teacher, daysInMonth, attendanceByDate } = teacherReportData;
        const summary = { present: 0, absent: 0, late: 0, leave: 0 };
        Object.values(attendanceByDate).forEach(record => {
            if (record) {
                if (record.status === 'Present') summary.present++;
                else if (record.status === 'Absent') summary.absent++;
                else if (record.status === 'Late') summary.late++;
                else if (record.status === 'Leave') summary.leave++;
            }
        });
        const printContent = renderToString(
            <IndividualTeacherAttendancePrintReport
                teacher={teacher}
                attendanceForMonth={attendanceByDate}
                daysInMonth={daysInMonth}
                summary={summary}
                month={selectedMonth}
                settings={settings}
            />
        );
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Attendance - ${teacher.name}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Individual Teacher Report</CardTitle>
                <CardDescription>Select a teacher and a month to view and print their detailed attendance report.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <Select onValueChange={setSelectedTeacherId} value={selectedTeacherId || ''}>
                        <SelectTrigger className="md:w-1/3"><SelectValue placeholder="Select a teacher" /></SelectTrigger>
                        <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                        <h3 className="text-lg font-semibold w-36 text-center">{format(selectedMonth, 'MMMM yyyy')}</h3>
                        <Button variant="outline" size="icon" onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="outline" onClick={handlePrint} disabled={!selectedTeacherId}><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
                </div>
                {teacherReportData ? <IndividualReportView teacherData={teacherReportData} daysInMonth={teacherReportData.daysInMonth} /> : <div className="text-center p-8 text-muted-foreground">Select a teacher to view their detailed report.</div>}
            </CardContent>
        </Card>
    );
};

// -- Monthly Sheet Tab Component --
const MonthlySheetTab = () => {
    const { teachers, teacherAttendances } = useData();
    const { settings } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());

    const selectedYear = getYear(currentDate);
    const selectedMonthIndex = getMonth(currentDate);

    const years = useMemo(() => {
        const allYears = new Set<number>();
        teacherAttendances.forEach(a => allYears.add(getYear(new Date(a.date))));
        if(allYears.size === 0) allYears.add(getYear(new Date()));
        return Array.from(allYears).sort((a,b) => b-a);
    }, [teacherAttendances]);

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: format(new Date(0, i), 'MMMM')
    }));
    
    const monthlySheetData = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start, end });
        
        const report = teachers.map(teacher => {
            const attendanceByDate: Record<string, TeacherAttendance | undefined> = {};
            const summary = { present: 0, absent: 0, late: 0, leave: 0 };
            
            daysInMonth.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const record = teacherAttendances.find(a => a.teacherId === teacher.id && a.date === dateStr);
                attendanceByDate[dateStr] = record;
                if (record && !isSunday(day)) {
                    if (record.status === 'Present') summary.present++;
                    else if (record.status === 'Absent') summary.absent++;
                    else if (record.status === 'Late') summary.late++;
                    else if (record.status === 'Leave') summary.leave++;
                }
            });
            return { teacher, attendanceByDate, summary };
        });
        return { report, daysInMonth };
    }, [teachers, teacherAttendances, currentDate]);

    const getStatusCell = (status: AttendanceStatus | undefined, isSun: boolean) => {
        if (isSun) return <TableCell className="p-0 text-center text-muted-foreground bg-muted/30">S</TableCell>;
        if (!status) return <TableCell className="p-0 text-center text-muted-foreground">-</TableCell>;

        switch(status) {
            case 'Present': return <TableCell className="p-0 text-center font-bold text-green-800 bg-green-500/20">P</TableCell>;
            case 'Absent': return <TableCell className="p-0 text-center font-bold text-red-800 bg-red-500/20">A</TableCell>;
            case 'Leave': return <TableCell className="p-0 text-center font-bold text-yellow-800 bg-yellow-500/20">L</TableCell>;
            case 'Late': return <TableCell className="p-0 text-center font-bold text-orange-800 bg-orange-500/20">LT</TableCell>;
            default: return <TableCell className="p-0 text-center text-muted-foreground">-</TableCell>;
        }
    };
    
    const handlePrint = () => {
        const printContent = renderToString(<TeacherAttendancePrintReport teachers={teachers} daysInMonth={monthlySheetData.daysInMonth} attendanceData={monthlySheetData.report} month={currentDate} settings={settings} />);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Teacher Attendance - ${format(currentDate, 'MMMM yyyy')}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css" /></head><body data-layout="landscape">${printContent}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
        }
    };

    const handleYearChange = (year: string) => {
        const newYear = parseInt(year);
        const newDate = new Date(currentDate);
        newDate.setFullYear(newYear);
        setCurrentDate(newDate);
    };

    const handleMonthChange = (month: string) => {
        const newMonth = parseInt(month);
        const newDate = new Date(currentDate);
        newDate.setMonth(newMonth);
        setCurrentDate(newDate);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Attendance Sheet</CardTitle>
                <CardDescription>View the complete monthly attendance sheet for all teachers.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-2 justify-between items-center mb-4">
                     <div className="flex gap-2 items-center">
                         <Select value={String(selectedMonthIndex)} onValueChange={handleMonthChange}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={String(selectedYear)} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print Sheet</Button>
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                    <Table className="min-w-full border-collapse">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-background z-10 w-40 min-w-[150px] p-2">Teacher Name</TableHead>
                                {monthlySheetData.daysInMonth.map(day => (<TableHead key={day.toISOString()} className={cn("text-center w-10 p-2", isSunday(day) && "bg-muted/50")}>{format(day, 'd')}</TableHead>))}
                                <TableHead className="text-center w-12 p-2 sticky right-[144px] bg-background z-10 text-green-600 font-bold">P</TableHead>
                                <TableHead className="text-center w-12 p-2 sticky right-24 bg-background z-10 text-red-600 font-bold">A</TableHead>
                                <TableHead className="text-center w-12 p-2 sticky right-12 bg-background z-10 text-orange-500 font-bold">LT</TableHead>
                                <TableHead className="text-center w-12 p-2 sticky right-0 bg-background z-10 text-yellow-500 font-bold">L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlySheetData.report.map(({ teacher, attendanceByDate, summary }) => (
                                <TableRow key={teacher.id}>
                                    <TableCell className="font-medium sticky left-0 bg-background z-10 p-2">{teacher.name}</TableCell>
                                    {monthlySheetData.daysInMonth.map(day => getStatusCell(attendanceByDate[format(day, 'yyyy-MM-dd')]?.status, isSunday(day)))}
                                    <TableCell className="text-center font-bold sticky right-[144px] bg-background z-10 p-2">{summary.present}</TableCell>
                                    <TableCell className="text-center font-bold sticky right-24 bg-background z-10 p-2">{summary.absent}</TableCell>
                                    <TableCell className="text-center font-bold sticky right-12 bg-background z-10 p-2">{summary.late}</TableCell>
                                    <TableCell className="text-center font-bold sticky right-0 bg-background z-10 p-2">{summary.leave}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </ScrollArea>
                 {teachers.length === 0 && <div className="text-center text-muted-foreground py-10">No teachers found.</div>}
            </CardContent>
        </Card>
    );
};


// -- Main Page Component --
export default function TeacherAttendancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Teacher Attendance</h1>
            <Tabs defaultValue="daily">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
                    <TabsTrigger value="report">Teacher Report</TabsTrigger>
                    <TabsTrigger value="sheet">Monthly Sheet</TabsTrigger>
                </TabsList>
                <TabsContent value="daily"><DailyAttendanceTab /></TabsContent>
                <TabsContent value="report"><TeacherReportTab /></TabsContent>
                <TabsContent value="sheet"><MonthlySheetTab /></TabsContent>
            </Tabs>
        </div>
    );
}

const IndividualReportView = ({ teacherData, daysInMonth }: { teacherData: any, daysInMonth: Date[] }) => {
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
                                            <Badge variant={ record.status === 'Present' ? 'default' : record.status === 'Absent' ? 'destructive' : 'secondary' } className={cn(record.status === 'Present' && 'bg-green-600', record.status === 'Late' && 'bg-orange-500')}>
                                                {record.status}
                                            </Badge>
                                        ) : <Badge variant="outline">N/A</Badge>}
                                    </TableCell>
                                    <TableCell>{record?.time || (isSun ? 'Sunday' : 'N/A')}</TableCell>
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
