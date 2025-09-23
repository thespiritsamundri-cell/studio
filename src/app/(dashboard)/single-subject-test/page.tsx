
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Printer, BookText } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { SingleSubjectTestReport } from '@/components/reports/single-subject-test-report';

export default function SingleSubjectTestPage() {
  const { classes, students: allStudents } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [testName, setTestName] = useState('');
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [studentMarks, setStudentMarks] = useState<Record<string, number | undefined>>({});

  const classStudents = useMemo(() => {
    return selectedClass ? allStudents.filter(s => s.class === selectedClass && s.status === 'Active') : [];
  }, [selectedClass, allStudents]);

  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find(c => c.name === selectedClass);
    return cls?.subjects || [];
  }, [selectedClass, classes]);

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedSubject(null);
    setStudentMarks({});
    setTestName('');
  };

  const handleMarksChange = (studentId: string, value: string) => {
    const marks = value === '' ? undefined : parseInt(value, 10);
    if (marks !== undefined && (isNaN(marks) || marks > totalMarks)) {
      toast({ title: 'Invalid Marks', description: `Marks cannot exceed total marks of ${totalMarks}.`, variant: 'destructive' });
      return;
    }
    setStudentMarks(prev => ({ ...prev, [studentId]: marks }));
  };

  const marksheetData = useMemo(() => {
    return classStudents.map(student => ({
      ...student,
      obtainedMarks: studentMarks[student.id],
    }));
  }, [classStudents, studentMarks]);

  const handlePrint = () => {
    if (!selectedClass || !selectedSubject || !testName) {
      toast({ title: 'Incomplete Information', description: 'Please select a class, subject, and provide a test name.', variant: 'destructive' });
      return;
    }

    const printContent = renderToString(
      <SingleSubjectTestReport
        testName={testName}
        className={selectedClass}
        subject={selectedSubject}
        marksheetData={marksheetData}
        totalMarks={totalMarks}
        settings={settings}
      />
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${testName} - ${selectedClass}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="/print-styles.css">
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><BookText /> Single Subject Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Setup</CardTitle>
          <CardDescription>Select a class, subject, and name your test to generate the marksheet.</CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <Select onValueChange={handleClassChange} value={selectedClass || ''}>
              <SelectTrigger><SelectValue placeholder="1. Select Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input
              placeholder="2. Enter Test Name (e.g., Chapter 1 Test)"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              disabled={!selectedClass}
            />
            <Select onValueChange={setSelectedSubject} value={selectedSubject || ''} disabled={!selectedClass || subjects.length === 0}>
              <SelectTrigger><SelectValue placeholder="3. Select Subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
             <Input
                type="number"
                placeholder="Total Marks"
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                disabled={!selectedSubject}
            />
          </div>
        </CardHeader>
      </Card>
      
      {selectedClass && selectedSubject && testName && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Marksheet: {testName} - {selectedSubject}</CardTitle>
              <CardDescription>Enter the marks obtained by each student out of {totalMarks}.</CardDescription>
            </div>
            <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print Results</Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Obtained Marks</TableHead>
                    <TableHead className="text-center">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marksheetData.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="w-48">
                        <Input
                          type="number"
                          placeholder="-"
                          value={row.obtainedMarks ?? ''}
                          onChange={(e) => handleMarksChange(row.id, e.target.value)}
                          max={totalMarks}
                        />
                      </TableCell>
                       <TableCell className="text-center">
                        {row.obtainedMarks !== undefined ? `${((row.obtainedMarks / totalMarks) * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {classStudents.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No students found in this class.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
