

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Exam as ExamType, ExamResult, Student, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, PlusCircle, Trash2, Printer, Edit, Save, Loader2, MoreHorizontal, FileSpreadsheet, BarChart3, Clock, File, TestTube, ChevronsRight, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MarksheetPrintReport } from '@/components/reports/marksheet-print';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { format, isWithinInterval, addDays } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubjectSummaryPrintReport } from '@/components/reports/subject-summary-report';
import { BlankExamMarksheetPrint } from '@/components/reports/blank-exam-marksheet-print';
import { BlankMarksheetPrint } from '@/components/reports/blank-marksheet-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const ExamDialog = ({
    open,
    onOpenChange,
    exam,
    onSave
} : {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    exam: ExamType | null,
    onSave: (examData: any) => void
}) => {
    const { classes } = useData();
    const { settings } = useSettings();
    const { toast } = useToast();

    const isEditing = !!exam;

    const [examName, setExamName] = useState('');
    const [academicSession, setAcademicSession] = useState(settings.academicYear);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [examType, setExamType] = useState<'Single Subject' | 'Full Test' | 'Manual'>('Full Test');
    const [singleSubject, setSingleSubject] = useState<string | undefined>(undefined);
    const [manualSubject, setManualSubject] = useState('');
    const [totalMarks, setTotalMarks] = useState(100);
    const [submissionDeadline, setSubmissionDeadline] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (exam) {
            setExamName(exam.name);
            setAcademicSession(exam.academicSession);
            setSelectedClass(exam.class);
            setExamType(exam.examType);
            setSingleSubject(exam.examType === 'Single Subject' ? exam.subject : undefined);
            setManualSubject(exam.examType === 'Manual' ? exam.subject || '' : '');
            setTotalMarks(exam.totalMarks);
            setSubmissionDeadline(exam.submissionDeadline);
        } else {
             setExamName('');
             setAcademicSession(settings.academicYear);
             setSelectedClass('');
             setExamType('Full Test');
             setSingleSubject(undefined);
             setManualSubject('');
             setTotalMarks(100);
             setSubmissionDeadline(undefined);
        }
    }, [exam, settings.academicYear]);


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

    const handleSave = async () => {
        if (!examName || !academicSession || !selectedClass || !examType) {
            toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive"});
            return;
        }
        if (examType === 'Single Subject' && !singleSubject) {
             toast({ title: "Missing Subject", description: "Please select a subject for the single subject test.", variant: "destructive"});
            return;
        }
        if (examType === 'Manual' && !manualSubject.trim()) {
            toast({ title: "Missing Subject Name", description: "Please provide a subject name for the manual test.", variant: "destructive"});
            return;
        }

        const cls = classes.find(c => c.name === selectedClass);
        if (!cls) return;

        let subjectTotals: { [key: string]: number } = {};
        let subjectName: string | undefined = undefined;

        if (examType === 'Single Subject' && singleSubject) {
            subjectTotals[singleSubject] = totalMarks;
            subjectName = singleSubject;
        } else if (examType === 'Full Test') {
            cls.subjects.forEach(sub => {
                subjectTotals[sub] = totalMarks;
            });
        } else if (examType === 'Manual' && manualSubject.trim()) {
            const trimmedSubject = manualSubject.trim();
            subjectTotals[trimmedSubject] = totalMarks;
            subjectName = trimmedSubject;
        }

        const newExamData = {
            name: examName,
            academicSession,
            class: selectedClass,
            examType,
            subject: subjectName,
            totalMarks,
            subjectTotals,
            submissionDeadline,
        };

        onSave(newExamData);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Exam' : 'Create New Exam'}</DialogTitle>
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
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="class-select">Class</Label>
                            <Select onValueChange={setSelectedClass} value={selectedClass}><SelectTrigger><SelectValue placeholder="Select a class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
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
                             <Select onValueChange={setSingleSubject} value={singleSubject} disabled={availableSubjects.length === 0}><SelectTrigger><SelectValue placeholder="Select subject"/></SelectTrigger><SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                        </div>
                    )}
                    {examType === 'Manual' && (
                        <div className="space-y-2">
                            <Label htmlFor="manual-subject">Subject Name</Label>
                            <Input id="manual-subject" placeholder="e.g., Art Competition" value={manualSubject} onChange={e => setManualSubject(e.target.value)} />
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
                    <Button onClick={handleSave}>{isEditing ? 'Save Changes' : 'Create Exam'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const BlankSheetDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { classes, students } = useData();
    const { settings } = useSettings();
    const { toast } = useToast();

    const [sheetType, setSheetType] = useState<'full' | 'single'>('full');
    const [selectedClass, setSelectedClass] = useState<Class | null>(null);
    const [examName, setExamName] = useState('');
    const [subjectMarks, setSubjectMarks] = useState<{ [key: string]: number }>({});
    const [singleSubject, setSingleSubject] = useState('');
    const [singleSubjectTotalMarks, setSingleSubjectTotalMarks] = useState(100);
    const [isProcessing, setIsProcessing] = useState(false);

    const availableSubjects = useMemo(() => selectedClass?.subjects || [], [selectedClass]);

    useEffect(() => {
        if (selectedClass) {
            setSubjectMarks(selectedClass.subjects.reduce((acc, s) => ({ ...acc, [s]: 100 }), {}));
            setSingleSubject('');
        } else {
            setSubjectMarks({});
            setSingleSubject('');
        }
    }, [selectedClass]);

    const getPrintComponent = () => {
        if (!selectedClass || !examName) return null;
        const studentsToPrint = students.filter(s => s.class === selectedClass.name && s.status === 'Active');

        if (sheetType === 'single') {
            if (!singleSubject) return null;
            return (
                <BlankMarksheetPrint
                    testName={examName}
                    className={selectedClass.name}
                    subject={singleSubject}
                    students={studentsToPrint}
                    totalMarks={singleSubjectTotalMarks}
                    settings={settings}
                />
            );
        } else { // 'full'
            return (
                <BlankExamMarksheetPrint
                    examName={examName}
                    className={selectedClass.name}
                    subjects={selectedClass.subjects}
                    students={studentsToPrint}
                    subjectTotals={subjectMarks}
                    settings={settings}
                />
            );
        }
    };

    const handlePrint = () => {
        const component = getPrintComponent();
        if (!component) {
            toast({ title: 'Missing Information', description: "Please fill out all required fields.", variant: 'destructive' });
            return;
        }

        const printContent = renderToString(component);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Blank Marksheet - ${examName}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css" /></head><body>${printContent}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
        }
        onOpenChange(false);
    };

    const handleDownloadPdf = async () => {
        const component = getPrintComponent();
        if (!component) {
            toast({ title: 'Missing Information', description: "Please fill out all required fields.", variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        const printContent = renderToString(component);
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = printContent;
        document.body.appendChild(container);

        try {
            const canvas = await html2canvas(container.firstChild as HTMLElement, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
            pdf.save(`blank-marksheet-${examName.replace(/ /g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF generation failed", error);
            toast({ title: 'PDF Generation Failed', variant: 'destructive'});
        } finally {
            document.body.removeChild(container);
            setIsProcessing(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Print Blank Marksheet</DialogTitle>
                    <DialogDescription>Generate a blank marksheet for manual entry.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Class</Label><Select onValueChange={(val) => setSelectedClass(classes.find(c => c.name === val) || null)}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-2"><Label>Exam/Test Name</Label><Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g., Monthly Test" /></div>
                    </div>
                     <div className="space-y-2">
                        <Label>Marksheet Type</Label>
                        <RadioGroup value={sheetType} onValueChange={(v) => setSheetType(v as any)} className="flex gap-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="full" id="type-full" /> <Label htmlFor="type-full">Full Exam</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="single" id="type-single" /> <Label htmlFor="type-single">Single Subject</Label></div>
                        </RadioGroup>
                    </div>

                    {selectedClass && sheetType === 'full' && (
                        <div className="space-y-2">
                            <Label>Total Marks per Subject</Label>
                            <ScrollArea className="h-48 border rounded-md p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {availableSubjects.map(subject => (
                                        <div key={subject} className="flex items-center gap-2">
                                            <Label className="w-24 text-right">{subject}</Label>
                                            <Input type="number" value={subjectMarks[subject] || ''} onChange={(e) => setSubjectMarks(prev => ({ ...prev, [subject]: Number(e.target.value) }))} />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                    {selectedClass && sheetType === 'single' && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Select onValueChange={setSingleSubject} value={singleSubject}><SelectTrigger><SelectValue placeholder="Select subject"/></SelectTrigger><SelectContent>{availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Total Marks</Label>
                                <Input type="number" value={singleSubjectTotalMarks} onChange={e => setSingleSubjectTotalMarks(Number(e.target.value))}/>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleDownloadPdf} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}
                        PDF
                    </Button>
                    <Button onClick={handlePrint} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                        Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function ExamsPage() {
  const { classes, students: allStudents, exams, addExam, updateExam, deleteExam } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [currentResults, setCurrentResults] = useState<ExamResult[]>([]);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openBlankSheetDialog, setOpenBlankSheetDialog] = useState(false);
  const [examToEdit, setExamToEdit] = useState<ExamType | null>(null);
  const [examToDelete, setExamToDelete] = useState<ExamType | null>(null);

  // State for master sheet
  const [masterSheetClass, setMasterSheetClass] = useState('');
  const [masterSheetSubject, setMasterSheetSubject] = useState('');


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
    if (selectedExam.examType === 'Manual' && selectedExam.subject) {
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

  const marksheetData = useMemo((): any[] => {
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
    updateExam(selectedExam.id, { results: currentResults });
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
              fontSize={'text-sm'}
          />
      );
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>${exam.name} - Marksheet</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
      }
  };

  const handleCreateExam = async (examData: any) => {
    const newId = await addExam(examData);
    if (newId) {
      toast({ title: 'Exam Created!' });
      setSelectedExamId(newId);
    }
  };

  const handleEditExam = (exam: ExamType) => {
    setExamToEdit(exam);
    setOpenEditDialog(true);
  }

  const handleUpdateExam = (examData: any) => {
    if(!examToEdit) return;
    updateExam(examToEdit.id, examData);
    toast({ title: 'Exam Updated!'});
  }

  const handleDeleteExam = (exam: ExamType) => {
    setExamToDelete(exam);
  }

  const confirmDeleteExam = () => {
    if(!examToDelete) return;
    deleteExam(examToDelete.id);
    toast({ title: 'Exam Deleted', variant: 'destructive'});
    if(selectedExamId === examToDelete.id) setSelectedExamId(null);
    setExamToDelete(null);
  }

  const sortedExams = useMemo(() => exams.sort((a, b) => new Date(b.submissionDeadline || 0).getTime() - new Date(a.submissionDeadline || 0).getTime()), [exams]);

  // Master Sheet Logic
  const masterSheetSubjects = useMemo(() => {
    if (!masterSheetClass) return [];
    return classes.find(c => c.name === masterSheetClass)?.subjects || [];
  }, [masterSheetClass, classes]);

  const masterSheetTests = useMemo(() => {
    if (!masterSheetClass || !masterSheetSubject) return [];
    return exams.filter(e => e.class === masterSheetClass && (e.examType === 'Single Subject' || e.examType === 'Manual') && e.subject === masterSheetSubject)
      .sort((a, b) => new Date(a.submissionDeadline || a.id).getTime() - new Date(b.submissionDeadline || b.id).getTime());
  }, [masterSheetClass, masterSheetSubject, exams]);

  const masterSheetStudents = useMemo(() => {
    if (!masterSheetClass) return [];
    return allStudents.filter(s => s.class === masterSheetClass && s.status === 'Active');
  }, [masterSheetClass, allStudents]);

  const handlePrintMasterSheet = () => {
    if (!masterSheetClass || !masterSheetSubject) {
      toast({ title: "Filter required", description: "Please select a class and a subject.", variant: "destructive" });
      return;
    }

    const printContent = renderToString(<SubjectSummaryPrintReport students={masterSheetStudents} tests={masterSheetTests} subject={masterSheetSubject} className={masterSheetClass} settings={settings} />);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>Subject Summary - ${masterSheetSubject} - ${masterSheetClass}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css" /></head><body data-layout="landscape">${printContent}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const sevenDaysLater = addDays(today, 7);
    return exams.filter(exam =>
        exam.submissionDeadline && isWithinInterval(new Date(exam.submissionDeadline), { start: today, end: sevenDaysLater })
    ).sort((a, b) => new Date(a.submissionDeadline!).getTime() - new Date(b.submissionDeadline!).getTime());
  }, [exams]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><FileSignature /> Exam</h1>
        <Button onClick={() => setOpenCreateDialog(true)}><PlusCircle className="mr-2 h-4 w-4"/> Create New Exam</Button>
      </div>

       <ExamDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        exam={null}
        onSave={handleCreateExam}
       />
       <ExamDialog
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        exam={examToEdit}
        onSave={handleUpdateExam}
       />
       <BlankSheetDialog open={openBlankSheetDialog} onOpenChange={setOpenBlankSheetDialog} />
       <AlertDialog open={!!examToDelete} onOpenChange={() => setExamToDelete(null)}>
          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this exam and all its results. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteExam} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

       <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="exam-history">Exam History</TabsTrigger>
                <TabsTrigger value="master-sheets">Master Sheets</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle className="flex items-center gap-2"><ChevronsRight/>Quick Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full" onClick={() => setOpenCreateDialog(true)}><TestTube className="mr-2 h-4 w-4"/>Create New Exam</Button>
                            <Button className="w-full" variant="outline" onClick={() => setOpenBlankSheetDialog(true)}><File className="mr-2 h-4 w-4"/>Print Blank Sheet</Button>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Clock />Upcoming Submission Deadlines</CardTitle>
                            <CardDescription>Exams with result submission deadlines in the next 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-60">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Exam</TableHead><TableHead>Class</TableHead><TableHead>Deadline</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {upcomingDeadlines.length > 0 ? upcomingDeadlines.map(exam => (
                                            <TableRow key={exam.id}>
                                                <TableCell className="font-medium">{exam.name}</TableCell>
                                                <TableCell>{exam.class}</TableCell>
                                                <TableCell>{format(new Date(exam.submissionDeadline!), 'dd-MMM-yyyy')}</TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No upcoming deadlines.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                 </div>
            </TabsContent>
            <TabsContent value="exam-history" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Exam History</CardTitle>
                        <CardDescription>Manage and enter marks for all created exams.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <ScrollArea className="h-72 border rounded-lg">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Exam Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedExams.map(exam => (
                                <TableRow key={exam.id} className={exam.id === selectedExamId ? 'bg-muted' : ''}>
                                <TableCell>{exam.submissionDeadline ? format(new Date(exam.submissionDeadline), 'dd-MMM-yy') : 'N/A'}</TableCell>
                                <TableCell className="font-medium">{exam.name}</TableCell>
                                <TableCell>{exam.class}</TableCell>
                                <TableCell><Badge variant="secondary">{exam.examType}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => setSelectedExamId(exam.id)}>
                                                <FileSignature className="mr-2 h-4 w-4"/> Enter Marks
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleEditExam(exam)}>
                                                <Edit className="mr-2 h-4 w-4"/> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handlePrintMarksheet(exam.id)}>
                                                <Printer className="mr-2 h-4 w-4"/> Print Results
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => handleDeleteExam(exam)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                </TableRow>
                            ))}
                            {sortedExams.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No exams created yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </ScrollArea>
                    </CardContent>
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
            </TabsContent>
            <TabsContent value="master-sheets" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Master Sheets</CardTitle>
                                <CardDescription>View a consolidated summary of all single subject tests for a class.</CardDescription>
                            </div>
                            <Button onClick={handlePrintMasterSheet} variant="outline" disabled={!masterSheetClass || !masterSheetSubject}>
                                <FileSpreadsheet className="mr-2 h-4 w-4"/> Print Master Sheet
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4 p-4 border rounded-lg">
                             <div className="w-full md:w-1/3">
                                <Label>Class</Label>
                                <Select value={masterSheetClass} onValueChange={setMasterSheetClass}>
                                    <SelectTrigger><SelectValue placeholder="Select Class"/></SelectTrigger>
                                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                             </div>
                             <div className="w-full md:w-1/3">
                                <Label>Subject</Label>
                                <Select value={masterSheetSubject} onValueChange={setMasterSheetSubject} disabled={masterSheetSubjects.length === 0}>
                                    <SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger>
                                    <SelectContent>{masterSheetSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                             </div>
                        </div>
                        <ScrollArea className="h-[600px] border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        {masterSheetTests.map(test => (
                                            <TableHead key={test.id} className="text-center">{test.name}<br/>({test.submissionDeadline ? format(new Date(test.submissionDeadline), 'dd-MMM') : 'N/A'})</TableHead>
                                        ))}
                                        <TableHead className="text-right font-bold">Overall %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {masterSheetStudents.map(student => {
                                        let grandTotal = 0;
                                        let grandObtained = 0;
                                        masterSheetTests.forEach(test => {
                                            grandTotal += test.totalMarks;
                                            const marks = test.results.find(r => r.studentId === student.id)?.marks[masterSheetSubject];
                                            grandObtained += (typeof marks === 'number' ? marks : 0);
                                        });
                                        const overallPercentage = grandTotal > 0 ? ((grandObtained / grandTotal) * 100) : 0;

                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                {masterSheetTests.map(test => {
                                                    const result = test.results.find(r => r.studentId === student.id);
                                                    const marks = result?.marks[masterSheetSubject];
                                                    return (
                                                        <TableCell key={test.id} className="text-center">{marks ?? '-'}</TableCell>
                                                    )
                                                })}
                                                <TableCell className="text-right font-bold">{overallPercentage.toFixed(1)}%</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                     {masterSheetStudents.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={masterSheetTests.length + 2} className="text-center h-24">
                                                Select a class and subject to view the master sheet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>
      </Tabs>
    </div>
  );
}
