

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, Loader2, Calendar as CalendarIcon, Clock, Hash } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RollNumberSlipPrint } from '@/components/reports/roll-number-slip-print';
import type { Student } from '@/lib/types';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { openPrintWindow } from '@/lib/print-helper';


export interface DateSheetItem {
  subject: string;
  date: string;
  time: string;
}

export default function RollNumberSlipsPage() {
  const { classes, students: allStudents } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [examName, setExamName] = useState('Final Term Examination 2024');
  const [instructions, setInstructions] = useState('1. Reach the examination hall 15 minutes before the start time.\n2. Mobile phones are strictly prohibited.\n3. Bring your own stationery. Sharing is not allowed.');
  const [dateSheet, setDateSheet] = useState<DateSheetItem[]>([]);
  const [startRollNo, setStartRollNo] = useState(1001);

  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find(c => c.name === selectedClass);
    return cls?.subjects || [];
  }, [selectedClass, classes]);

  const classStudents = useMemo(() => {
    return selectedClass ? allStudents.filter(s => s.class === selectedClass && s.status === 'Active') : [];
  }, [selectedClass, allStudents]);

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedStudentIds([]);
    const classSubjects = classes.find(c => c.name === className)?.subjects || [];
    setDateSheet(classSubjects.map(sub => ({ subject: sub, date: '', time: '' })));
  };
  
  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };
  
  const handleSelectAllStudents = (checked: boolean) => {
    setSelectedStudentIds(checked ? classStudents.map(s => s.id) : []);
  };

  const handleDateSheetChange = (index: number, field: 'date' | 'time', value: string) => {
      setDateSheet(prev => {
          const newSheet = [...prev];
          newSheet[index][field] = value;
          return newSheet;
      });
  }
  
  const isAllStudentsSelected = classStudents.length > 0 && selectedStudentIds.length === classStudents.length;

  const handlePrint = async () => {
    if (!selectedClass || selectedStudentIds.length === 0) {
      toast({
        title: 'Selection Incomplete',
        description: 'Please select a class and at least one student.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    toast({ title: "Generating Roll Number Slips..." });

    const studentsToPrint = allStudents.filter(s => selectedStudentIds.includes(s.id));
    
    // Generate QR Codes
    const qrCodes: Record<string, string> = {};
    try {
      await Promise.all(studentsToPrint.map(async (student) => {
        const content = `${window.location.origin}/profile/student/${student.id}`;
        const result = await generateQrCode({ content });
        qrCodes[student.id] = result.qrCodeDataUri;
      }));
    } catch (error) {
       console.error("Failed to generate QR codes", error);
       toast({
        title: 'QR Code Generation Failed',
        description: 'Could not generate QR codes for the slips. Printing without them.',
        variant: 'destructive',
      });
    }


    setTimeout(() => {
      const printContent = renderToString(
        <RollNumberSlipPrint 
          students={studentsToPrint} 
          settings={settings}
          examName={examName}
          dateSheet={dateSheet}
          instructions={instructions}
          startRollNo={startRollNo}
          qrCodes={qrCodes}
        />
      );

      openPrintWindow(printContent, `Roll Number Slips - ${selectedClass}`);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Roll Number Slip Generator</CardTitle>
          <CardDescription>Generate and print roll number slips for students. Follow the steps below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">1. Select Class</h3>
                <Select onValueChange={handleClassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">2. Select Students</h3>
                 <ScrollArea className="border rounded-md h-[300px]">
                  {selectedClass ? (
                     <Table>
                      <TableHeader className="sticky top-0 bg-secondary z-10">
                          <TableRow>
                             <TableHead className="w-[50px]">
                               <Checkbox
                                  onCheckedChange={(checked) => handleSelectAllStudents(!!checked)}
                                  checked={isAllStudentsSelected}
                                  aria-label="Select all students"
                               />
                             </TableHead>
                             <TableHead>Student</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {classStudents.map(student => (
                              <TableRow key={student.id} data-state={selectedStudentIds.includes(student.id) && "selected"}>
                                  <TableCell>
                                      <Checkbox
                                          checked={selectedStudentIds.includes(student.id)}
                                          onCheckedChange={() => handleStudentSelection(student.id)}
                                          aria-label={`Select ${student.name}`}
                                      />
                                  </TableCell>
                                  <TableCell>{student.name} ({student.id})</TableCell>
                              </TableRow>
                          ))}
                           {classStudents.length === 0 && (
                              <TableRow><TableCell colSpan={2} className="h-24 text-center">No students found.</TableCell></TableRow>
                           )}
                      </TableBody>
                     </Table>
                  ) : (
                      <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-muted-foreground">Select a class first.</p>
                      </div>
                  )}
                 </ScrollArea>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                    <h3 className="font-semibold text-lg">3. Exam Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="e.g., Final Term Examination 2024" value={examName} onChange={e => setExamName(e.target.value)} />
                       <div className="relative">
                          <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" placeholder="Starting Roll No." value={startRollNo} onChange={e => setStartRollNo(Number(e.target.value))} className="pl-8"/>
                       </div>
                    </div>
                </div>
                 <div className="space-y-2">
                    <h3 className="font-semibold text-lg">4. Create Date Sheet</h3>
                    <ScrollArea className="border rounded-md h-[400px]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-secondary z-10">
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dateSheet.length > 0 ? dateSheet.map((item, index) => (
                                    <TableRow key={item.subject}>
                                        <TableCell className="font-medium">{item.subject}</TableCell>
                                        <TableCell>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="date" value={item.date} onChange={e => handleDateSheetChange(index, 'date', e.target.value)} className="pl-8"/>
                                            </div>
                                        </TableCell>
                                         <TableCell>
                                            <div className="relative">
                                                <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="text" placeholder="e.g., 9:00 AM - 11:00 AM" value={item.time} onChange={e => handleDateSheetChange(index, 'time', e.target.value)} className="pl-8" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={3} className="h-24 text-center">Select a class to see subjects.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                 </div>
            </div>

          </div>
          
          <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1">
                  <div className="space-y-2">
                     <h3 className="font-semibold text-lg">5. Instructions</h3>
                      <Textarea 
                        value={instructions} 
                        onChange={(e) => setInstructions(e.target.value)} 
                        placeholder="Enter instructions for the exam. You can write in Urdu or English." 
                        rows={4}
                        className="font-urdu"
                      />
                  </div>
              </div>
           <div className="flex justify-end mt-8 pt-6 border-t">
              <Button size="lg" onClick={handlePrint} disabled={isLoading || selectedStudentIds.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                Print Slips ({selectedStudentIds.length} Selected)
              </Button>
           </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
