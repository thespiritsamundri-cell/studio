
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import type { Student, Attendance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Send, Printer, CalendarOff, UserCheck, UserX, Clock, Calendar, ChevronLeft, ChevronRight, BarChart3, Loader2 } from 'lucide-react';
import { DailyAttendancePrintReport } from '@/components/reports/daily-attendance-report';
import { IndividualStudentAttendancePrintReport } from '@/components/reports/individual-student-attendance-report';
import { ClassAttendancePrintReport } from '@/components/reports/class-attendance-report';
import { BlankAttendanceSheet } from '@/components/reports/blank-attendance-sheet';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import { format, isSunday, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, getYear, getMonth } from 'date-fns';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { openPrintWindow } from '@/lib/print-helper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';


type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

// -- Daily Attendance Tab --
const DailyAttendanceTab = () => {
    const { students: allStudents, families, classes, addActivityLog, saveStudentAttendance, attendances: allAttendances } = useData();
    const { settings } = useSettings();
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; remarks?: string }>>({});
    const { toast } = useToast();
    const [isSending, setIsSending] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    const isSundayToday = isSunday(currentDate);

    useEffect(() => {
        const todayStr = format(currentDate, 'yyyy-MM-dd');
        if (selectedClass) {
            const classStudents = allStudents.filter((s) => s.class === selectedClass && s.status === 'Active');
            setStudents(classStudents);

            const initialAttendance: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
            classStudents.forEach((student) => {
                const todaysRecord = allAttendances.find(a => a.studentId === student.id && a.date === todayStr);
                initialAttendance[student.id] = {
                    status: todaysRecord?.status || 'Present',
                    remarks: todaysRecord?.remarks || ''
                };
            });
            setAttendance(initialAttendance);
        } else {
            setStudents([]);
            setAttendance({});
        }
    }, [selectedClass, allStudents, allAttendances, currentDate]);

    const handleClassChange = (classValue: string) => setSelectedClass(classValue);
    
    const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
    const handleRemarksChange = (studentId: string, remarks: string) => setAttendance((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status: prev[studentId]?.status || 'Present', remarks } }));

    const saveAttendance = () => {
        if (!selectedClass || isSundayToday) return;
        const todayStr = format(currentDate, 'yyyy-MM-dd');
        const newAttendances: Attendance[] = students.map(student => ({
            studentId: student.id,
            date: todayStr,
            status: attendance[student.id].status,
            remarks: attendance[student.id].remarks || '',
        }));
        saveStudentAttendance(newAttendances, todayStr, selectedClass);
        toast({ title: 'Attendance Saved', description: `Attendance for class ${selectedClass} has been saved.` });
    };

    const handleSendWhatsapp = async () => {
      if (isSundayToday) return;
      const absentStudents = students.filter((student) => attendance[student.id].status === 'Absent');
      if (absentStudents.length === 0) { toast({ title: 'No Absentees' }); return; }
      if(!settings.automatedMessages?.absentee.enabled) {
          toast({ title: 'Messaging Disabled', variant: 'destructive'});
          return;
      }
      const absenteeTemplate = settings.messageTemplates?.find(t => t.id === settings.automatedMessages?.absentee.templateId);
      if (!absenteeTemplate) { toast({ title: 'Template Missing', variant: 'destructive'}); return; }
      
      setIsSending(true);
      toast({ title: 'Sending Messages...', description: `Sending to ${absentStudents.length} parents.` });
      addActivityLog({ action: 'Send WhatsApp Message', description: `Sent absentee notifications to ${absentStudents.length} recipients.`, recipientCount: absentStudents.length });
      let successCount = 0;
      for (const student of absentStudents) {
          try {
              const family = families.find((f) => f.id === student.familyId);
              if (!family) continue;
              let message = absenteeTemplate.content.replace(/{student_name}/g, student.name).replace(/{father_name}/g, student.fatherName).replace(/{class}/g, student.class).replace(/{school_name}/g, settings.schoolName);
              const result = await sendWhatsAppMessage(family.phone, message, settings);
              if(result.success) successCount++;
          } catch (error) { console.error(`Failed to send message for ${student.name}`, error); }
      }
      setIsSending(false);
      toast({ title: 'Notifications Sent', description: `Sent to ${successCount} of ${absentStudents.length} parents.` });
    };
  
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Mark Daily Attendance</CardTitle>
                        <CardDescription>Select a class to mark attendance for {format(currentDate, 'PPP')}.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                      {selectedClass && (
                        <>
                          <Button onClick={saveAttendance} disabled={isSundayToday}>Save Attendance</Button>
                          <Button variant="outline" onClick={handleSendWhatsapp} disabled={isSending || isSundayToday}>{isSending ? 'Sending...' : <> <Send className="w-4 h-4 mr-2" /> Notify Absentees </>}</Button>
                        </>
                      )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="w-full max-w-sm">
                    <Select onValueChange={handleClassChange} value={selectedClass || ''}>
                        <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
                        <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {isSundayToday && selectedClass && (
                    <Alert variant="default" className="border-orange-500/50 bg-orange-500/5 text-orange-700">
                        <CalendarOff className="h-4 w-4 text-orange-600" />
                        <AlertTitle>Holiday</AlertTitle>
                        <AlertDescription>Today is Sunday. Attendance cannot be marked.</AlertDescription>
                    </Alert>
                )}
                {selectedClass && !isSundayToday && students.length > 0 && (
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Roll No.</TableHead><TableHead>Student Name</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {students.map((student, index) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.id}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center flex-wrap gap-4">
                                                 {(attendance[student.id]?.status === 'Absent' || attendance[student.id]?.status === 'Leave') && (
                                                    <Input
                                                        placeholder="Add remarks..."
                                                        value={attendance[student.id]?.remarks || ''}
                                                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                                        className="w-40 h-8"
                                                    />
                                                )}
                                                <RadioGroup value={attendance[student.id]?.status} onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)} className="flex justify-end flex-wrap gap-4">
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Present" id={`p-${student.id}`} /><Label htmlFor={`p-${student.id}`}>Present</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Absent" id={`a-${student.id}`} /><Label htmlFor={`a-${student.id}`}>Absent</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Leave" id={`l-${student.id}`} /><Label htmlFor={`l-${student.id}`}>Leave</Label></div>
                                                </RadioGroup>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                {selectedClass && students.length === 0 && <div className="text-center text-muted-foreground py-10">No students found in this class.</div>}
            </CardContent>
        </Card>
    );
};

// -- Student Report Tab --
const StudentReportTab = () => {
    const { students: allStudents, attendances: allAttendances, classes } = useData();
    const { settings } = useSettings();
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    
    const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(getMonth(new Date()));

    const selectedMonth = useMemo(() => new Date(selectedYear, selectedMonthIndex), [selectedYear, selectedMonthIndex]);

    const years = useMemo(() => Array.from({ length: 10 }, (_, i) => getYear(new Date()) - i), []);
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: format(new Date(0, i), 'MMMM')
    })), []);


    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        return allStudents.filter(s => s.class === selectedClassId && s.status === 'Active');
    }, [selectedClassId, allStudents]);

    useEffect(() => {
        setSelectedStudentId(null);
    }, [selectedClassId]);

    const studentReportData = useMemo(() => {
        if (!selectedStudentId) return null;
        const student = allStudents.find(s => s.id === selectedStudentId);
        if (!student) return null;

        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        const daysInMonth = eachDayOfInterval({ start, end });
        
        const attendanceByDate: Record<string, Attendance | undefined> = {};
        daysInMonth.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = allAttendances.find(a => a.studentId === selectedStudentId && a.date === dateStr);
            attendanceByDate[dateStr] = record;
        });
        
        const summary = { present: 0, absent: 0, leave: 0 };
        Object.values(attendanceByDate).forEach(record => {
            if (record) {
                if (record.status === 'Present') summary.present++;
                else if (record.status === 'Absent') summary.absent++;
                else if (record.status === 'Leave') summary.leave++;
            }
        });

        return { student, daysInMonth, attendanceByDate, summary };
    }, [selectedStudentId, selectedMonth, allStudents, allAttendances]);

    const handlePrint = () => {
        if (!studentReportData) return;
        const { student, daysInMonth, attendanceByDate, summary } = studentReportData;
        const printContent = renderToString(
            <IndividualStudentAttendancePrintReport
                student={student}
                attendanceForMonth={attendanceByDate}
                daysInMonth={daysInMonth}
                summary={summary}
                month={selectedMonth}
                settings={settings}
            />
        );
        openPrintWindow(printContent, `Attendance Report - ${student.name}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Individual Student Report</CardTitle>
                <CardDescription>Select a student and a month to view and print their detailed attendance report.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
                        <SelectTrigger className="md:w-[200px]"><SelectValue placeholder="Select a class" /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''} disabled={!selectedClassId}>
                        <SelectTrigger className="md:w-[250px]"><SelectValue placeholder="Select a student" /></SelectTrigger>
                        <SelectContent>{studentsInClass.map(s => <SelectItem key={s.id} value={s.id}>{s.name} (ID: {s.id})</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                         <Select value={String(selectedMonthIndex)} onValueChange={(m) => setSelectedMonthIndex(parseInt(m))}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Month" /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={String(selectedYear)} onValueChange={(y) => setSelectedYear(parseInt(y))}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" onClick={handlePrint} disabled={!selectedStudentId}><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
                </div>
                {studentReportData ? <IndividualReportView studentData={studentReportData} daysInMonth={studentReportData.daysInMonth} /> : <div className="text-center p-8 text-muted-foreground">Select a student to view their detailed report.</div>}
            </CardContent>
        </Card>
    );
};

// -- Class Report Tab --
const ClassReportTab = () => {
    const { students: allStudents, attendances: allAttendances, classes } = useData();
    const { settings } = useSettings();
    const { toast } = useToast();

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reportData, setReportData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const selectedYear = getYear(currentDate);
    const selectedMonthIndex = getMonth(currentDate);
    
    const years = useMemo(() => Array.from({ length: 10 }, (_, i) => getYear(new Date()) - i), []);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM') }));
    
    useEffect(() => {
        setReportData(null);
    }, [selectedClassId, currentDate]);

    const handleGenerateReport = () => {
        if (!selectedClassId) {
            toast({ title: "Please select a class.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const studentsInClass = allStudents.filter(s => s.class === selectedClassId && s.status === 'Active');
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            const daysInMonth = eachDayOfInterval({ start, end });

            const report = studentsInClass.map(student => {
                const attendanceByDate: Record<string, Attendance | undefined> = {};
                const summary = { present: 0, absent: 0, leave: 0 };
                
                daysInMonth.forEach(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const record = allAttendances.find(a => a.studentId === student.id && a.date === dateStr);
                    attendanceByDate[dateStr] = record;
                    if (record && !isSunday(day)) {
                        if (record.status === 'Present') summary.present++;
                        else if (record.status === 'Absent') summary.absent++;
                        else if (record.status === 'Leave') summary.leave++;
                    }
                });
                return { student, attendanceByDate, summary };
            });
            
            setReportData({ students: studentsInClass, report, daysInMonth });
            setIsLoading(false);
        }, 300);
    };

    const handlePrintReport = () => {
        if (!reportData || !selectedClassId) return;
        const printContent = renderToString(<ClassAttendancePrintReport students={reportData.students} daysInMonth={reportData.daysInMonth} attendanceData={reportData.report} month={currentDate} settings={settings} />);
        openPrintWindow(printContent, `Class Attendance - ${selectedClassId} - ${format(currentDate, 'MMMM yyyy')}`);
    };

    const handlePrintBlankSheet = () => {
        if (!selectedClassId) {
            toast({ title: "Please select a class.", variant: "destructive" });
            return;
        }
        const classInfo = classes.find(c => c.name === selectedClassId);
        if (!classInfo) return;

        const studentsForSheet = allStudents.filter(s => s.class === selectedClassId && s.status === 'Active');
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start, end });

        const printContent = renderToString(
            <BlankAttendanceSheet 
                classInfo={classInfo}
                students={studentsForSheet}
                daysInMonth={daysInMonth}
                month={currentDate}
                settings={settings}
            />
        );
        openPrintWindow(printContent, `Blank Attendance Sheet - ${selectedClassId}`);
    };
    
    const getStatusCell = (status: AttendanceStatus | undefined, isSun: boolean, key: string) => {
        const baseClass = "p-0 h-9 text-center text-xs";
        if (isSun) return <TableCell key={key} className={cn(baseClass, "font-bold text-red-500 bg-muted/30")}>S</TableCell>;
        if (!status) return <TableCell key={key} className={cn(baseClass, "text-muted-foreground")}>-</TableCell>;

        switch(status) {
            case 'Present': return <TableCell key={key} className={cn(baseClass, "font-bold text-green-900 bg-green-500/30")}>P</TableCell>;
            case 'Absent': return <TableCell key={key} className={cn(baseClass, "font-bold text-white bg-red-500")}>A</TableCell>;
            case 'Leave': return <TableCell key={key} className={cn(baseClass, "font-bold text-yellow-900 bg-yellow-500/30")}>L</TableCell>;
            default: return <TableCell key={key} className={cn(baseClass, "text-muted-foreground")}>-</TableCell>;
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Class Attendance Sheet</CardTitle>
                <CardDescription>Generate a monthly attendance sheet for a class, or print a blank one for manual use.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col md:flex-row gap-2 justify-between items-center mb-4">
                    <div className="flex gap-2 items-center">
                        <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Class" /></SelectTrigger>
                            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={String(selectedMonthIndex)} onValueChange={(m) => setCurrentDate(new Date(selectedYear, parseInt(m)))}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Month" /></SelectTrigger>
                            <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={String(selectedYear)} onValueChange={(y) => setCurrentDate(new Date(parseInt(y), selectedMonthIndex))}>
                            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
                            <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={handleGenerateReport} disabled={!selectedClassId || isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
                            Generate Report
                        </Button>
                        <Button variant="outline" onClick={handlePrintBlankSheet} disabled={!selectedClassId}>
                            <Printer className="mr-2 h-4 w-4" /> Print Blank Sheet
                        </Button>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/30">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}

                {reportData && !isLoading && (
                    <>
                        <div className="flex justify-end mb-2">
                             <Button variant="outline" onClick={handlePrintReport}><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
                        </div>
                        <ScrollArea className="w-full whitespace-nowrap border rounded-lg h-[60vh]">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-background z-10 w-36 min-w-[144px] p-1">Student</TableHead>
                                        {reportData.daysInMonth.map((day:Date) => (<TableHead key={day.toISOString()} className={cn("text-center w-8 p-0", isSunday(day) && "bg-muted/50")}>{format(day, 'd')}</TableHead>))}
                                        <TableHead className="text-center w-8 p-0 sticky right-[64px] bg-background z-10 text-green-600 font-bold">P</TableHead>
                                        <TableHead className="text-center w-8 p-0 sticky right-[32px] bg-background z-10 text-red-600 font-bold">A</TableHead>
                                        <TableHead className="text-center w-8 p-0 sticky right-0 bg-background z-10 text-yellow-500 font-bold">L</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.report.map(({ student, attendanceByDate, summary }: any) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium sticky left-0 bg-background z-10 p-1 text-xs">{student.name}</TableCell>
                                            {reportData.daysInMonth.map((day: Date) => getStatusCell(attendanceByDate[format(day, 'yyyy-MM-dd')]?.status, isSunday(day), day.toISOString()))}
                                            <TableCell className="text-center font-bold sticky right-[64px] bg-background z-10 p-1">{summary.present}</TableCell>
                                            <TableCell className="text-center font-bold sticky right-[32px] bg-background z-10 p-1">{summary.absent}</TableCell>
                                            <TableCell className="text-center font-bold sticky right-0 bg-background z-10 p-1">{summary.leave}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </>
                )}
                
                {!reportData && !isLoading && (
                    <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/30 h-96 flex items-center justify-center">
                        <p>Select filters and click "Generate Report" to view the attendance sheet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// -- Main Page Component --
export default function AttendancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Student Attendance</h1>
            <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
                    <TabsTrigger value="report">Student Report</TabsTrigger>
                    <TabsTrigger value="sheet">Class Report</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="mt-4"><DailyAttendanceTab /></TabsContent>
                <TabsContent value="report" className="mt-4"><StudentReportTab /></TabsContent>
                <TabsContent value="sheet" className="mt-4"><ClassReportTab /></TabsContent>
            </Tabs>
        </div>
    );
}

// -- Reusable View for Individual Report --
const IndividualReportView = ({ studentData, daysInMonth }: { studentData: any, daysInMonth: Date[] }) => {
    const { student, attendanceByDate, summary } = studentData;
    return (
        <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-green-500/10 border-green-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-green-700">Present</CardTitle><UserCheck className="w-4 h-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-700">{summary.present}</div></CardContent></Card>
                <Card className="bg-red-500/10 border-red-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-red-700">Absent</CardTitle><UserX className="w-4 h-4 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-700">{summary.absent}</div></CardContent></Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20"><CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-yellow-700">On Leave</CardTitle><Calendar className="w-4 h-4 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-700">{summary.leave}</div></CardContent></Card>
            </div>
            <div className="border rounded-lg">
                <ScrollArea className="h-96">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10"><TableRow><TableHead>Date</TableHead><TableHead>Day</TableHead><TableHead>Status</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const record = attendanceByDate[dateStr] as Attendance | undefined;
                            const isSun = isSunday(day);
                            return (
                                <TableRow key={dateStr} className={cn(isSun && "bg-muted/50")}>
                                    <TableCell>{format(day, 'dd-MMM-yyyy')}</TableCell>
                                    <TableCell>{format(day, 'EEEE')}</TableCell>
                                    <TableCell>
                                        {isSun ? ( <Badge variant="outline" className="text-red-500 border-red-500/50">Holiday</Badge> ) : record ? (
                                            <Badge variant={ record.status === 'Present' ? 'default' : 'destructive' } className={cn(record.status === 'Present' && 'bg-green-600')}>
                                                {record.status}
                                            </Badge>
                                        ) : <Badge variant="outline">N/A</Badge>}
                                    </TableCell>
                                    <TableCell>{record?.remarks || 'N/A'}</TableCell>
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
