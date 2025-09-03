
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, Loader2 } from 'lucide-react';
import { ResultCardPrint } from '@/components/reports/result-card-print';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

export default function ResultCardsPage() {
  const { classes, students: allStudents, exams: allExams } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [remarks, setRemarks] = useState('Congratulations on your hard work! Keep it up.');
  const [isLoading, setIsLoading] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');


  const classExams = useMemo(() => {
    return selectedClass ? allExams.filter(e => e.class === selectedClass) : [];
  }, [selectedClass, allExams]);

  const classStudents = useMemo(() => {
    return selectedClass ? allStudents.filter(s => s.class === selectedClass) : [];
  }, [selectedClass, allStudents]);

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedExamIds([]);
    setSelectedStudentIds([]);
  };

  const handleExamSelection = (examId: string) => {
    setSelectedExamIds(prev =>
      prev.includes(examId) ? prev.filter(id => id !== examId) : [...prev, examId]
    );
  };
  
  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };
  
  const handleSelectAllStudents = (checked: boolean) => {
    setSelectedStudentIds(checked ? classStudents.map(s => s.id) : []);
  };
  
  const isAllStudentsSelected = classStudents.length > 0 && selectedStudentIds.length === classStudents.length;

  const handlePrint = () => {
    if (!selectedClass || selectedExamIds.length === 0 || selectedStudentIds.length === 0) {
      toast({
        title: 'Selection Incomplete',
        description: 'Please select a class, at least one exam, and at least one student.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    toast({ title: "Generating Result Cards..." });

    const examsToPrint = allExams.filter(e => selectedExamIds.includes(e.id));
    const studentsToPrint = allStudents.filter(s => selectedStudentIds.includes(s.id));

    setTimeout(() => {
      const printContent = renderToString(
        <ResultCardPrint 
          students={studentsToPrint} 
          exams={examsToPrint} 
          settings={settings} 
          classes={classes} 
          remarks={remarks}
          printOrientation={printOrientation}
        />
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Result Cards - ${selectedClass}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link rel="stylesheet" href="/print-styles.css">
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
      }
      setIsLoading(false);
    }, 500);
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Result Card Generator</CardTitle>
          <CardDescription>Generate and print final result cards for students. Select a class to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
               <h3 className="font-semibold text-lg">2. Select Exams to Include</h3>
               <div className="p-3 border rounded-md min-h-[100px] space-y-2">
                  {selectedClass ? (
                    classExams.length > 0 ? (
                      classExams.map(exam => (
                        <div key={exam.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`exam-${exam.id}`}
                            checked={selectedExamIds.includes(exam.id)}
                            onCheckedChange={() => handleExamSelection(exam.id)}
                          />
                          <label htmlFor={`exam-${exam.id}`} className="text-sm font-medium leading-none">
                            {exam.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center pt-5">No exams found for this class.</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground text-center pt-5">Select a class first.</p>
                  )}
               </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">3. Select Students</h3>
               <ScrollArea className="border rounded-md h-[250px]">
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
                           <TableHead>Student Name</TableHead>
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
          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <h3 className="font-semibold text-lg">4. Remarks</h3>
                  <div className="mt-2">
                      <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Congratulations on your hard work!" />
                  </div>
              </div>
               <div>
                 <h3 className="font-semibold text-lg">5. Print Options</h3>
                  <div className="mt-2">
                     <Select value={printOrientation} onValueChange={(value) => setPrintOrientation(value as 'portrait' | 'landscape')}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Orientation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="portrait">Portrait</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
              </div>
          </div>
           <div className="flex justify-end mt-6 pt-6 border-t">
              <Button size="lg" onClick={handlePrint} disabled={isLoading || selectedStudentIds.length === 0 || selectedExamIds.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                Print Result Cards ({selectedStudentIds.length} Selected)
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
