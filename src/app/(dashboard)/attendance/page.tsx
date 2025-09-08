

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Send, Printer } from 'lucide-react';
import { AttendancePrintReport } from '@/components/reports/attendance-report';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import { format } from 'date-fns';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export default function AttendancePage() {
  const { students: allStudents, families, classes, addActivityLog } = useData();
  const { settings } = useSettings();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  
  const triggerPrint = () => {
    if (!selectedClass) {
        toast({ title: "No Class Selected", description: "Please select a class to print a report.", variant: "destructive" });
        return;
    }
    const reportDate = new Date();
    const printContent = renderToString(
      <AttendancePrintReport
        className={selectedClass || ''}
        date={reportDate}
        students={students}
        attendance={attendance}
        settings={settings}
      />
    );
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance Report - ${selectedClass}</title>
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

  const handleClassChange = (classValue: string) => {
    setSelectedClass(classValue);
    const classStudents = allStudents.filter((s) => s.class === classValue);
    setStudents(classStudents);
    const initialAttendance: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s) => {
      initialAttendance[s.id] = 'Present';
    });
    setAttendance(initialAttendance);
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const saveAttendance = () => {
    // Here you would typically save to a database.
    addActivityLog({
      user: 'Admin',
      action: 'Save Attendance',
      description: `Saved attendance for class ${selectedClass} on ${format(new Date(), 'PPP')}.`,
    });

    toast({
      title: 'Attendance Saved',
      description: `Attendance for class ${selectedClass} has been successfully saved.`,
    });
  };

  const handleSendWhatsapp = async () => {
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
    
    addActivityLog({ user: 'Admin', action: 'Notify Absentees', description: `Sent WhatsApp absentee notifications for class ${selectedClass}.`});
    
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
            
            const success = await sendWhatsAppMessage(
                family.phone, 
                message,
                settings.whatsappApiUrl,
                settings.whatsappApiKey,
                settings.whatsappInstanceId,
                settings.whatsappPriority
            );
            if(success) successCount++;
            
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Attendance</h1>
        <div className="flex items-center gap-4">
          {selectedClass && (
            <>
              <Button onClick={saveAttendance}>Save Attendance</Button>
               <Button variant="outline" onClick={triggerPrint}>
                <Printer className="w-4 h-4 mr-2" /> Print Report
              </Button>
              <Button variant="outline" onClick={handleSendWhatsapp} disabled={isSending}>
                {isSending ? 'Sending...' : <> <Send className="w-4 h-4 mr-2" /> Notify Absentees </>}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select a class to start marking attendance for today.</CardDescription>
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

          {selectedClass && students.length > 0 && (
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
                          className="flex justify-end gap-4"
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
