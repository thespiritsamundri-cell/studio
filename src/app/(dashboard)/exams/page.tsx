
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
import { FileSignature, PlusCircle, Trash2, Printer, File, Edit, Save, Download, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

const CreateExamDialog = ({ open, onOpenChange, onExamCreated }: { open: boolean, onOpenChange: (open: boolean) => void, onExamCreated: (examId: string) => void }) => {
    const { classes, teachers, addExam } = useData();
    const { settings } = useSettings();
    const { toast } = useToast();
    const [examName, setExamName] = useState('');
    const [academicSession, setAcademicSession] = useState(settings.academicYear);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [assignedTeacher, setAssignedTeacher] = useState<string | undefined>(undefined);
    const [examType, setExamType] = useState<'Single Subject' | 'Full Test' | 'Manual'>('Full Test');
    const [singleSubject, setSingleSubject] = useState<string | undefined>(undefined);
    const [totalMarks, setTotalMarks] = useState(100);
    const [submissionDeadline, setSubmissionDeadline] = useState<string | undefined>(undefined);

    const availableSubjects = useMemo(() => {
        if (!selectedClass) return [];
        return classes.find(c => c.name === selectedClass)?.subjects || [];
    }, [selectedClass, classes]);
    
     const generateAcademicYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = -2; i <= 2; i++) years.push(`${currentYear + i}-${currentYear + i + 1}`);
        return years;
     };

    const handleCreate = async () => {
        if (!examName || !academicSession || !selectedClass || !examType) {
            toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive"});
            return;
        }
        if (examType === 'Single Subject' && !singleSubject) {
             toast({ title: "Missing Subject", description: "Please select a subject for the single subject test.", variant: "destructive"});
            return;
        }
        
        const cls = classes.find(c => c.name === selectedClass);
        if (!cls) return;

        let subjectTotals: { [key: string]: number } = {};
        if (examType === 'Single Subject' && singleSubject) {
            subjectTotals[singleSubject] = totalMarks;
        } else if (examType === 'Full Test') {
            cls.subjects.forEach(sub => {
                subjectTotals[sub] = totalMarks;
            });
        }
        
        const newExamData: Omit<ExamType, 'id' | 'results'> = {
            name: examName,
            academicSession,
            class: selectedClass,
            teacherId: assignedTeacher,
            examType,
            subject: examType === 'Single Subject' ? singleSubject : undefined,
            totalMarks,
            subjectTotals,
            submissionDeadline,
        };

        const newExamId = await addExam(newExamData);
        if (newExamId) {
            toast({ title: "Exam Created!", description: `${examName} has been created successfully.` });
            onExamCreated(newExamId);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create New Exam</DialogTitle>
                    <DialogDescription>Fill in the details to set up a new exam.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="exam-name">Exam Name</Label>
                            <Input id="exam-name" placeholder="e.g., Mid-Term Test" value={examName} onChange={e => setExamName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="academic-session">Academic Session</Label>
                            <Select value={academicSession} onValueChange={setAcademicSession}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{generateAcademicYears().map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="class-select">Class</Label>
                            <Select onValueChange={setSelectedClass}><SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="teacher-select">Assign Teacher</Label>
                            <Select onValueChange={setAssignedTeacher}><SelectTrigger><SelectValue placeholder="Select a teacher"/></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>Exam Type</Label>
                        <RadioGroup value={examType} onValueChange={(v) => setExamType(v as any)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Single Subject" id="single"/> <Label htmlFor="single">Single Subject</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Full Test" id="full"/> <Label htmlFor="full">Full Test</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Manual" id="manual"/> <Label htmlFor="manual">Manual</Label></div>
                        </RadioGroup>
                    </div>
                    {examType === 'Single Subject' && (
                        <div className="space-y-2">
                             <Label htmlFor="subject-select">Subject</Label>
                             <Select onValueChange={setSingleSubject} disabled={availableSubjects.length === 0}><SelectTrigger><SelectValue placeholder="Select subject"/></SelectTrigger><SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                        </div>
                    )}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="total-marks">Total Marks per Subject</Label>
                            <Input id="total-marks" type="number" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))}/>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="deadline">Submission Deadline (Optional)</Label>
                             <Input id="deadline" type="date" value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)}/>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate}>Create Exam</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function ExamsPage() {
  const { classes, students: allStudents, exams, addExam, updateExam, deleteExam } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  
  const [currentResults, setCurrentResults] = useState<ExamResult[]>([]);
  const [fontSize, setFontSize] = useState('text-sm');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingTestId, setDownloadingTestId] = useState<string | null>(null);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filters for saved exams
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  
  const selectedExam = useMemo(() => {
    if (!selectedExamId) return null;
    return exams.find(e => e.id === selectedExamId);
  }, [selectedExamId, exams]);

  const classStudents = useMemo(() => {
    if (!selectedExam) return [];
    return allStudents.filter(s => s.class === selectedExam.class && s.status === 'Active');
  }, [selectedExam, allStudents]);

  
  const subjects = useMemo(() => {
    if (!selectedExam) return [];
    if (selectedExam.examType === 'Single Subject' && selectedExam.subject) {
        return [selectedExam.subject];
    }
    return Object.keys(selectedExam.subjectTotals);
  }, [selectedExam]);


  useEffect(() => {
    if (selectedExam) {
      setCurrentResults(selectedExam.results || []);
    } else {
      setCurrentResults([]);
    }
  }, [selectedExam]);


  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      setSelectedClass(exam.class);
      setCurrentResults(exam.results || []);
    }
  };
  
  const handleMarksChange = (studentId: string, subject: string, value: string) => {
    const marks = parseInt(value, 10);
    const total = selectedExam?.subjectTotals[subject] || 0;
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

  const marksheetData = useMemo((): MarksheetData[] => {
    if (!selectedExam) return [];
    
    const data = classStudents.map(student => {
      const result = currentResults.find(r => r.studentId === student.id);
      const obtainedMarks = subjects.reduce((total, subject) => total + (result?.marks[subject] || 0), 0);
      const totalMarks = subjects.reduce((total, subject) => total + (selectedExam.subjectTotals[subject] || 0), 0);
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
  }, [classStudents, currentResults, subjects, selectedExam]);

  const handleSaveResults = () => {
    if (!selectedExam) return;
    const updatedExam: Partial<ExamType> = {
      results: currentResults,
    };
    updateExam(selectedExam.id, updatedExam);
    toast({ title: 'Results Saved', description: `Results for ${selectedExam.name} have been saved successfully.` });
  };
  
  const handlePrintMarksheet = (examId: string) => {
      const exam = exams.find(e => e.id === examId);
      if (!exam) return;

      const studentsForPrint = allStudents.filter(s => s.class === exam.class);
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
      
      const printSubjects = (exam.examType === 'Single Subject' && exam.subject) ? [exam.subject] : Object.keys(exam.subjectTotals);

      const printContent = renderToString(
          <MarksheetPrintReport
              examName={exam.name}
              className={exam.class}
              subjects={printSubjects}
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
  
  const handleDownloadJpg = async (examId: string) => {
      // This is a simplified version. For a full implementation, refer to the previous logic.
      toast({ title: 'Download functionality is being updated.' });
  };
  
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
        if(filterClass && exam.class !== filterClass) return false;
        return true;
    }).sort((a, b) => new Date(b.submissionDeadline || 0).getTime() - new Date(a.submissionDeadline || 0).getTime());
  }, [exams, filterClass]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><FileSignature /> Exam Marksheets</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/> Create New Exam</Button>
      </div>

      <CreateExamDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onExamCreated={(newExamId) => {
            setSelectedExamId(newExamId);
        }}
       />
      
      <Card>
        <CardHeader>
          <CardTitle>Select Exam</CardTitle>
          <CardDescription>Select a class and then choose an exam to view or enter marks.</CardDescription>
          <div className="flex flex-col md:flex-row gap-2 pt-2">
            <Select onValueChange={(value) => { setSelectedClass(value); setSelectedExamId(null); }}>
                <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <Select onValueChange={handleExamChange} value={selectedExamId || ''} disabled={!selectedClass}>
                <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                {exams.filter(e => e.class === selectedClass).map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>
      
      {selectedExam && (
        <Card className="mt-4">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Marksheet: {selectedExam.name}</CardTitle>
              <CardDescription>Enter marks for each student. Totals and positions will be calculated automatically.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={handleSaveResults}><Save className="mr-2 h-4 w-4"/>Save Results</Button>
                <Button variant="outline" onClick={() => handlePrintMarksheet(selectedExamId!)}><Printer className="mr-2 h-4 w-4"/>Print</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-secondary z-20">
                  <TableRow>
                    <TableHead className="sticky left-0 bg-secondary z-30 min-w-[150px]">Student</TableHead>
                    {subjects.map(subject => <TableHead key={subject} className="text-center min-w-[120px]">{subject} ({selectedExam.subjectTotals[subject] || 0})</TableHead>)}
                    <TableHead className="text-center font-bold">Obtained</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-center font-bold">%</TableHead>
                    <TableHead className="text-center font-bold">Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marksheetData.map(row => (
                    <TableRow key={row.studentId}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">{row.studentName}</TableCell>
                      {subjects.map(subject => (
                        <TableCell key={subject}><Input type="number" className="text-center" placeholder="-" value={row.marks[subject] || ''} onChange={(e) => handleMarksChange(row.studentId, subject, e.target.value)} max={selectedExam.subjectTotals[subject]}/></TableCell>
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

      
       <Card>
        <CardHeader>
          <CardTitle>Saved Exams</CardTitle>
          <CardDescription>View, edit, or print previously created exams.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Select onValueChange={(val) => setFilterClass(val)}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Filter by class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-72 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                   <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map(exam => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell><Badge variant="secondary">{exam.examType}</Badge></TableCell>
                       <TableCell>{exam.submissionDeadline ? format(new Date(exam.submissionDeadline), 'dd-MMM-yy') : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedExamId(exam.id)}><Edit className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" onClick={() => handlePrintMarksheet(exam.id)}><Printer className="h-4 w-4"/></Button>
                          <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                              <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this exam and all its results. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => {deleteExam(exam.id);}} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                          </AlertDialog>
                      </TableCell>
                    </TableRow>
                ))}
                 {filteredExams.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No saved exams match filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
