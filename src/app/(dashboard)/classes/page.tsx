
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/context/data-context';
import type { Student, Class } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer, FileSpreadsheet, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import { renderToString } from 'react-dom/server';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/context/settings-context';


export default function ClassesPage() {
  const { students: allStudents, classes, addClass, updateClass, deleteClass } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const studentsInClass = useMemo(() => {
    if (!selectedClass) {
      return [];
    }
    return allStudents.filter(student => student.class === selectedClass);
  }, [selectedClass, allStudents]);
  
  const studentsToExport = useMemo(() => {
    return allStudents.filter(s => selectedStudents.includes(s.id));
  }, [selectedStudents, allStudents]);

  const triggerPrint = () => {
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
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(studentsInClass.map(s => s.id));
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
  
  const isAllSelected = selectedStudents.length > 0 && selectedStudents.length === studentsInClass.length;
  
  const handleExportCsv = () => {
    if (studentsToExport.length === 0) return;
    const headers = ['ID', 'Name', 'FatherName', 'Class', 'AdmissionDate', 'FamilyId', 'Status', 'Phone', 'Address', 'DOB'];
    const csvContent = [
      headers.join(','),
      ...studentsToExport.map((student: Student) => 
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
    link.setAttribute('download', `${selectedClass}-students-selection.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Class management handlers
  const handleOpenClassDialog = (classData: Class | null) => {
    if (classData) {
      setIsEditingClass(true);
      setSelectedClassData(classData);
      setNewClassName(classData.name);
    } else {
      setIsEditingClass(false);
      setSelectedClassData(null);
      setNewClassName('');
    }
    setOpenClassDialog(true);
  };

  const handleSaveClass = () => {
    if (!newClassName.trim()) {
      toast({ title: "Class name cannot be empty", variant: "destructive" });
      return;
    }

    if (isEditingClass && selectedClassData) {
      updateClass(selectedClassData.id, { ...selectedClassData, name: newClassName });
      toast({ title: "Class Updated", description: `Class "${selectedClassData.name}" has been updated to "${newClassName}".` });
    } else {
      const newClass: Class = {
        id: `C${Date.now()}`,
        name: newClassName,
      };
      addClass(newClass);
      toast({ title: "Class Added", description: `Class "${newClassName}" has been successfully created.` });
    }
    setOpenClassDialog(false);
  };

  const handleOpenDeleteDialog = (classData: Class) => {
    setSelectedClassData(classData);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedClassData) {
      // Optional: Check if class is in use by any student
      const isClassInUse = allStudents.some(s => s.class === selectedClassData.name);
      if (isClassInUse) {
        toast({
          title: "Cannot Delete Class",
          description: `Class "${selectedClassData.name}" is currently assigned to one or more students.`,
          variant: "destructive",
        });
      } else {
        deleteClass(selectedClassData.id);
        toast({ title: "Class Deleted", description: `Class "${selectedClassData.name}" has been deleted.` });
      }
      setOpenDeleteDialog(false);
      setSelectedClassData(null);
    }
  };

  // State for class management dialog
  const [openClassDialog, setOpenClassDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold font-headline">Classes</h1>
        
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Classes</CardTitle>
                    <CardDescription>Add, edit, or delete class sections for your school.</CardDescription>
                </div>
                <Button onClick={() => handleOpenClassDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add New Class
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Class Name</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{allStudents.filter(s => s.class === c.name).length}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenClassDialog(c)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(c)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Class Roster</CardTitle>
                    <CardDescription>Select a class to view and manage its students.</CardDescription>
                </div>
                 {selectedClass && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={triggerPrint} disabled={studentsToExport.length === 0}>
                            <Printer className="mr-2 h-4 w-4" /> Print Selected
                        </Button>
                        <Button variant="outline" onClick={handleExportCsv} disabled={studentsToExport.length === 0}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel Export
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
            <div className="w-full max-w-sm mb-6">
                <Select onValueChange={(value) => { setSelectedClass(value); setSelectedStudents([]); }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            {selectedClass && (
                <>
                    <div className='flex items-center gap-4 mb-4'>
                        <h2 className="text-xl font-semibold">{selectedClass}</h2>
                        <Badge variant="secondary">{studentsInClass.length} Students</Badge>
                        <Badge variant="default">{selectedStudents.length} Selected</Badge>
                    </div>
                    <div className="border rounded-lg">
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
                            <TableHead className="w-[80px]">Photo</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentsInClass.map((student) => (
                            <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedStudents.includes(student.id)}
                                        onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                                        aria-label={`Select student ${student.name}`}
                                    />
                                </TableCell>
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
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
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

       {/* Class Dialog */}
      <Dialog open={openClassDialog} onOpenChange={setOpenClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>
              {isEditingClass ? `Enter the new name for the class "${selectedClassData?.name}".` : 'Enter the name for the new class.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="class-name">Class Name</Label>
            <Input id="class-name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenClassDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveClass}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting the class "{selectedClassData?.name}" is only possible if no students are currently enrolled in it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete class
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
