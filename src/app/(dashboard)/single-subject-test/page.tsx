
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Student, SingleSubjectTest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Printer, BookText, Save, Edit, Trash2, PlusCircle, CalendarIcon, Loader2, FileSpreadsheet } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { SingleSubjectTestReport } from '@/components/reports/single-subject-test-report';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SubjectSummaryPrintReport } from '@/components/reports/subject-summary-report';


export default function SingleSubjectTestPage() {
  const { classes, students: allStudents, singleSubjectTests, addSingleSubjectTest, updateSingleSubjectTest, deleteSingleSubjectTest } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [testName, setTestName] = useState('');
  const [testDate, setTestDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [studentMarks, setStudentMarks] = useState<Record<string, number | undefined>>({});

  // State for filtering saved tests
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [summaryFontSize, setSummaryFontSize] = useState(12);


  useEffect(() => {
    if (selectedTestId) {
      const test = singleSubjectTests.find(t => t.id === selectedTestId);
      if (test) {
        setIsEditing(true);
        setSelectedClass(test.class);
        setSelectedSection(test.section || null);
        setSelectedSubject(test.subject);
        setTestName(test.testName);
        setTestDate(test.date);
        setTotalMarks(test.totalMarks);
        setStudentMarks(test.results);
      }
    } else {
        resetForm();
    }
  }, [selectedTestId, singleSubjectTests]);
  
  const resetForm = () => {
    setIsEditing(false);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    setTestName('');
    setTestDate(format(new Date(), 'yyyy-MM-dd'));
    setTotalMarks(100);
    setStudentMarks({});
    setSelectedTestId(null);
  };


  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    let students = allStudents.filter(s => s.class === selectedClass && s.status === 'Active');
    if (selectedSection) {
        students = students.filter(s => s.section === selectedSection);
    }
    return students;
  }, [selectedClass, selectedSection, allStudents]);
  
  const availableSections = useMemo(() => {
      if (!selectedClass) return [];
      const cls = classes.find(c => c.name === selectedClass);
      return cls?.sections || [];
  }, [selectedClass, classes]);

  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find(c => c.name === selectedClass);
    return cls?.subjects || [];
  }, [selectedClass, classes]);
  
  const filterSubjects = useMemo(() => {
    if (!filterClass) return [];
    return classes.find(c => c.name === filterClass)?.subjects || [];
  }, [filterClass, classes]);
  
  const filteredTests = useMemo(() => {
      let tests = singleSubjectTests;
      if (filterClass) {
          tests = tests.filter(t => t.class === filterClass);
      }
      if (filterSubject) {
          tests = tests.filter(t => t.subject === filterSubject);
      }
      return tests;
  }, [singleSubjectTests, filterClass, filterSubject]);

  const handleMarksChange = (studentId: string, value: string) => {
    const marks = value === '' ? undefined : parseInt(value, 10);
    if (marks !== undefined && (isNaN(marks) || marks > totalMarks)) {
      toast({ title: 'Invalid Marks', description: `Marks cannot exceed total marks of ${totalMarks}.`, variant: 'destructive' });
      return;
    }
    setStudentMarks(prev => ({ ...prev, [studentId]: marks }));
  };
  
  const handleSaveTest = async () => {
    if (!selectedClass || !selectedSubject || !testName || !testDate) {
      toast({ title: 'Missing Information', variant: 'destructive' });
      return;
    }
    const testData = {
        testName,
        class: selectedClass,
        section: selectedSection || '',
        subject: selectedSubject,
        date: testDate,
        totalMarks,
        results: studentMarks
    };

    if (isEditing && selectedTestId) {
        await updateSingleSubjectTest(selectedTestId, testData);
        toast({ title: 'Test Updated Successfully' });
    } else {
       const newId = await addSingleSubjectTest(testData);
       if (newId) {
            setSelectedTestId(newId);
            toast({ title: 'Test Saved Successfully' });
       }
    }
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

  const handlePrintSavedTest = (test: SingleSubjectTest) => {
    const studentsForTest = allStudents.filter(s => s.class === test.class && (!test.section || s.section === test.section));
    const marksheetDataForTest = studentsForTest.map(student => ({
      ...student,
      obtainedMarks: test.results[student.id],
    }));

     const printContent = renderToString(
      <SingleSubjectTestReport
        testName={test.testName}
        className={test.class}
        subject={test.subject}
        marksheetData={marksheetDataForTest}
        totalMarks={test.totalMarks}
        settings={settings}
      />
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${test.testName} - ${test.class}</title>
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
  
    const handlePrintSubjectSummary = () => {
    if (!filterClass || !filterSubject) {
      toast({ title: "Filter required", description: "Please select a class and a subject to generate the summary.", variant: "destructive" });
      return;
    }

    const studentsForSummary = allStudents.filter(s => s.class === filterClass);

    const printContent = renderToString(
      <SubjectSummaryPrintReport
        students={studentsForSummary}
        tests={filteredTests}
        subject={filterSubject}
        className={filterClass}
        settings={settings}
        fontSize={summaryFontSize}
      />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Subject Summary - ${filterSubject} - ${filterClass}</title>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Test Setup</CardTitle>
                    <CardDescription>Select class, section, subject, and name your test.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={resetForm}><PlusCircle className="mr-2 h-4 w-4"/> New Test</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Select onValueChange={(val) => {setSelectedClass(val); setSelectedSection(null); setSelectedSubject(null);}} value={selectedClass || ''}>
                  <SelectTrigger><SelectValue placeholder="1. Select Class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                 <Select onValueChange={setSelectedSection} value={selectedSection || ''} disabled={!selectedClass || availableSections.length === 0}>
                    <SelectTrigger><SelectValue placeholder="2. Select Section (Optional)" /></SelectTrigger>
                    <SelectContent>
                        {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select onValueChange={setSelectedSubject} value={selectedSubject || ''} disabled={!selectedClass || subjects.length === 0}>
                  <SelectTrigger><SelectValue placeholder="3. Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                 <Input
                  placeholder="4. Enter Test Name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  disabled={!selectedSubject}
                />
                 <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} className="pl-10" disabled={!selectedSubject} />
                 </div>
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
                  <CardDescription>Enter marks for each student out of {totalMarks}.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleSaveTest}><Save className="mr-2 h-4 w-4"/> {isEditing ? 'Update Test' : 'Save Test'}</Button>
                    <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                 </div>
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
                  <p className="text-center text-muted-foreground py-10">No students found for the selected class/section.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Saved Tests</CardTitle>
                <CardDescription>View, edit, or delete previously saved tests.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <Select onValueChange={(val) => { setFilterClass(val); setFilterSubject(null); }}>
                        <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
                        <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                     <Select onValueChange={setFilterSubject} value={filterSubject || ''} disabled={!filterClass}>
                        <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                        <SelectContent>
                            {filterSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 {filterClass && filterSubject && (
                    <div className="mb-4 flex items-center gap-2">
                         <div className="flex-grow">
                             <Input
                                type="number"
                                value={summaryFontSize}
                                onChange={(e) => setSummaryFontSize(Number(e.target.value))}
                                className="w-full"
                                placeholder="Font Size (e.g., 12)"
                             />
                         </div>
                        <Button variant="secondary" className="w-full" onClick={handlePrintSubjectSummary}>
                            <FileSpreadsheet className="mr-2 h-4 w-4"/>
                            Print Subject Summary
                        </Button>
                    </div>
                )}
                <ScrollArea className="h-80">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Test</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTests.map(test => (
                                <TableRow key={test.id} className={selectedTestId === test.id ? 'bg-muted' : ''}>
                                    <TableCell>{format(new Date(test.date), 'dd-MM-yyyy')}</TableCell>
                                    <TableCell>{test.testName}</TableCell>
                                    <TableCell>{test.class} {test.section ? `(${test.section})` : ''}</TableCell>
                                    <TableCell>{test.subject}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedTestId(test.id)}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handlePrintSavedTest(test)}><Printer className="h-4 w-4"/></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the test "{test.testName}".</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteSingleSubjectTest(test.id)} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No tests match the selected filters.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );

    

