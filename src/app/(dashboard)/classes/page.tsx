
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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


export default function ClassesPage() {
  const { students: allStudents, classes, addClass, updateClass, deleteClass } = useData();
  const { toast } = useToast();

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
                        {classes.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
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
