
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
import { Printer, BookText, Save, Edit, Trash2, PlusCircle, CalendarIcon, Loader2, FileSpreadsheet, Download, File, X } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { SingleSubjectTestReport } from '@/components/reports/single-subject-test-report';
import { BlankMarksheetPrint } from '@/components/reports/blank-marksheet-print';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SubjectSummaryPrintReport } from '@/components/reports/subject-summary-report';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Component for the right pane (editor)
const TestEditor = ({
    testId,
    onClose,
}: {
    testId: string | 'new';
    onClose: () => void;
}) => {
    const { classes, students: allStudents, singleSubjectTests, addSingleSubjectTest, updateSingleSubjectTest } = useData();
    const { settings } = useSettings();
    const { toast } = useToast();

    const isCreatingNew = testId === 'new';
    const [selectedTestId, setSelectedTestId] = useState<string | null>(isCreatingNew ? null : testId);

    // Form state
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [testName, setTestName] = useState('');
    const [testDate, setTestDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [totalMarks, setTotalMarks] = useState<number>(100);
    const [studentMarks, setStudentMarks] = useState<Record<string, number | undefined>>({});
    
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (!isCreatingNew && testId) {
            const test = singleSubjectTests.find(t => t.id === testId);
            if (test) {
                setSelectedClass(test.class);
                setSelectedSection(test.section || null);
                setSelectedSubject(test.subject);
                setTestName(test.testName);
                setTestDate(test.date);
                setTotalMarks(test.totalMarks);
                setStudentMarks(test.results);
                setSelectedTestId(test.id);
            }
        }
    }, [testId, isCreatingNew, singleSubjectTests]);
    
    const classStudents = useMemo(() => {
        if (!selectedClass) return [];
        let students = allStudents.filter(s => s.class === selectedClass && s.status === 'Active');
        if (selectedSection && selectedSection !== 'all') {
            students = students.filter(s => s.section === selectedSection);
        }
        return students;
    }, [selectedClass, selectedSection, allStudents]);

    const availableSections = useMemo(() => classes.find(c => c.name === selectedClass)?.sections || [], [selectedClass, classes]);
    const subjects = useMemo(() => classes.find(c => c.name === selectedClass)?.subjects || [], [selectedClass, classes]);
    
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

        if (!isCreatingNew && selectedTestId) {
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
        const printContent = renderToString(<SingleSubjectTestReport testName={testName} className={selectedClass!} subject={selectedSubject!} marksheetData={marksheetData} totalMarks={totalMarks} settings={settings} />);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`<html><head><title>${testName} - ${selectedClass}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
          printWindow.document.close(); printWindow.focus();
        }
    };

    const handlePrintBlankSheet = () => {
        const printContent = renderToString(<BlankMarksheetPrint testName={testName} className={selectedClass!} subject={selectedSubject!} students={classStudents} totalMarks={totalMarks} settings={settings} />);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`<html><head><title>Blank Marksheet - ${testName}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"></head><body>${printContent}</body></html>`);
          printWindow.document.close(); printWindow.focus();
        }
    };
    
    const renderAndDownloadJpg = async () => {
        setIsDownloading(true);
        const printContentString = renderToString(<SingleSubjectTestReport testName={testName} className={selectedClass!} subject={selectedSubject!} marksheetData={marksheetData} totalMarks={totalMarks} settings={settings} />);
        const reportElement = document.createElement('div');
        reportElement.style.position = 'absolute'; reportElement.style.left = '-9999px';
        reportElement.innerHTML = printContentString;
        document.body.appendChild(reportElement);
        try {
          const canvas = await html2canvas(reportElement.firstChild as HTMLElement, { scale: 2, useCORS: true });
          const image = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.download = `${testName}-${selectedClass}.jpg`;
          link.href = image;
          link.click();
          toast({ title: 'Download Started' });
        } catch (error) {
          console.error('Error generating JPG:', error);
          toast({ title: 'Download Failed', variant: 'destructive' });
        } finally {
          document.body.removeChild(reportElement);
          setIsDownloading(false);
        }
    };


    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
                <div className="flex justify-between items-center">
                    <CardTitle>{isCreatingNew ? 'Create New Test' : 'Edit Test'}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4"/></Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-6">
                 {/* Setup Section */}
                <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><Label>Class</Label><Select onValueChange={(val) => {setSelectedClass(val); setSelectedSection(null); setSelectedSubject(null);}} value={selectedClass || ''} disabled={!isCreatingNew}><SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Section (Optional)</Label><Select onValueChange={(v) => setSelectedSection(v === 'all' ? null : v)} value={selectedSection || 'all'} disabled={!isCreatingNew || availableSections.length === 0}><SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Subject</Label><Select onValueChange={setSelectedSubject} value={selectedSubject || ''} disabled={!isCreatingNew || subjects.length === 0}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Test Name</Label><Input placeholder="e.g., Chapter 1 Test" value={testName} onChange={(e) => setTestName(e.target.value)} /></div>
                        <div><Label>Date</Label><Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}/></div>
                        <div><Label>Total Marks</Label><Input type="number" placeholder="e.g., 100" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} /></div>
                    </div>
                </div>

                {/* Marksheet Section */}
                {selectedClass && selectedSubject && (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader><TableRow><TableHead>Roll No.</TableHead><TableHead>Student Name</TableHead><TableHead>Obtained Marks</TableHead><TableHead className="text-center">Percentage</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {marksheetData.length > 0 ? marksheetData.map(row => (
                                    <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell className="w-48"><Input type="number" placeholder="-" value={row.obtainedMarks ?? ''} onChange={(e) => handleMarksChange(row.id, e.target.value)} max={totalMarks}/></TableCell>
                                    <TableCell className="text-center">{row.obtainedMarks !== undefined ? `${((row.obtainedMarks / totalMarks) * 100).toFixed(1)}%` : '-'}</TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={4} className="h-24 text-center">No students in this class/section.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
            <div className="p-6 pt-0 flex-shrink-0">
                <div className="flex justify-end items-center gap-2 border-t pt-4">
                    <Button variant="outline" onClick={handlePrintBlankSheet} disabled={!selectedClass || !selectedSubject}><File className="mr-2 h-4 w-4"/>Blank Sheet</Button>
                    <Button variant="outline" onClick={handlePrint} disabled={!selectedClass || !selectedSubject}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                    <Button variant="outline" onClick={renderAndDownloadJpg} disabled={isDownloading || !selectedClass || !selectedSubject}>{isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}JPG</Button>
                    <Button onClick={handleSaveTest}><Save className="mr-2 h-4 w-4"/> {isCreatingNew ? 'Save' : 'Update'}</Button>
                </div>
            </div>
        </Card>
    );
};


// Main Page Component
export default function SingleSubjectTestPage() {
    const { classes, students: allStudents, singleSubjectTests, deleteSingleSubjectTest } = useData();
    const { settings } = useSettings();
    const { toast } = useToast();

    const [activeTestId, setActiveTestId] = useState<string | 'new' | null>(null);
    const [filterClass, setFilterClass] = useState<string | null>(null);
    const [filterSubject, setFilterSubject] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadingTestId, setDownloadingTestId] = useState<string | null>(null);

    const filterSubjects = useMemo(() => filterClass ? classes.find(c => c.name === filterClass)?.subjects || [] : [], [filterClass, classes]);
    
    const filteredTests = useMemo(() => {
        let tests = singleSubjectTests;
        if (filterClass) tests = tests.filter(t => t.class === filterClass);
        if (filterSubject) tests = tests.filter(t => t.subject === filterSubject);
        return tests;
    }, [singleSubjectTests, filterClass, filterSubject]);

    const handlePrintSummary = () => {
        if (!filterClass || !filterSubject) {
            toast({ title: "Filter required", description: "Please select a class and a subject to generate the summary.", variant: "destructive" });
            return;
        }

        const studentsForSummary = allStudents.filter(s => s.class === filterClass);
        const printContent = renderToString(<SubjectSummaryPrintReport students={studentsForSummary} tests={filteredTests} subject={filterSubject} className={filterClass} settings={settings} />);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Subject Summary - ${filterSubject} - ${filterClass}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css" /></head><body data-layout="landscape">${printContent}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
        }
    };

    const handleDownloadSummaryJpg = async () => {
        if (!filterClass || !filterSubject) {
          toast({ title: "Filter required", description: "Please select a class and a subject.", variant: "destructive" });
          return;
        }

        const studentsForSummary = allStudents.filter(s => s.class === filterClass);
        setIsDownloading(true);
        setDownloadingTestId('summary');

        const printContentString = renderToString(<SubjectSummaryPrintReport students={studentsForSummary} tests={filteredTests} subject={filterSubject} className={filterClass} settings={settings} />);
        const reportElement = document.createElement('div');
        reportElement.style.position = 'absolute'; reportElement.style.left = '-9999px';
        reportElement.style.width = '1123px'; reportElement.style.height = '794px';
        reportElement.innerHTML = printContentString;
        document.body.appendChild(reportElement);

        try {
          const canvas = await html2canvas(reportElement.firstChild as HTMLElement, { scale: 2, useCORS: true, width: 1123, height: 794 });
          const image = canvas.toDataURL('image/jpeg', 0.95);
          const link = document.createElement('a');
          link.download = `SubjectSummary-${filterSubject}-${filterClass}.jpg`;
          link.href = image;
          link.click();
          toast({ title: 'Download Started' });
        } catch (error) {
          console.error('Error generating summary JPG:', error);
          toast({ title: 'Download Failed', variant: 'destructive' });
        } finally {
          document.body.removeChild(reportElement);
          setIsDownloading(false);
          setDownloadingTestId(null);
        }
    };


    if (activeTestId) {
        return <TestEditor testId={activeTestId} onClose={() => setActiveTestId(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><BookText /> Single Subject Test</h1>
                 <Button onClick={() => setActiveTestId('new')}><PlusCircle className="mr-2 h-4 w-4"/> Create New Test</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Saved Tests</CardTitle>
                    <CardDescription>View, edit, or generate summary reports for previously saved tests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Select onValueChange={(val) => { setFilterClass(val); setFilterSubject(null); }} value={filterClass || ''}>
                            <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
                            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select onValueChange={setFilterSubject} value={filterSubject || ''} disabled={!filterClass}>
                            <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
                            <SelectContent>{filterSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                         <div className="flex gap-2 items-center">
                            <Button variant="secondary" className="w-full" onClick={handlePrintSummary} disabled={!filterClass || !filterSubject}><FileSpreadsheet className="mr-2 h-4 w-4"/>Print Summary</Button>
                            <Button variant="outline" className="w-full" onClick={handleDownloadSummaryJpg} disabled={!filterClass || !filterSubject || (isDownloading && downloadingTestId === 'summary')}>{isDownloading && downloadingTestId === 'summary' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4"/>}JPG</Button>
                        </div>
                    </div>
                     <ScrollArea className="h-96">
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Test</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredTests.length > 0 ? filteredTests.map(test => (
                                    <TableRow key={test.id}>
                                        <TableCell>{format(new Date(test.date), 'dd-MMM-yy')}</TableCell>
                                        <TableCell>{test.testName}</TableCell>
                                        <TableCell>{test.class} {test.section ? `(${test.section})` : ''}</TableCell>
                                        <TableCell>{test.subject}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setActiveTestId(test.id)}><Edit className="h-4 w-4"/></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the test "{test.testName}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteSingleSubjectTest(test.id)} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No tests match the selected filters.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
