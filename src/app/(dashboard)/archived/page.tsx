
'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { RotateCcw, Trash2, Eye, Users, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import type { Student, Family } from '@/lib/types';
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
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';


export default function ArchivedPage() {
  const { students: allStudents, families: allFamilies, updateStudent, updateFamily, deleteFamily } = useData();
  const router = useRouter();
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [searchFamilyQuery, setSearchFamilyQuery] = useState('');
  const [studentToRestore, setStudentToRestore] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [familyToRestore, setFamilyToRestore] = useState<Family | null>(null);
  const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);
  const { toast } = useToast();
  
  const archivedStudents = useMemo(() => {
    let students = allStudents.filter(s => s.status === 'Archived');
    if (searchStudentQuery) {
       students = students.filter((student) =>
        student.name.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchStudentQuery.toLowerCase())
      );
    }
    return students;
  }, [searchStudentQuery, allStudents]);
  
  const archivedFamilies = useMemo(() => {
     let families = allFamilies.filter(f => f.status === 'Archived');
     if (searchFamilyQuery) {
        families = families.filter(f => 
            f.fatherName.toLowerCase().includes(searchFamilyQuery.toLowerCase()) ||
            f.id.toLowerCase().includes(searchFamilyQuery.toLowerCase())
        );
     }
     return families;
  }, [searchFamilyQuery, allFamilies]);


  // Student Actions
  const handleRestoreStudent = (student: Student) => {
    updateStudent(student.id, { status: 'Active' });
    toast({ title: "Student Restored", description: `${student.name} has been restored to active status.` });
  };
  
  const handleConfirmPermanentDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
        await deleteDoc(doc(db, 'students', studentToDelete.id));
        toast({ title: "Student Permanently Deleted", variant: "destructive" });
    } catch (e) {
        toast({ title: "Error", description: "Failed to permanently delete student.", variant: "destructive"});
        console.error(e);
    } finally {
        setStudentToDelete(null);
    }
  };
  
  // Family Actions
  const handleRestoreFamily = async (family: Family) => {
    await updateFamily(family.id, { status: 'Active' });
    const studentsInFamily = allStudents.filter(s => s.familyId === family.id);
    for (const student of studentsInFamily) {
        await updateStudent(student.id, { status: 'Active' });
    }
    toast({ title: "Family Restored", description: `Family of ${family.fatherName} and all their students have been restored.` });
    setFamilyToRestore(null);
  }
  
  const handleConfirmPermanentDeleteFamily = async () => {
      if (!familyToDelete) return;
      await deleteFamily(familyToDelete.id); // This function in context already handles deleting students.
      toast({ title: "Family Permanently Deleted", description: `Family of ${familyToDelete.fatherName} has been deleted.`, variant: "destructive" });
      setFamilyToDelete(null);
  }

  const handleViewStudents = (familyId: string) => {
    router.push(`/students?familyId=${familyId}`);
  };

  const getStudentCountForFamily = (familyId: string) => {
    return allStudents.filter(student => student.familyId === familyId).length;
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Archived Records</h1>
      
       <Tabs defaultValue="students">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Archived Students</TabsTrigger>
                <TabsTrigger value="families">Archived Families</TabsTrigger>
            </TabsList>
            <TabsContent value="students">
                 <Card>
                    <CardHeader>
                        <CardTitle>Archived Student Records</CardTitle>
                        <CardDescription>Individually archived students. You can restore them or delete them permanently.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2 mb-4">
                            <Input placeholder="Search students by name or ID..." className="max-w-sm" value={searchStudentQuery} onChange={(e) => setSearchStudentQuery(e.target.value)} />
                            <Button><Search className="h-4 w-4 mr-2" />Search</Button>
                        </div>
                        <Table>
                            <TableHeader><TableRow><TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead><TableHead>Name</TableHead><TableHead>Class</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {archivedStudents.map((student) => (
                                <TableRow key={student.id}>
                                <TableCell className="hidden sm:table-cell"><Image alt="Student image" className="aspect-square rounded-md object-cover" height="64" src={student.photoUrl || `https://picsum.photos/seed/${student.id}/64/64`} width="64" data-ai-hint="student photo" /></TableCell>
                                <TableCell className="font-medium">{student.name} (ID: {student.id})</TableCell>
                                <TableCell>{student.class} {student.section ? `(${student.section})` : ''}</TableCell>
                                <TableCell>
                                    <Button asChild variant="ghost" size="sm"><Link href={`/students/details/${student.id}`}><Eye className="mr-2 h-4 w-4"/> View</Link></Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleRestoreStudent(student)}><RotateCcw className="mr-2 h-4 w-4"/> Restore</Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setStudentToDelete(student)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            {archivedStudents.length === 0 && (<TableRow><TableCell colSpan={4} className="h-24 text-center">No archived students found.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="families">
                <Card>
                    <CardHeader>
                        <CardTitle>Archived Family Records</CardTitle>
                        <CardDescription>These families (and their students) have been archived. Restore them to make them active again, or delete them permanently.</CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="flex items-center space-x-2 mb-4">
                            <Input placeholder="Search families by name or ID..." className="max-w-sm" value={searchFamilyQuery} onChange={(e) => setSearchFamilyQuery(e.target.value)} />
                             <Button><Search className="h-4 w-4 mr-2" />Search</Button>
                        </div>
                        <Table>
                             <TableHeader><TableRow><TableHead>Family ID</TableHead><TableHead>Father's Name</TableHead><TableHead>Phone</TableHead><TableHead>Students</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {archivedFamilies.map((family) => (
                                <TableRow key={family.id}>
                                    <TableCell className="font-medium">{family.id}</TableCell>
                                    <TableCell>{family.fatherName}</TableCell>
                                    <TableCell>{family.phone}</TableCell>
                                    <TableCell>{getStudentCountForFamily(family.id)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => handleViewStudents(family.id)}><Users className="mr-2 h-4 w-4"/> View Students</Button>
                                        <Button variant="ghost" size="sm" onClick={() => setFamilyToRestore(family)}><RotateCcw className="mr-2 h-4 w-4"/> Restore</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setFamilyToDelete(family)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {archivedFamilies.length === 0 && (<TableRow><TableCell colSpan={5} className="h-24 text-center">No archived families found.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
      </Tabs>
      
        <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete Student Permanently?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete the record for <strong>{studentToDelete?.name}</strong>.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmPermanentDeleteStudent} className="bg-destructive hover:bg-destructive/90">Yes, delete permanently</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>
      
       <AlertDialog open={!!familyToRestore} onOpenChange={(open) => !open && setFamilyToRestore(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Restore Family?</AlertDialogTitle>
                    <AlertDialogDescription>This will restore the family of <strong>{familyToRestore?.fatherName}</strong> and all their associated students to "Active" status.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => familyToRestore && handleRestoreFamily(familyToRestore)}>Yes, Restore</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!familyToDelete} onOpenChange={(open) => !open && setFamilyToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Family Permanently?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the family of <strong>{familyToDelete?.fatherName}</strong> and all their students' records.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmPermanentDeleteFamily} className="bg-destructive hover:bg-destructive/90">Yes, delete permanently</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    