

'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { MoreHorizontal, Search, RotateCcw, Trash2, Eye } from 'lucide-react';
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
import type { Student } from '@/lib/types';
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
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';


export default function ArchivedPage() {
  const { students: allStudents, updateStudent } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const { toast } = useToast();
  
  const archivedStudents = useMemo(() => {
    let students = allStudents.filter(s => s.status === 'Archived');

    if (searchQuery) {
       students = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.familyId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return students;
  }, [searchQuery, allStudents]);


  const handleRestoreStudent = (student: Student) => {
    updateStudent(student.id, { status: 'Active' });
    toast({
        title: "Student Restored",
        description: `${student.name} has been restored to active status.`
    });
  };
  
  const handleConfirmPermanentDelete = async () => {
    if (!studentToDelete) return;
    try {
        await deleteDoc(doc(db, 'students', studentToDelete.id));
        
        toast({
            title: "Student Permanently Deleted",
            description: `${studentToDelete.name}'s record has been permanently deleted from the database.`,
            variant: "destructive"
        });
    } catch (e) {
        toast({ title: "Error", description: "Failed to permanently delete student.", variant: "destructive"});
        console.error(e);
    } finally {
        setStudentToDelete(null);
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Archived Students</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Archived Student Records</CardTitle>
          <CardDescription>
            These students have been archived. You can restore them or delete them permanently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input 
              type="text" 
              placeholder="Search archived students..." 
              className="max-w-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="hidden md:table-cell">Archived On</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Student image"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={student.photoUrl || `https://picsum.photos/seed/${student.id}/64/64`}
                      width="64"
                      data-ai-hint="student photo"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name} (ID: {student.id})</TableCell>
                  <TableCell>{student.class} {student.section ? `(${student.section})` : ''}</TableCell>
                  <TableCell className="hidden md:table-cell">{student.admissionDate}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/students/details/${student.id}`}><Eye className="mr-2 h-4 w-4"/> View Profile</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRestoreStudent(student)}>
                        <RotateCcw className="mr-2 h-4 w-4"/> Restore
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setStudentToDelete(student)}>
                        <Trash2 className="mr-2 h-4 w-4"/> Delete Permanently
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {archivedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No archived students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
        <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will <strong className="text-red-600">permanently delete</strong> the record for <strong>{studentToDelete?.name}</strong> and all associated data.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmPermanentDelete} className="bg-destructive hover:bg-destructive/90">
                Yes, delete permanently
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

