
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { students as allStudents, families } from '@/lib/data';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { analyzeAttendanceAndSendMessage } from '@/ai/flows/attendance-analysis-messaging';
import { Send, Printer } from 'lucide-react';
import { AttendancePrintReport } from '@/components/reports/attendance-report';
import { useReactToPrint } from 'react-to-print';

const classes = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [reportDate, setReportDate] = useState<Date | null>(null);

  useEffect(() => {
    // Set the date only on the client side to avoid hydration mismatch
    setReportDate(new Date());
  }, []);


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
    console.log('Saving attendance:', attendance);
    toast({
      title: 'Attendance Saved',
      description: `Attendance for class ${selectedClass} has been successfully saved.`,
    });
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  const handleSendWhatsapp = async () => {
    const absentStudents = students.filter((student) => attendance[student.id] === 'Absent');
    if (absentStudents.length === 0) {
      toast({
        title: 'No Absentees',
        description: 'All students are present or on leave.',
      });
      return;
    }

    setIsSending(true);
    toast({
      title: 'Sending Messages...',
      description: `Sending WhatsApp messages to parents of ${absentStudents.length} absent students.`,
    });

    for (const student of absentStudents) {
      try {
        const family = families.find((f) => f.id === student.familyId);
        if (!family) continue;

        const input = {
          studentId: student.id,
          studentName: student.name,
          parentPhoneNumber: family.phone,
          attendanceRecords: [{ date: new Date().toISOString().split('T')[0], isPresent: false }], // Just today's record for simplicity
          messageCustomization: 'Please ensure your child attends school regularly.',
        };

        const result = await analyzeAttendanceAndSendMessage(input);
        if (result.messageSent) {
          console.log(`Message sent for ${student.name}`);
        } else {
          console.log(`Message not sent for ${student.name}: ${result.analysisResult}`);
        }
      } catch (error) {
        console.error(`Failed to send message for ${student.name}`, error);
      }
    }

    setIsSending(false);
    toast({
      title: 'Notifications Sent',
      description: 'WhatsApp notifications have been sent to parents of all absent students.',
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
       <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {reportDate && (
            <AttendancePrintReport
              className={selectedClass || ''}
              date={reportDate}
              students={students}
              attendance={attendance}
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Attendance</h1>
        <div className="flex items-center gap-4">
          {selectedClass && (
            <>
              <Button onClick={saveAttendance}>Save Attendance</Button>
               <Button variant="outline" onClick={handlePrint}>
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
                  <SelectItem key={c} value={c}>
                    {c} Class
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
