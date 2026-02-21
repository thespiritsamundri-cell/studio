
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import type { Class, Student } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, X, GraduationCap, ArrowRight, BookCopy } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function ClassesPage() {
  const { students: allStudents, classes, addClass, updateClass, deleteClass, updateStudent } = useData();
  const { toast } = useToast();

  // State for class management dialog
  const [openClassDialog, setOpenClassDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [sections, setSections] = useState<string[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // State for promotion dialog
  const [openPromotionDialog, setOpenPromotionDialog] = useState(false);
  const [fromClass, setFromClass] = useState<string>('');
  const [toClass, setToClass] = useState<string>('');
  const [studentsToPromote, setStudentsToPromote] = useState<Student[]>([]);
  const [selectedStudentsForPromotion, setSelectedStudentsForPromotion] = useState<string[]>([]);


  // Class management handlers
  const handleOpenClassDialog = (classData: Class | null) => {
    if (classData) {
      setIsEditingClass(true);
      setSelectedClassData(classData);
      setNewClassName(classData.name);
      setSections(classData.sections || []);
      setSubjects(classData.subjects || []);
    } else {
      setIsEditingClass(false);
      setSelectedClassData(null);
      setNewClassName('');
      setSections([]);
      setSubjects([]);
    }
    setOpenClassDialog(true);
  };
  
  const handleAddSection = () => {
    if (newSectionName.trim() && !sections.includes(newSectionName.trim())) {
      setSections([...sections, newSectionName.trim()]);
      setNewSectionName('');
    }
  };

  const handleRemoveSection = (sectionToRemove: string) => {
    setSections(sections.filter(s => s !== sectionToRemove));
  };
  
  const handleAddSubject = () => {
    if (newSubjectName.trim() && !subjects.includes(newSubjectName.trim())) {
      setSubjects([...subjects, newSubjectName.trim()]);
      setNewSubjectName('');
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setSubjects(subjects.filter(s => s !== subjectToRemove));
  };


  const handleSaveClass = () => {
    if (!newClassName.trim()) {
      toast({ title: "Class name cannot be empty", variant: "destructive" });
      return;
    }

    if (isEditingClass && selectedClassData) {
      updateClass(selectedClassData.id, { ...selectedClassData, name: newClassName, sections, subjects });
      toast({ title: "Class Updated", description: `Class "${selectedClassData.name}" has been updated.` });
    } else {
      const newClass: Class = {
        id: `C${Date.now()}`,
        name: newClassName,
        sections,
        subjects,
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
  
  const handleFromClassChange = (className: string) => {
    setFromClass(className);
    const studentsInClass = allStudents.filter(s => s.class === className && s.status === 'Active');
    setStudentsToPromote(studentsInClass);
    setSelectedStudentsForPromotion(studentsInClass.map(s => s.id)); // Select all by default
  };
  
  const handleStudentSelectionChange = (studentId: string, checked: boolean) => {
      setSelectedStudentsForPromotion(prev => 
        checked ? [...prev, studentId] : prev.filter(id => id !== studentId)
      );
  };

  const handleSelectAllForPromotion = (checked: boolean) => {
      setSelectedStudentsForPromotion(checked ? studentsToPromote.map(s => s.id) : []);
  };
  
  const handlePromoteStudents = async () => {
    if (!fromClass || !toClass || selectedStudentsForPromotion.length === 0) {
      toast({ title: 'Promotion Failed', description: 'Please select from/to classes and at least one student.', variant: 'destructive' });
      return;
    }
    
    if (fromClass === toClass) {
      toast({ title: 'Invalid Selection', description: 'Cannot promote students to the same class.', variant: 'destructive' });
      return;
    }

    try {
        await Promise.all(selectedStudentsForPromotion.map(studentId => {
            return updateStudent(studentId, { class: toClass, section: '' }); // Reset section on promotion
        }));
        
        toast({ title: 'Promotion Successful', description: `${selectedStudentsForPromotion.length} students have been promoted from ${fromClass} to ${toClass}.` });
        
        // Reset dialog state
        setFromClass('');
        setToClass('');
        setStudentsToPromote([]);
        setSelectedStudentsForPromotion([]);
        setOpenPromotionDialog(false);

    } catch (error) {
        toast({ title: 'An Error Occurred', description: 'Could not promote students. Please try again.', variant: 'destructive' });
        console.error("Promotion error:", error);
    }
  };


  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><BookCopy/> Classes Management</h1>
        
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Classes</CardTitle>
                    <CardDescription>Add, edit, or delete classes, sections and subjects for your school.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setOpenPromotionDialog(true)}>
                        <GraduationCap className="mr-2 h-4 w-4"/> Promote Students
                    </Button>
                    <Button onClick={() => handleOpenClassDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Add New Class
                    </Button>
                 </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Class Name</TableHead>
                            <TableHead>Sections</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Students</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {(c.sections && c.sections.length > 0) ? c.sections.map(s => <Badge key={s} variant="secondary">{s}</Badge>) : 'No Sections'}
                                    </div>
                                </TableCell>
                                 <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {(c.subjects && c.subjects.length > 0) ? c.subjects.map(s => <Badge key={s} variant="outline">{s}</Badge>) : 'No Subjects'}
                                    </div>
                                </TableCell>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
            <DialogDescription>
              {isEditingClass ? `Update the details for the class "${selectedClassData?.name}".` : 'Enter the details for the new class.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="class-name">Class Name</Label>
                <Input id="class-name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Sections</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g., A" 
                            value={newSectionName} 
                            onChange={(e) => setNewSectionName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection(); } }}
                        />
                        <Button type="button" onClick={handleAddSection}>Add</Button>
                    </div>
                     <ScrollArea className="h-32 mt-2">
                        <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[4rem]">
                            {sections.map(s => (
                                <Badge key={s} variant="secondary" className="flex items-center gap-1">
                                    {s}
                                    <button onClick={() => handleRemoveSection(s)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                 <div className="space-y-2">
                    <Label>Subjects</Label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g., English" 
                            value={newSubjectName} 
                            onChange={(e) => setNewSubjectName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); } }}
                        />
                        <Button type="button" onClick={handleAddSubject}>Add</Button>
                    </div>
                    <ScrollArea className="h-32 mt-2">
                        <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[4rem]">
                            {subjects.map(s => (
                                <Badge key={s} variant="outline" className="flex items-center gap-1">
                                    {s}
                                    <button onClick={() => handleRemoveSubject(s)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
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
      
      {/* Student Promotion Dialog */}
      <Dialog open={openPromotionDialog} onOpenChange={setOpenPromotionDialog}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Promote Students to Next Class</DialogTitle>
            <DialogDescription>
              Select the source and destination classes, then choose which students to promote.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
              <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                      <Label htmlFor="from-class">Promote From</Label>
                       <Select onValueChange={handleFromClassChange} value={fromClass}>
                            <SelectTrigger id="from-class">
                                <SelectValue placeholder="Select source class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                  </div>
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                      <Label htmlFor="to-class">Promote To</Label>
                       <Select value={toClass} onValueChange={setToClass}>
                            <SelectTrigger id="to-class">
                                <SelectValue placeholder="Select destination class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                  </div>
              </div>
              
              <div>
                  <div className="flex justify-between items-center mb-2">
                     <Label>Students in <span className="font-bold">{fromClass || "..."}</span></Label>
                     <p className="text-sm text-muted-foreground">{selectedStudentsForPromotion.length} of {studentsToPromote.length} students selected.</p>
                  </div>
                  <ScrollArea className="h-72 border rounded-md">
                      {fromClass ? (
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead className="w-12"><Checkbox onCheckedChange={(checked) => handleSelectAllForPromotion(!!checked)} checked={studentsToPromote.length > 0 && selectedStudentsForPromotion.length === studentsToPromote.length}/></TableHead>
                                      <TableHead>Student Name</TableHead>
                                      <TableHead>Student ID</TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {studentsToPromote.map(student => (
                                     <TableRow key={student.id} data-state={selectedStudentsForPromotion.includes(student.id) && "selected"}>
                                         <TableCell><Checkbox onCheckedChange={(checked) => handleStudentSelectionChange(student.id, !!checked)} checked={selectedStudentsForPromotion.includes(student.id)}/></TableCell>
                                         <TableCell>{student.name}</TableCell>
                                         <TableCell>{student.id}</TableCell>
                                     </TableRow>
                                 ))}
                                  {studentsToPromote.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No active students in this class.</TableCell>
                                     </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">Select a class to see students.</div>
                      )}
                  </ScrollArea>
              </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenPromotionDialog(false)}>Cancel</Button>
            <Button onClick={handlePromoteStudents} disabled={!fromClass || !toClass || selectedStudentsForPromotion.length === 0}>Promote {selectedStudentsForPromotion.length} Students</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    