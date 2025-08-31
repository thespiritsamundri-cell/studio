
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { students as allStudents } from '@/lib/data';
import type { Student } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer, FileDown, FileSpreadsheet } from 'lucide-react';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import { useReactToPrint } from 'react-to-print';

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reportDate, setReportDate] = useState<Date | null>(null);

  const classes = useMemo(() => {
    return ['all', ...Array.from(new Set(allStudents.map(s => s.class)))];
  }, []);

  const studentsInClass = useMemo(() => {
    if (!selectedClass || selectedClass === 'all') {
      return [];
    }
    return allStudents.filter(student => student.class === selectedClass);
  }, [selectedClass]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setIsPrinting(false),
  });

  useEffect(() => {
    if (isPrinting && reportDate) {
      handlePrint();
    }
  }, [isPrinting, reportDate, handlePrint]);

  const triggerPrint = () => {
    if (studentsInClass.length === 0) return;
    setReportDate(new Date());
    setIsPrinting(true);
  };
  
  const handleExportCsv = () => {
    if (studentsInClass.length === 0) return;
    const headers = ['ID', 'Name', 'FatherName', 'Class', 'AdmissionDate', 'FamilyId', 'Status', 'Phone', 'Address', 'DOB'];
    const csvContent = [
      headers.join(','),
      ...studentsInClass.map((student: Student) => 
        [
          student.id,
          `"${student.name}"`,
          `"${student.fatherName}"`,
          student.class,
          student.admissionDate,
          student.familyId,
          student.status,
          `"${student.phone}"`,
          `"${student.address.replace(/"/g, '""')}"`,
          student.dob
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${selectedClass}-students.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  return (
    <div className="space-y-6">
       <div style={{ display: 'none' }}>
        {reportDate && isPrinting && (
            <div ref={printRef}>
            <AllStudentsPrintReport students={studentsInClass} date={reportDate} />
            </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Classes</h1>
         {selectedClass && selectedClass !== 'all' && (
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={triggerPrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                 <Button variant="outline" onClick={triggerPrint}>
                    <FileDown className="mr-2 h-4 w-4" /> PDF Export
                </Button>
                <Button variant="outline" onClick={handleExportCsv}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel Export
                </Button>
            </div>
         )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class Overview</CardTitle>
          <CardDescription>Select a class to view the students enrolled.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="w-full max-w-sm mb-6">
             <Select onValueChange={setSelectedClass}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                    {classes.filter(c => c !== 'all').sort().map(c => (
                        <SelectItem key={c} value={c}>{c} Class</SelectItem>
                    ))}
                </SelectContent>
            </Select>
           </div>
          
          {selectedClass && selectedClass !== 'all' && (
             <>
                <div className='flex items-center gap-4 mb-4'>
                    <h2 className="text-xl font-semibold">{selectedClass} Class</h2>
                    <Badge variant="secondary">{studentsInClass.length} Students</Badge>
                </div>
                 <div className="border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[80px]">Photo</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentsInClass.map((student) => (
                        <TableRow key={student.id}>
                            <TableCell>
                            <Image
                                alt="Student image"
                                className="aspect-square rounded-md object-cover"
                                height="40"
                                src={student.photoUrl}
                                width="40"
                                data-ai-hint="student photo"
                            />
                            </TableCell>
                            <TableCell className="font-medium">{student.id}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>
                            <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{student.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Link href={`/students/details/${student.id}`} className="text-primary hover:underline text-sm font-medium">
                                    View Details
                                </Link>
                            </TableCell>
                        </TableRow>
                        ))}
                         {studentsInClass.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No students found in this class.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
             </>
          )}

           {!selectedClass && (
             <div className="text-center text-muted-foreground py-10">
                Please select a class to view student details.
            </div>
           )}

        </CardContent>
      </Card>
    </div>
  );
}
