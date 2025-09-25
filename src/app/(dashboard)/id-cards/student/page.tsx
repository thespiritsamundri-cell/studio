'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, Loader2, UserSquare2 } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentIdCardPrint } from '@/components/reports/student-id-card-print';
import { generateQrCode } from '@/ai/flows/generate-qr-code';

export default function StudentIdCardPage() {
  const { classes, students: allStudents } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const classStudents = useMemo(() => {
    return selectedClass ? allStudents.filter(s => s.class === selectedClass && s.status === 'Active') : [];
  }, [selectedClass, allStudents]);

  const handleClassChange = (className: string) => {
    setSelectedClass(className);
    setSelectedStudentIds([]);
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
    toast({ title: "Generating ID Cards..." });

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
        description: 'Could not generate QR codes for the cards. Printing without them.',
        variant: 'destructive',
      });
    }

    setTimeout(() => {
      const printContent = renderToString(
        <StudentIdCardPrint 
          students={studentsToPrint} 
          settings={settings}
          qrCodes={qrCodes}
        />
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Student ID Cards - ${selectedClass}</title>
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
          <CardTitle className="flex items-center gap-2"><UserSquare2 /> Student ID Card Generator</CardTitle>
          <CardDescription>Generate and print professional ID cards for students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <h3 className="font-semibold text-lg">2. Select Students ({selectedStudentIds.length} selected)</h3>
               <ScrollArea className="border rounded-md h-72">
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
                         {classStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center">
                                    No students in this class.
                                </TableCell>
                            </TableRow>
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
          
           <div className="flex justify-end mt-8 pt-6 border-t">
              <Button size="lg" onClick={handlePrint} disabled={isLoading || selectedStudentIds.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                Print ID Cards ({selectedStudentIds.length} Selected)
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
