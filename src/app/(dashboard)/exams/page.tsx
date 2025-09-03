
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
import { FileSignature, PlusCircle, Trash2, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MarksheetPrintReport } from '@/components/reports/marksheet-print';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';

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
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [newExamName, setNewExamName] = useState('');
  
  const [subjectTotals, setSubjectTotals] = useState<{[subject: string]: number}>({});
  const [currentResults, setCurrentResults] = useState<ExamResult[]>([]);
  const [fontSize, setFontSize] = useState('text-sm');

  const classStudents = useMemo(() => {
    return selectedClass ? allStudents.filter(s => s.class === selectedClass) : [];
  }, [selectedClass, allStudents]);

  const classExams = useMemo(() => {
    return selectedClass ? exams.filter(e => e.class === selectedClass) : [];
  }, [selectedClass, exams]);

  const subjects = useMemo(() => {
    if (!selectedClass) return [];
    const cls = classes.find(c => c.name === selectedClass);
    return cls?.subjects || [];
  }, [selectedClass, classes]);
  
  useEffect(() => {
    // Reset subject totals if the selected exam doesn't have any
    if (selectedExamId) {
        const exam = exams.find(e => e.id === selectedExamId);
        if (exam && (!exam.subjectTotals || Object.keys(exam.subjectTotals).length === 0)) {
            const initialTotals = subjects.reduce((acc, subject) => {
                acc[subject] = 100;
                return acc;
            }, {} as {[subject: string]: number});
            setSubjectTotals(initialTotals);
        } else if (exam?.subjectTotals) {
             setSubjectTotals(exam.subjectTotals);
        }
    } else if (subjects.length > 0) {
        const initialTotals = subjects.reduce((acc, subject) => {
            acc[subject] = 100; // Default to 100
            return acc;
        }, {} as {[subject: string]: number});
        setSubjectTotals(initialTotals);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, selectedExamId]);


  const handleCreateNewExam = () => {
    if (!selectedClass || !newExamName.trim()) {
      toast({ title: 'Error', description: 'Please select a class and enter a name for the new exam.', variant: 'destructive' });
      return;
    }
    // Initialize default subject totals for the new exam
    const defaultSubjectTotals = subjects.reduce((acc, subject) => {
        acc[subject] = 100; // Default total marks
        return acc;
    }, {} as {[subject: string]: number});

    const newExam: ExamType = {
      id: `EXAM-${Date.now()}`,
      name: newExamName,
      class: selectedClass,
      subjectTotals: defaultSubjectTotals,
      results: classStudents.map(s => ({ studentId: s.id, marks: {} })),
    };

    addExam(newExam);
    setSelectedExamId(newExam.id);
    setCurrentResults(newExam.results);
    setSubjectTotals(defaultSubjectTotals); // Set the totals for the new exam
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
  
  const handlePrintMarksheet = () => {
      if (!selectedClass || !selectedExamId) {
          toast({ title: "Cannot Print", description: "Please select a class and an exam.", variant: 'destructive' });
          return;
      }
      const exam = exams.find(e => e.id === selectedExamId);
      if (!exam) return;

      const printContent = renderToString(
          <MarksheetPrintReport
              examName={exam.name}
              className={selectedClass}
              subjects={subjects}
              marksheetData={marksheetData}
              settings={settings}
              fontSize={fontSize}
          />
      );
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${exam.name} - ${selectedClass} - Marksheet</title>
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><FileSignature /> Exam Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create or Select Exam</CardTitle>
          <CardDescription>First, choose a class. Then, select an existing exam or create a new one.</CardDescription>
          <div className="flex gap-2 pt-2">
            <Select onValueChange={(value) => { setSelectedClass(value); setSelectedExamId(null); setCurrentResults([]); }}>
                <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select onValueChange={handleExamChange} value={selectedExamId || ''} disabled={!selectedClass}>
                <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                {classExams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <div className="flex-grow flex gap-2">
                <Input
                placeholder="Or, create new exam (e.g., First Term)"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                disabled={!selectedClass}
                />
                <Button onClick={handleCreateNewExam} disabled={!newExamName || !selectedClass}><PlusCircle className="mr-2 h-4 w-4" />Create</Button>
                {selectedExamId && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this exam and all its results. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { if(selectedExamId) {deleteExam(selectedExamId)}; setSelectedExamId(null); setCurrentResults([]); }} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
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
            <div className="flex items-center gap-4">
                <Button onClick={handleSaveResults}>Save Results</Button>
                <Select value={fontSize} onValueChange={setFontSize}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Font Size" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="text-xs">Small</SelectItem>
                        <SelectItem value="text-sm">Medium</SelectItem>
                        <SelectItem value="text-base">Large</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={handlePrintMarksheet}><Printer className="mr-2 h-4 w-4"/>Print Marksheet</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Student</TableHead>
                    {subjects.map(subject => <TableHead key={subject} className="text-center min-w-[120px]">{subject}</TableHead>)}
                    <TableHead className="text-center font-bold">Obtained</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-center font-bold">%</TableHead>
                    <TableHead className="text-center font-bold">Position</TableHead>
                  </TableRow>
                   <TableRow className="bg-muted/50">
                        <TableHead className="sticky left-0 bg-muted/50 z-10 font-medium">Total Marks</TableHead>
                        {subjects.map(subject => (
                            <TableCell key={`${subject}-total`} className="p-1">
                                <Input
                                    type="number"
                                    className="text-center h-8"
                                    value={subjectTotals[subject] || ''}
                                    onChange={(e) => handleTotalMarksChange(subject, e.target.value)}
                                    placeholder="e.g., 100"
                                />
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
                        <TableCell key={subject}>
                          <Input
                            type="number"
                            className="text-center"
                            placeholder="-"
                            value={row.marks[subject] || ''}
                            onChange={(e) => handleMarksChange(row.studentId, subject, e.target.value)}
                            max={subjectTotals[subject]}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{row.obtainedMarks}</TableCell>
                      <TableCell className="text-center">{row.totalMarks}</TableCell>
                      <TableCell className="text-center font-semibold">{row.percentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge variant={row.position === 1 ? 'default' : row.position === 2 ? 'secondary' : 'outline'}>{row.position}</Badge>
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

      {selectedClass && subjects.length === 0 && selectedExamId && (
         <Card className="mt-4">
            <CardHeader>
                <CardTitle>No Subjects Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">There are no subjects defined for the class "{selectedClass}". Please add subjects on the <a href="/classes" className="text-primary underline">Classes</a> page first.</p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

    
