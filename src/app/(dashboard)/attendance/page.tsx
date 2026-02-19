
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import type { Student, Attendance } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Send, Printer, CalendarOff, Download, Loader2 } from 'lucide-react';
import { AttendancePrintReport } from '@/components/reports/attendance-report';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import { format, isSunday } from 'date-fns';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export default function AttendancePage() {
  const { students: allStudents, families, classes, addActivityLog, saveStudentAttendance, attendances: allAttendances } = useData();
  const { settings } = useSettings();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const isSundayToday = isSunday(currentDate);

  useEffect(() => {
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    if (selectedClass) {
      const classStudents = allStudents.filter((s) => s.class === selectedClass && s.status === 'Active');
      setStudents(classStudents);

      const initialAttendance: Record<string, AttendanceStatus> = {};
      classStudents.forEach((student) => {
        const todaysRecord = allAttendances.find(a => a.studentId === student.id && a.date === todayStr);
        initialAttendance[student.id] = todaysRecord?.status || 'Present';
      });
      setAttendance(initialAttendance);
    }
  }, [selectedClass, allStudents, allAttendances, currentDate]);

  const handleClassChange = (classValue: string) => {
    setSelectedClass(classValue);
  };
  
  const getReportComponent = () => {
    if (!selectedClass) return null;
    return (
      <AttendancePrintReport
        className={selectedClass}
        date={currentDate}
        students={students}
        attendance={attendance}
        settings={settings}
      />
    );
  };

  const handlePrint = () => {
    const reportComponent = getReportComponent();
    if (!reportComponent) {
      toast({ title: "No Class Selected", description: "Please select a class to print a report.", variant: "destructive" });
      return;
    }
    
    const printContent = renderToString(reportComponent);
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Report - ${selectedClass}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="/print-styles.css">
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPdf = async () => {
    const reportComponent = getReportComponent();
    if (!reportComponent) {
      toast({ title: "No Class Selected", variant: "destructive" });
      return;
    }
    setIsDownloading(true);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.innerHTML = renderToString(reportComponent);
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container.firstChild as HTMLElement, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
        pdf.save(`attendance-report-${selectedClass}-${format(currentDate, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({ title: "Error Generating PDF", variant: "destructive" });
    } finally {
        document.body.removeChild(container);
        setIsDownloading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = () => {
    if (!selectedClass || isSundayToday) return;

    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const newAttendances: Attendance[] = students.map(student => ({
      studentId: student.id,
      date: todayStr,
      status: attendance[student.id],
    }));

    saveStudentAttendance(newAttendances, todayStr, selectedClass);

    toast({
      title: 'Attendance Saved',
      description: `Attendance for class ${selectedClass} has been successfully saved.`,
    });
  };

  const handleSendWhatsapp = async () => {
    if (isSundayToday) return;
    const absentStudents = students.filter((student) => attendance[student.id] === 'Absent');
    
    if (absentStudents.length === 0) {
      toast({ title: 'No Absentees', description: 'All students are present or on leave.' });
      return;
    }

    if(!settings.automatedMessages?.absentee.enabled) {
        toast({ title: 'Messaging Disabled', description: 'Please enable "Absentee Notice" messages in WhatsApp settings.', variant: 'destructive'});
        return;
    }

    const absenteeTemplate = settings.messageTemplates?.find(t => t.id === settings.automatedMessages?.absentee.templateId);

    if (!absenteeTemplate) {
        toast({ title: 'Template Missing', description: 'Please select a template for "Absentee Notice" in settings.', variant: 'destructive'});
        return;
    }

    setIsSending(true);
    toast({
      title: 'Sending Messages...',
      description: `Sending WhatsApp messages to parents of ${absentStudents.length} absent students.`,
    });
    
    addActivityLog({ user: 'System', action: 'Send WhatsApp Message', description: `Sent absentee notifications to ${absentStudents.length} recipients for class ${selectedClass}.`, recipientCount: absentStudents.length });
    
    let successCount = 0;
    for (const student of absentStudents) {
        try {
            const family = families.find((f) => f.id === student.familyId);
            if (!family) continue;

            let message = absenteeTemplate.content;
            message = message.replace(/{student_name}/g, student.name);
            message = message.replace(/{father_name}/g, student.fatherName);
            message = message.replace(/{class}/g, student.class);
            message = message.replace(/{school_name}/g, settings.schoolName);
            

            const result = await sendWhatsAppMessage(family.phone, message, settings);
            if(result.success) successCount++;

        } catch (error) {
            console.error(`Failed to send message for ${student.name}`, error);
        }
    }

    setIsSending(false);
    toast({
      title: 'Notifications Sent',
      description: `Successfully sent messages to ${successCount} out of ${absentStudents.length} parents.`,
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Attendance</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedClass && (
            <>
              <Button onClick={saveAttendance} disabled={isSundayToday}>Save Attendance</Button>
               <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2" />}
                PDF
              </Button>
              <Button variant="outline" onClick={handleSendWhatsapp} disabled={isSending || isSundayToday}>
                {isSending ? 'Sending...' : <> <Send className="w-4 h-4 mr-2" /> Notify Absentees </>}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select a class to start marking attendance for today, {format(currentDate, 'PPP')}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full max-w-sm">
            <Select onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
           {isSundayToday && selectedClass && (
                <Alert variant="default" className="border-orange-500/50 bg-orange-500/5 text-orange-700">
                    <CalendarOff className="h-4 w-4 text-orange-600" />
                    <AlertTitle>Holiday</AlertTitle>
                    <AlertDescription>
                        Today is Sunday. Attendance cannot be marked.
                    </AlertDescription>
                </Alert>
           )}

          {selectedClass && !isSundayToday && students.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="text-right">
                        <RadioGroup
                          value={attendance[student.id]}
                          onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)}
                          className="flex justify-end flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Present" id={`present-${student.id}`} />
                            <Label htmlFor={`present-${student.id}`}>Present</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Absent" id={`absent-${student.id}`} />
                            <Label htmlFor={`absent-${student.id}`}>Absent</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Leave" id={`leave-${student.id}`} />
                            <Label htmlFor={`leave-${student.id}`}>Leave</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
           {selectedClass && students.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                No students found in this class.
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
