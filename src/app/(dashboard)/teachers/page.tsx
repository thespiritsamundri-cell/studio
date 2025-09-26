
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Edit, Phone, GraduationCap, UserCheck, UserX, QrCode } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { generateQrCode } from '@/ai/flows/generate-qr-code';


export default function TeachersPage() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, classes } = useData();
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string>('');
  
  const allSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    classes.forEach(c => c.subjects.forEach(s => subjectSet.add(s)));
    return Array.from(subjectSet).sort();
  }, [classes]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOrEditTeacher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const teacherId = isEditing && selectedTeacher ? selectedTeacher.id : `T${(teachers.reduce((maxId, teacher) => Math.max(maxId, parseInt(teacher.id.replace('T', ''))), 0) + 1).toString().padStart(2, '0')}`;
    
    const teacherData: Omit<Teacher, 'id'> = {
      name: formData.get('name') as string,
      fatherName: formData.get('fatherName') as string,
      phone: formData.get('phone') as string,
      education: formData.get('education') as string,
      salary: Number(formData.get('salary') as string),
      photoUrl: photoPreview || selectedTeacher?.photoUrl || `https://picsum.photos/seed/${teacherId}/200`,
      assignedSubjects: assignedSubjects,
      status: status
    };

    if(!teacherData.name || !teacherData.phone || !teacherData.education || !teacherData.salary) {
        toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive"});
        return;
    }

    if (isEditing && selectedTeacher) {
      updateTeacher(selectedTeacher.id, { ...selectedTeacher, ...teacherData });
      toast({ title: "Teacher Updated", description: `${teacherData.name}'s record has been successfully updated.` });
    } else {
      addTeacher({ id: teacherId, ...teacherData });
      toast({ title: "Teacher Added", description: `${teacherData.name} has been successfully added.` });
    }

    setOpenDialog(false);
  };
  
  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setPhotoPreview(teacher.photoUrl);
    setAssignedSubjects(teacher.assignedSubjects || []);
    setStatus(teacher.status || 'Active');
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

  const handleDialogClose = (isOpen: boolean) => {
      if (!isOpen) {
        setIsEditing(false);
        setSelectedTeacher(null);
        setPhotoPreview(null);
        setAssignedSubjects([]);
        setStatus('Active');
      }
      setOpenDialog(isOpen);
  }
  
  const handleSubjectToggle = (subject: string) => {
    setAssignedSubjects(prev => 
        prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  }

  const handleGenerateQr = async (teacher: Teacher) => {
    try {
        const content = `${window.location.origin}/profile/teacher/${teacher.id}`;
        const result = await generateQrCode({ content });
        setQrCodeDataUri(result.qrCodeDataUri);
        setSelectedTeacher(teacher);
        setOpenQrDialog(true);
    } catch(e) {
        console.error(e);
        toast({ title: 'QR Generation Failed', variant: 'destructive'});
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Manage Teachers</h1>
        <Dialog open={openDialog} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" /> Add New Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl grid-rows-[auto,1fr,auto]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the teacher's details." : "Enter the details for the new teacher."}
              </DialogDescription>
            </DialogHeader>
            <form id="teacher-form" onSubmit={handleAddOrEditTeacher} className="grid md:grid-cols-2 gap-6 overflow-y-auto pr-4">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" defaultValue={selectedTeacher?.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input id="fatherName" name="fatherName" defaultValue={selectedTeacher?.fatherName} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" defaultValue={selectedTeacher?.phone} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Input id="education" name="education" defaultValue={selectedTeacher?.education} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary (PKR)</Label>
                    <Input id="salary" name="salary" type="number" defaultValue={selectedTeacher?.salary} required />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as 'Active' | 'Inactive')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo</Label>
                    <Input id="photo" name="photo" type="file" onChange={handlePhotoChange} accept="image/*" />
                  </div>
                  {photoPreview && (
                      <div className="space-y-2">
                          <Label>Preview</Label>
                          <Image src={photoPreview} alt="New photo preview" width={80} height={80} className="rounded-full aspect-square object-cover" />
                      </div>
                  )}
               </div>
               <div className="space-y-2">
                   <Label>Assign Subjects</Label>
                   <ScrollArea className="h-96 w-full rounded-md border p-4">
                        <div className="grid grid-cols-2 gap-2">
                        {allSubjects.map(subject => (
                            <div key={subject} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`subject-${subject}`} 
                                    checked={assignedSubjects.includes(subject)}
                                    onCheckedChange={() => handleSubjectToggle(subject)}
                                />
                                <label htmlFor={`subject-${subject}`} className="text-sm font-medium leading-none">
                                    {subject}
                                </label>
                            </div>
                        ))}
                        </div>
                   </ScrollArea>
               </div>
            </form>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)}>Cancel</Button>
              <Button type="submit" form="teacher-form">{isEditing ? 'Save Changes' : 'Add Teacher'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teachers.map(teacher => (
          <Card key={teacher.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="p-0 relative">
               <div className="aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={teacher.photoUrl || `https://picsum.photos/seed/${teacher.id}/400/300`}
                  alt={teacher.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                  data-ai-hint="teacher photo"
                />
               </div>
                <Badge className={cn("absolute top-2 right-2", teacher.status === 'Active' ? "bg-green-600" : "bg-destructive")}>
                  {teacher.status === 'Active' ? <UserCheck className="w-3 h-3 mr-1"/> : <UserX className="w-3 h-3 mr-1"/>}
                  {teacher.status}
                </Badge>
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-3">
                <div>
                    <h3 className="text-lg font-bold">{teacher.name}</h3>
                    <p className="text-sm text-muted-foreground">{teacher.id}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <span>{teacher.education}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{teacher.phone}</span>
                </div>
                <Badge variant="secondary" className="w-full justify-center text-base py-1">PKR {teacher.salary.toLocaleString()}</Badge>
            </CardContent>
            <CardFooter className="p-2 bg-muted/50 grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditClick(teacher)}><Edit className="mr-2 h-4 w-4" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerateQr(teacher)}><QrCode className="mr-2 h-4 w-4" />QR</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(teacher)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
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
      
      {/* QR Code Dialog */}
       <Dialog open={openQrDialog} onOpenChange={setOpenQrDialog}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">Profile QR Code for {selectedTeacher?.name}</DialogTitle>
              <DialogDescription className="text-center">
                Scan this code to view the public profile for this teacher.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {qrCodeDataUri ? <Image src={qrCodeDataUri} alt="Teacher QR Code" width={200} height={200} /> : <p>Generating...</p>}
            </div>
          </DialogContent>
        </Dialog>

    </div>
  );
}
