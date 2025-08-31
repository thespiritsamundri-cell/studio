
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { MoreHorizontal, Search, Printer, FileDown, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useReactToPrint } from 'react-to-print';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import type { Student } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function StudentsPage() {
  const { students: allStudents } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reportDate, setReportDate] = useState<Date | null>(null);

  const classes = useMemo(() => ['all', ...Array.from(new Set(allStudents.map(s => s.class)))], [allStudents]);

  const filteredStudents = useMemo(() => {
    let students = allStudents;
    
    if (selectedClass !== 'all') {
      students = students.filter((student) => student.class === selectedClass);
    }

    if (searchQuery) {
       students = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fatherName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return students;
  }, [searchQuery, selectedClass, allStudents]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setIsPrinting(false),
  });

  useEffect(() => {
    if (isPrinting && reportDate && printRef.current) {
      handlePrint();
    }
  }, [isPrinting, reportDate, handlePrint]);

  const triggerPrint = () => {
    setReportDate(new Date());
    setIsPrinting(true);
  };


  const handleExportCsv = () => {
    const headers = ['ID', 'Name', 'FatherName', 'Class', 'AdmissionDate', 'FamilyId', 'Status', 'Phone', 'Address', 'DOB'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map((student: Student) => 
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
    link.setAttribute('download', 'students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div style={{ display: 'none' }}>
        {isPrinting && reportDate && (
            <div ref={printRef}>
            <AllStudentsPrintReport students={filteredStudents} date={reportDate} />
            </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Students</h1>
        <div className="flex flex-wrap items-center gap-2">
           <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search students..."
                className="pl-8 w-full md:w-[200px] lg:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.filter(c => c !== 'all').sort().map(c => (
                    <SelectItem key={c} value={c}>{c} Class</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={triggerPrint}>
            <Printer className="mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={triggerPrint}>
            <FileDown className="mr-2" /> PDF Export
          </Button>
          <Button variant="outline" onClick={handleExportCsv}>
            <FileSpreadsheet className="mr-2" /> Excel Export
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>Manage student records, view details, and perform actions. Found {filteredStudents.length} students.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Admission Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Student image"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={student.photoUrl}
                      width="64"
                      data-ai-hint="student photo"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{student.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{student.admissionDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/students/edit/${student.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/students/details/${student.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
