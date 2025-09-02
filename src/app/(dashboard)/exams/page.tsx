
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
import { FileSignature, PlusCircle, Trash2, Printer, Check, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MarksheetPrintReport } from '@/components/reports/marksheet-print';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ResultCardPrint } from '@/components/reports/result-card-print';

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

  // Result Card State
  const [selectedExamsForCard, setSelectedExamsForCard] = useState<ExamType[]>([]);
  const [selectedStudentsForCard, setSelectedStudentsForCard] = useState<string[]>([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);

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
    if (subjects.length > 0) {
        const initialTotals = subjects.reduce((acc, subject) => {
            acc[subject] = 100;
            return acc;
        }, {} as {[subject: string]: number});
        setSubjectTotals(initialTotals);
    }
  }, [subjects]);

  const handleCreateNewExam = () => {
    if (!selectedClass || !newExamName.trim()) {
      toast({ title: 'Error', description: 'Please select a class and enter a name for the new exam.', variant: 'destructive' });
      return;
    }
    const newExam: ExamType = {
      id: `EXAM-${Date.now()}`,
      name: newExamName,
      class: selectedClass,
      subjectTotals,
      results: classStudents.map(s => ({ studentId: s.id, marks: {} })),
    };
    addExam(newExam);
    setSelectedExamId(newExam.id);
    setCurrentResults(newExam.results);
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

  const handleExamForCardSelection = (exam: ExamType, checked: boolean) => {
    setSelectedExamsForCard(prev => 
      checked ? [...prev, exam] : prev.filter(e => e.id !== exam.id)
    );
  };

  const handleStudentForCardSelection = (studentId: string, checked: boolean) => {
    setSelectedStudentsForCard(prev => 
      checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
    );
  };
  
  useEffect(() => {
    if (selectAllStudents) {
      setSelectedStudentsForCard(classStudents.map(s => s.id));
    } else {
      setSelectedStudentsForCard([]);
    }
  }, [selectAllStudents, classStudents]);


  const handlePrintResultCards = () => {
     if (selectedExamsForCard.length === 0 || selectedStudentsForCard.length === 0) {
        toast({ title: "Selection Missing", description: "Please select at least one exam and one student.", variant: 'destructive'});
        return;
    }

    const studentsToPrint = allStudents.filter(s => selectedStudentsForCard.includes(s.id));

    const printContent = renderToString(
      <ResultCardPrint 
        students={studentsToPrint}
        exams={selectedExamsForCard}
        settings={settings}
      />
    );
     const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Result Cards - ${selectedClass}</title>
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
          <CardTitle>Select Class</CardTitle>
          <CardDescription>Select a class to manage exams, marksheet, or result cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={(value) => { 
              setSelectedClass(value); 
              setSelectedExamId(null); 
              setCurrentResults([]); 
              setSelectedExamsForCard([]);
              setSelectedStudentsForCard([]);
            }}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClass && (
        <Tabs defaultValue="marksheet">
            <TabsList>
                <TabsTrigger value="marksheet">Marksheet</TabsTrigger>
                <TabsTrigger value="resultcards">Result Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="marksheet">
                <Card>
                    <CardHeader>
                        <CardTitle>Create or Select Exam</CardTitle>
                        <CardDescription>Choose an existing exam or create a new one for the selected class.</CardDescription>
                         <div className="flex gap-2 pt-2">
                            <Select onValueChange={handleExamChange} value={selectedExamId || ''} disabled={!selectedClass}>
                                <SelectTrigger>
                                <SelectValue placeholder="Select an exam" />
                                </SelectTrigger>
                                <SelectContent>
                                {classExams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
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

                 {subjects.length === 0 && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle>No Subjects Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">There are no subjects defined for the class "{selectedClass}". Please add subjects on the <a href="/classes" className="text-primary underline">Classes</a> page first.</p>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
            <TabsContent value="resultcards">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Result Cards</CardTitle>
                        <CardDescription>Select which exams and students to include in the result cards.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="text-base font-semibold">1. Select Exams to Include</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 mt-2 border rounded-md">
                                {classExams.map(exam => (
                                    <div key={exam.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`exam-${exam.id}`}
                                            onCheckedChange={(checked) => handleExamForCardSelection(exam, checked as boolean)}
                                        />
                                        <Label htmlFor={`exam-${exam.id}`} className="font-medium">{exam.name}</Label>
                                    </div>
                                ))}
                                {classExams.length === 0 && <p className="text-muted-foreground col-span-full">No exams found for this class.</p>}
                            </div>
                        </div>

                        <div>
                            <Label className="text-base font-semibold">2. Select Students</Label>
                             <div className="border rounded-lg mt-2">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                onCheckedChange={(checked) => setSelectAllStudents(checked as boolean)}
                                                checked={selectAllStudents}
                                            />
                                        </TableHead>
                                        <TableHead>Student ID</TableHead>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead>Father Name</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {classStudents.map((student) => (
                                        <TableRow key={student.id} data-state={selectedStudentsForCard.includes(student.id) && 'selected'}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedStudentsForCard.includes(student.id)}
                                                    onCheckedChange={(checked) => handleStudentForCardSelection(student.id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell>{student.id}</TableCell>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.fatherName}</TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button size="lg" onClick={handlePrintResultCards} disabled={selectedExamsForCard.length === 0 || selectedStudentsForCard.length === 0}>
                               <Printer className="w-4 h-4 mr-2" /> Print Result Cards ({selectedStudentsForCard.length})
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
