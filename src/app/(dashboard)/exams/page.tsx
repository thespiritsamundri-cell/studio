
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Student, Exam as ExamType, ExamResult } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, PlusCircle, Trash2, Printer, File, Edit, Save, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MarksheetPrintReport } from '@/components/reports/marksheet-print';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { BlankExamMarksheetPrint } from '@/components/reports/blank-exam-marksheet-print';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import html2canvas from 'html2canvas';


interface MarksheetData {
  studentId: string;
  studentName: string;
  marks: { [subject: string]: number };
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  position?: number;
}

export default function ExamsPage() {
  const { classes, students: allStudents, exams, addExam, updateExam, deleteExam } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [newExamName, setNewExamName] = useState('');
  
  const [subjectTotals, setSubjectTotals] = useState<{[subject: string]: number}>({});
  const [currentResults, setCurrentResults] = useState<ExamResult[]>([]);
  const [fontSize, setFontSize] = useState('text-sm');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingTestId, setDownloadingTestId] = useState<string | null>(null);

  // Filters for saved exams
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedExamId) {
      resetForm(false);
    }
  }, [selectedExamId]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    let students = allStudents.filter(s => s.class === selectedClass && s.status === 'Active');
    if (selectedSection && selectedSection !== 'all') {
      students = students.filter(s => s.section === selectedSection);
    }
    return students;
  }, [selectedClass, selectedSection, allStudents]);

  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    return classes.find(c => c.name === selectedClass)?.sections || [];
  }, [selectedClass, classes]);
  
  const filterSections = useMemo(() => {
    if (!filterClass) return [];
    return classes.find(c => c.name === filterClass)?.sections || [];
  }, [filterClass, classes]);

  const classExams = useMemo(() => {
    if (!selectedClass) return [];
    let classExams = exams.filter(e => e.class === selectedClass);
    if(selectedSection && selectedSection !== 'all') {
        classExams = classExams.filter(e => e.section === selectedSection);
    }
    return classExams;
  }, [selectedClass, selectedSection, exams]);
  
  const filteredSavedExams = useMemo(() => {
      let saved = exams;
      if (filterClass) {
          saved = saved.filter(e => e.class === filterClass);
      }
      if (filterSection && filterSection !== 'all') {
          saved = saved.filter(e => e.section === filterSection);
      }
      return saved.sort((a,b) => (b.id > a.id ? 1 : -1));
  }, [exams, filterClass, filterSection]);

  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find(c => c.name === selectedClass);
    return cls?.subjects || [];
  }, [selectedClass, classes]);
  
  const resetForm = (fullReset = true) => {
    if (fullReset) {
      setSelectedClass(null);
      setSelectedSection(null);
    }
    setSelectedExamId(null);
    setNewExamName('');
    setCurrentResults([]);
    const initialTotals = subjects.reduce((acc, subject) => {
        acc[subject] = 100;
        return acc;
    }, {} as {[subject: string]: number});
    setSubjectTotals(initialTotals);
  };
  
  useEffect(() => {
    if (selectedExamId) {
        const exam = exams.find(e => e.id === selectedExamId);
        if (exam) {
            setSelectedClass(exam.class);
            setSelectedSection(exam.section || null);
            setCurrentResults(exam.results || []);
            setSubjectTotals(exam.subjectTotals || {});
        }
    } else {
        if(subjects.length > 0) {
            const initialTotals = subjects.reduce((acc, subject) => {
                acc[subject] = 100;
                return acc;
            }, {} as {[subject: string]: number});
            setSubjectTotals(initialTotals);
        }
    }
  }, [selectedExamId, exams, subjects]);


  const handleCreateNewExam = () => {
    if (!selectedClass || !newExamName.trim()) {
      toast({ title: 'Error', description: 'Please select a class and enter a name for the new exam.', variant: 'destructive' });
      return;
    }
    const defaultSubjectTotals = subjects.reduce((acc, subject) => {
        acc[subject] = 100;
        return acc;
    }, {} as {[subject: string]: number});

    const newExam: ExamType = {
      id: `EXAM-${Date.now()}`,
      name: newExamName,
      class: selectedClass,
      section: selectedSection || undefined,
      subjectTotals: defaultSubjectTotals,
      results: classStudents.map(s => ({ studentId: s.id, marks: {} })),
    };

    addExam(newExam);
    setSelectedExamId(newExam.id);
    toast({ title: 'Exam Created', description: `The exam "${newExam.name}" has been created for ${selectedClass}.`});
    setNewExamName('');
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      setCurrentResults(exam.results || []);
      setSubjectTotals(exam.subjectTotals || {});
    }
  };
  
  const handleMarksChange = (studentId: string, subject: string, value: string) => {
    const marks = parseInt(value, 10);
    const total = subjectTotals[subject] || 0;
    if (!isNaN(marks) && marks > total) {
      toast({ title: 'Invalid Marks', description: `Marks cannot exceed the total of ${total} for ${subject}.`, variant: 'destructive' });
      return;
    }
    setCurrentResults(prev => {
      const studentResult = prev.find(r => r.studentId === studentId);
      if (studentResult) {
        return prev.map(r => r.studentId === studentId ? { ...r, marks: { ...r.marks, [subject]: isNaN(marks) ? 0 : marks } } : r);
      }
      return [...prev, { studentId, marks: { [subject]: isNaN(marks) ? 0 : marks } }];
    });
  };

  const handleTotalMarksChange = (subject: string, value: string) => {
    setSubjectTotals(prev => ({
      ...prev,
      [subject]: Number(value)
    }));
  };

  const marksheetData = useMemo((): MarksheetData[] => {
    const data = classStudents.map(student => {
      const result = currentResults.find(r => r.studentId === student.id);
      const obtainedMarks = subjects.reduce((total, subject) => total + (result?.marks[subject] || 0), 0);
      const totalMarks = subjects.reduce((total, subject) => total + (subjectTotals[subject] || 0), 0);
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
      
      return {
        studentId: student.id,
        studentName: student.name,
        marks: result?.marks || {},
        obtainedMarks,
        totalMarks,
        percentage,
      };
    });

    data.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
    let rank = 1;
    for (let i = 0; i < data.length; i++) {
        if (i > 0 && data[i].obtainedMarks < data[i-1].obtainedMarks) {
            rank = i + 1;
        }
        data[i].position = rank;
    }

    return data;
  }, [classStudents, currentResults, subjects, subjectTotals]);

  const handleSaveResults = () => {
    if (!selectedExamId) return;
    const exam = exams.find(e => e.id === selectedExamId);
    if (exam) {
      const updatedExam: ExamType = {
        ...exam,
        results: currentResults,
        subjectTotals: subjectTotals,
      };
      updateExam(selectedExamId, updatedExam);
      toast({ title: 'Results Saved', description: `Results for ${exam.name} have been saved successfully.` });
    }
  };
  
  const handlePrintMarksheet = (examId: string) => {
      const exam = exams.find(e => e.id === examId);
      if (!exam) return;

      const studentsForPrint = allStudents.filter(s => s.class === exam.class && (!exam.section || s.section === exam.section));
      const resultsForPrint = studentsForPrint.map(student => {
          const result = exam.results.find(r => r.studentId === student.id);
          const obtainedMarks = Object.values(result?.marks || {}).reduce((total, mark) => total + mark, 0);
          const totalMarks = Object.values(exam.subjectTotals).reduce((total, mark) => total + mark, 0);
          const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
          return { studentId: student.id, studentName: student.name, marks: result?.marks || {}, obtainedMarks, totalMarks, percentage };
      });
      resultsForPrint.sort((a,b) => b.obtainedMarks - a.obtainedMarks);
      let rank = 1;
      const finalMarksheetData = resultsForPrint.map((data, i) => {
          if (i > 0 && data.obtainedMarks < resultsForPrint[i-1].obtainedMarks) {
              rank = i + 1;
          }
          return { ...data, position: rank };
      });

      const printContent = renderToString(
          <MarksheetPrintReport
              examName={exam.name}
              className={exam.class + (exam.section ? ` (${exam.section})` : '')}
              subjects={Object.keys(exam.subjectTotals)}
              marksheetData={finalMarksheetData}
              settings={settings}
              fontSize={fontSize}
          />
      );
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>${exam.name} - Marksheet</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
      }
  };

  const handlePrintBlankSheet = () => {
    if (!selectedClass || !selectedExamId) {
        toast({ title: "Cannot Print", description: "Please select a class and an exam.", variant: 'destructive' });
        return;
    }
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;

    const printContent = renderToString(
        <BlankExamMarksheetPrint
            examName={exam.name}
            className={selectedClass + (selectedSection && selectedSection !== 'all' ? ` (${selectedSection})` : '')}
            subjects={subjects}
            students={classStudents}
            subjectTotals={subjectTotals}
            settings={settings}
        />
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>Blank Marksheet - ${exam.name}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
    }
  };
  
  const handleDownloadJpg = async (examId: string) => {
      const exam = exams.find(e => e.id === examId);
      if (!exam) { toast({ title: 'Exam not found', variant: 'destructive' }); return; }
      
      setDownloadingTestId(examId);
      setIsDownloading(true);

      const studentsForPrint = allStudents.filter(s => s.class === exam.class && (!exam.section || s.section === exam.section));
      const resultsForPrint = studentsForPrint.map(student => {
          const result = exam.results.find(r => r.studentId === student.id);
          const obtainedMarks = Object.values(result?.marks || {}).reduce((total, mark) => total + mark, 0);
          const totalMarks = Object.values(exam.subjectTotals).reduce((total, mark) => total + mark, 0);
          return { studentId: student.id, studentName: student.name, marks: result?.marks || {}, obtainedMarks, totalMarks, percentage: totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0 };
      });
      resultsForPrint.sort((a,b) => b.obtainedMarks - a.obtainedMarks);
      let rank = 1;
      const finalMarksheetData = resultsForPrint.map((data, i) => {
          if (i > 0 && data.obtainedMarks < resultsForPrint[i-1].obtainedMarks) rank = i + 1;
          return { ...data, position: rank };
      });

      const printContentString = renderToString(
          <MarksheetPrintReport examName={exam.name} className={exam.class + (exam.section ? ` (${exam.section})` : '')} subjects={Object.keys(exam.subjectTotals)} marksheetData={finalMarksheetData} settings={settings} fontSize={fontSize} />
      );

      const reportElement = document.createElement('div');
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.innerHTML = printContentString;
      document.body.appendChild(reportElement);

      try {
          const canvas = await html2canvas(reportElement.firstChild as HTMLElement, { scale: 2, useCORS: true });
          const image = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.download = `${exam.name}-${exam.class}.jpg`;
          link.href = image;
          link.click();
          toast({ title: 'Download Started' });
      } catch (error) {
          console.error('Error generating JPG:', error);
          toast({ title: 'Download Failed', variant: 'destructive' });
      } finally {
          document.body.removeChild(reportElement);
          setIsDownloading(false);
          setDownloadingTestId(null);
      }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><FileSignature /> Exam Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create or Select Exam</CardTitle>
          <CardDescription>First, choose a class. Then, select an existing exam or create a new one.</CardDescription>
          <div className="flex flex-col md:flex-row gap-2 pt-2">
            <Select onValueChange={(value) => { setSelectedClass(value); setSelectedSection(null); resetForm(false); }}>
                <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select onValueChange={(value) => setSelectedSection(value === 'all' ? null : value)} value={selectedSection || 'all'} disabled={!selectedClass || availableSections.length === 0}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select onValueChange={handleExamChange} value={selectedExamId || ''} disabled={!selectedClass}>
                <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                {classExams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <div className="flex-grow flex gap-2">
                <Input
                placeholder="Or, create new exam..."
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                disabled={!selectedClass}
                />
                <Button onClick={handleCreateNewExam} disabled={!newExamName || !selectedClass}><PlusCircle className="mr-2 h-4 w-4" />Create</Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {selectedExamId && subjects.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Marksheet: {exams.find(e => e.id === selectedExamId)?.name}</CardTitle>
              <CardDescription>Enter marks for each student. Totals and positions will be calculated automatically.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={handleSaveResults}>Save Results</Button>
                <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-[120px]"><SelectValue placeholder="Font Size" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text-xs">Small</SelectItem>
                        <SelectItem value="text-sm">Medium</SelectItem>
                        <SelectItem value="text-base">Large</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => handlePrintMarksheet(selectedExamId)}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                 <Button variant="outline" onClick={handlePrintBlankSheet}><File className="mr-2 h-4 w-4"/>Blank Sheet</Button>
                 <Button variant="outline" onClick={() => handleDownloadJpg(selectedExamId)} disabled={isDownloading}>
                    {isDownloading && downloadingTestId === selectedExamId ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                    JPG
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary z-20">
                  <TableRow>
                    <TableHead className="sticky left-0 bg-secondary z-30 min-w-[150px]">Student</TableHead>
                    {subjects.map(subject => <TableHead key={subject} className="text-center min-w-[120px]">{subject}</TableHead>)}
                    <TableHead className="text-center font-bold">Obtained</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-center font-bold">%</TableHead>
                    <TableHead className="text-center font-bold">Position</TableHead>
                  </TableRow>
                   <TableRow className="bg-muted/50 sticky top-12 z-20">
                        <TableHead className="sticky left-0 bg-muted/50 z-30 font-medium">Total Marks</TableHead>
                        {subjects.map(subject => (
                            <TableCell key={`${subject}-total`} className="p-1">
                                <Input type="number" className="text-center h-8" value={subjectTotals[subject] || ''} onChange={(e) => handleTotalMarksChange(subject, e.target.value)} placeholder="e.g., 100" />
                            </TableCell>
                        ))}
                        <TableCell className="text-center font-bold">{Object.values(subjectTotals).reduce((a, b) => a + b, 0)}</TableCell>
                        <TableCell colSpan={3}></TableCell>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {marksheetData.map(row => (
                    <TableRow key={row.studentId}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">{row.studentName}</TableCell>
                      {subjects.map(subject => (
                        <TableCell key={subject}><Input type="number" className="text-center" placeholder="-" value={row.marks[subject] || ''} onChange={(e) => handleMarksChange(row.studentId, subject, e.target.value)} max={subjectTotals[subject]}/></TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{row.obtainedMarks}</TableCell>
                      <TableCell className="text-center">{row.totalMarks}</TableCell>
                      <TableCell className="text-center font-semibold">{row.percentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-center font-bold"><Badge variant={row.position === 1 ? 'default' : row.position === 2 ? 'secondary' : 'outline'}>{row.position}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {classStudents.length === 0 && ( <p className="text-center text-muted-foreground py-10">No students found in this class/section.</p>)}
          </CardContent>
        </Card>
      )}

      {selectedClass && subjects.length === 0 && selectedExamId && (
         <Card className="mt-4"><CardHeader><CardTitle>No Subjects Found</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">There are no subjects defined for the class "{selectedClass}". Please add subjects on the <a href="/classes" className="text-primary underline">Classes</a> page first.</p></CardContent></Card>
      )}
      
       <Card>
        <CardHeader>
          <CardTitle>Saved Exams</CardTitle>
          <CardDescription>View, edit, or print previously created exams.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Select onValueChange={(val) => { setFilterClass(val); setFilterSection(null); }}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filter by class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(val) => setFilterSection(val === 'all' ? null : val)} value={filterSection || 'all'} disabled={!filterClass || filterSections.length === 0}>
                <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filter by section" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Sections</SelectItem>{filterSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-72 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSavedExams.map(exam => (
                  <TableRow key={exam.id}>
                    <TableCell>{format(new Date(exam.id.split('-')[1]), 'dd-MMM-yyyy')}</TableCell>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.class} {exam.section ? `(${exam.section})` : ''}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedExamId(exam.id)}><Edit className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePrintMarksheet(exam.id)}><Printer className="h-4 w-4"/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadJpg(exam.id)} disabled={isDownloading && downloadingTestId === exam.id}>
                            {isDownloading && downloadingTestId === exam.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4"/>}
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this exam and all its results. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => {deleteExam(exam.id);}} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                 {filteredSavedExams.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No saved exams match filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

