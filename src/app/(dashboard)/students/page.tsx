
'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { MoreHorizontal, Search, Printer, FileSpreadsheet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
import { renderToString } from 'react-dom/server';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import type { Student } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';


export default function StudentsPage() {
  const { students: allStudents, classes } = useData();
  const { settings } = useSettings();
  const searchParams = useSearchParams();
  const familyIdFromQuery = searchParams.get('familyId');
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const filteredStudents = useMemo(() => {
    let students = allStudents;

    if (familyIdFromQuery) {
      students = students.filter((student) => student.familyId === familyIdFromQuery);
    }
    
    if (selectedClass !== 'all') {
      students = students.filter((student) => student.class === selectedClass);
    }

    if (searchQuery) {
       students = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.familyId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return students;
  }, [searchQuery, selectedClass, allStudents, familyIdFromQuery]);

  const studentsToExport = useMemo(() => {
    return allStudents.filter(s => selectedStudents.includes(s.id));
  }, [selectedStudents, allStudents]);

  const handlePrint = () => {
    if (studentsToExport.length === 0) {
      toast({ title: "No students selected", description: "Please select students to print.", variant: "destructive" });
      return;
    }
    const reportDate = new Date();
    const printContent = renderToString(
        <AllStudentsPrintReport students={studentsToExport} date={reportDate} settings={settings} />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Selected Students Report</title>
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


  const handleExportCsv = () => {
    if (studentsToExport.length === 0) {
      toast({ title: "No students selected", description: "Please select students to export.", variant: "destructive" });
      return;
    }
    const headers = ['ID', 'Name', 'FatherName', 'Class', 'Section', 'AdmissionDate', 'FamilyId', 'Status', 'Phone', 'Address', 'DOB'];
    const csvContent = [
      headers.join(','),
      ...studentsToExport.map((student: Student) => 
        [
          student.id,
          `"${student.name}"`,
          `"${student.fatherName}"`,
          student.class,
          student.section || '',
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };
  
  const isAllSelected = selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length;


  return (
    <div className="space-y-6">
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
          <Select value={selectedClass} onValueChange={(value) => {setSelectedClass(value); setSelectedStudents([]);}}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint} disabled={studentsToExport.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Print Selected
          </Button>
          <Button variant="outline" onClick={handleExportCsv} disabled={studentsToExport.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Selected
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {familyIdFromQuery 
                    ? `Students for Family ID: ${familyIdFromQuery}`
                    : "All Students"
                }
              </CardTitle>
              <CardDescription>Manage student records, view details, and perform actions. Found {filteredStudents.length} students.</CardDescription>
            </div>
             <Badge variant="secondary">{selectedStudents.length} Selected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-[50px]">
                    <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all"
                    />
                </TableHead>
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
                <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                  <TableCell>
                    <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                        aria-label={`Select student ${student.name}`}
                    />
                  </TableCell>
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
                  <TableCell>{student.class} {student.section ? `(${student.section})` : ''}</TableCell>
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
               {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
