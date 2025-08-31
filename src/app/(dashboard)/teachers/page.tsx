
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Phone, GraduationCap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import type { Teacher } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function TeachersPage() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useData();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleAddOrEditTeacher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const teacherData = {
      name: formData.get('name') as string,
      fatherName: formData.get('fatherName') as string,
      phone: formData.get('phone') as string,
      education: formData.get('education') as string,
      salary: Number(formData.get('salary') as string),
      photoUrl: formData.get('photoUrl') as string,
    };

    if(!teacherData.name || !teacherData.phone || !teacherData.education || !teacherData.salary) {
        toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive"});
        return;
    }

    if (isEditing && selectedTeacher) {
      updateTeacher(selectedTeacher.id, { ...selectedTeacher, ...teacherData });
      toast({ title: "Teacher Updated", description: `${teacherData.name}'s record has been successfully updated.` });
    } else {
      const lastIdNumber = teachers.reduce((maxId, teacher) => Math.max(maxId, parseInt(teacher.id.replace('T', ''))), 0);
      const newId = `T${(lastIdNumber + 1).toString().padStart(2, '0')}`;
      addTeacher({ id: newId, ...teacherData, photoUrl: teacherData.photoUrl || `https://picsum.photos/seed/${newId}/200` });
      toast({ title: "Teacher Added", description: `${teacherData.name} has been successfully added.` });
    }

    setOpenDialog(false);
    setIsEditing(false);
    setSelectedTeacher(null);
    e.currentTarget.reset();
  };
  
  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedTeacher) return;
    deleteTeacher(selectedTeacher.id);
    toast({ title: "Teacher Deleted", description: `Record for ${selectedTeacher.name} has been deleted.`, variant: "destructive" });
    setOpenDeleteDialog(false);
    setSelectedTeacher(null);
  };

  const handleOpenDialog = (editing: boolean, teacher: Teacher | null = null) => {
      setIsEditing(editing);
      setSelectedTeacher(teacher);
      setOpenDialog(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Teachers</h1>
        <Dialog open={openDialog} onOpenChange={(isOpen) => { if (!isOpen) { setIsEditing(false); setSelectedTeacher(null); } setOpenDialog(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog(false)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add New Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the teacher's details." : "Enter the details for the new teacher."}
              </DialogDescription>
            </DialogHeader>
            <form id="teacher-form" onSubmit={handleAddOrEditTeacher}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" className="col-span-3" defaultValue={selectedTeacher?.name} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fatherName" className="text-right">Father's Name</Label>
                  <Input id="fatherName" name="fatherName" className="col-span-3" defaultValue={selectedTeacher?.fatherName} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" name="phone" type="tel" className="col-span-3" defaultValue={selectedTeacher?.phone} required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="education" className="text-right">Education</Label>
                  <Input id="education" name="education" className="col-span-3" defaultValue={selectedTeacher?.education} required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="photoUrl" className="text-right">Photo URL</Label>
                    <Input id="photoUrl" name="photoUrl" className="col-span-3" defaultValue={selectedTeacher?.photoUrl} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary" className="text-right">Salary (PKR)</Label>
                  <Input id="salary" name="salary" type="number" className="col-span-3" defaultValue={selectedTeacher?.salary} required />
                </div>
              </div>
               <DialogFooter>
                <Button type="submit" form="teacher-form">{isEditing ? 'Save Changes' : 'Add Teacher'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teachers.map(teacher => (
          <Card key={teacher.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
               <Image
                  src={teacher.photoUrl}
                  alt={teacher.name}
                  width={80}
                  height={80}
                  className="rounded-full aspect-square object-cover"
                  data-ai-hint="teacher photo"
                />
                <div className="flex-1">
                    <CardTitle>{teacher.name}</CardTitle>
                    <CardDescription>{teacher.id}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(teacher)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(teacher)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{teacher.education}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{teacher.phone}</span>
                </div>
            </CardContent>
            <CardFooter>
                <Badge variant="secondary" className="w-full justify-center">Salary: PKR {teacher.salary.toLocaleString()}</Badge>
            </CardFooter>
          </Card>
        ))}

         {teachers.length === 0 && (
            <Card className="col-span-full flex items-center justify-center h-64">
                <CardContent>
                    <p className="text-muted-foreground">No teachers found. Add one to get started.</p>
                </CardContent>
            </Card>
        )}
      </div>

      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the record for <strong>{selectedTeacher?.name}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTeacher(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Yes, delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
