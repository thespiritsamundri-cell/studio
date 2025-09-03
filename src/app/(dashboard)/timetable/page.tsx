
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, CalendarClock, User, BookOpen, Save, Users, PlusCircle, Trash2, X } from 'lucide-react';
import type { Timetable, TimetableData, TimetableCell } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { TimetablePrint } from '@/components/reports/timetable-print';
import { TeacherSchedulePrint } from '@/components/reports/teacher-schedule-print';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const NUM_PERIODS = 8;
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { classes, timetables, updateTimetable, teachers, updateClass } = useData();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableData>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>(Array(NUM_PERIODS).fill(''));
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  const [breakAfterPeriod, setBreakAfterPeriod] = useState<number>(4);
  const [breakDuration, setBreakDuration] = useState('30 minutes');
  
  const [openSubjectManager, setOpenSubjectManager] = useState(false);
  const [subjectManagerClassId, setSubjectManagerClassId] = useState<string | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');

  // When the component mounts, check if a timetable exists and sync break settings from it
  useEffect(() => {
    const firstTimetableWithSettings = timetables.find(t => t.breakAfterPeriod !== undefined);
    if (firstTimetableWithSettings) {
        setBreakAfterPeriod(firstTimetableWithSettings.breakAfterPeriod || 4);
        setBreakDuration(firstTimetableWithSettings.breakDuration || '30 minutes');
    }
  }, [timetables]);

  useEffect(() => {
    if (selectedClassId) {
      const existingTimetable = timetables.find(t => t.classId === selectedClassId);
      if (existingTimetable) {
        setTimetableData(existingTimetable.data || Array(NUM_PERIODS).fill(null));
        setTimeSlots(existingTimetable.timeSlots || Array(NUM_PERIODS).fill(''));
      } else {
        // Create a new blank timetable structure if none exists
        setTimetableData(Array(NUM_PERIODS).fill(null));
        setTimeSlots(Array(NUM_PERIODS).fill(''));
      }
    } else {
      setTimetableData([]);
      setTimeSlots(Array(NUM_PERIODS).fill(''));
    }
  }, [selectedClassId, timetables]);

  const handleCellChange = (periodIndex: number, field: 'teacherId' | 'subject', value: string) => {
    if (!selectedClassId) return;
    const actualValue = value === 'none' ? '' : value;
    
    const updatedData = [...timetableData];
    const currentCell = updatedData[periodIndex] ? { ...updatedData[periodIndex] } : { teacherId: '', subject: '' };
    
    let newCell: TimetableCell | null = {
      ...currentCell,
      [field]: actualValue
    };

    if (!newCell.teacherId && !newCell.subject) {
        newCell = null;
    }
    
    updatedData[periodIndex] = newCell;
    setTimetableData(updatedData);
  };

  const handleTimeSlotChange = (periodIndex: number, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[periodIndex] = value;
    setTimeSlots(newTimeSlots);
  }

  const handleSaveTimetable = () => {
    if (!selectedClassId) {
        toast({ title: "No Class Selected", description: "Please select a class to save its timetable.", variant: "destructive"});
        return;
    }
    updateTimetable(selectedClassId, timetableData, timeSlots, breakAfterPeriod, breakDuration);
    toast({
      title: "Timetable Saved",
      description: `The timetable for the selected class has been updated.`,
    });
  };
  
  const selectedClassInfo = useMemo(() => {
    return classes.find(c => c.id === selectedClassId);
  }, [selectedClassId, classes]);

  const teacherSchedule = useMemo(() => {
    if (!selectedTeacherId) return null;
    const schedule: { [day: string]: ({ period: number; class: string; subject: string, time: string })[] } = {};
    daysOfWeek.forEach(day => schedule[day] = []);

    timetables.forEach(tt => {
      const classInfo = classes.find(c => c.id === tt.classId);
      if (!classInfo) return;

      tt.data.forEach((cell, periodIndex) => {
          if (cell && cell.teacherId === selectedTeacherId) {
             // This schedule repeats daily, so add to all days
             daysOfWeek.forEach(day => {
                schedule[day].push({
                    period: periodIndex + 1,
                    class: classInfo.name,
                    subject: cell.subject,
                    time: tt.timeSlots?.[periodIndex] || ''
                });
             });
          }
      });
    });
    // Sort each day's schedule by period
    Object.keys(schedule).forEach(day => {
        schedule[day].sort((a,b) => a.period - b.period);
    });

    return schedule;
  }, [selectedTeacherId, timetables, classes]);


  const handlePrintTeacherSchedule = () => {
    if (!selectedTeacherId || !teacherSchedule) {
      toast({ title: "Please select a teacher.", variant: "destructive" });
      return;
    }
    const teacherInfo = teachers.find(t => t.id === selectedTeacherId);
    if (!teacherInfo) return;

    const printContent = renderToString(
        <TeacherSchedulePrint
            teacher={teacherInfo}
            schedule={teacherSchedule}
            daysOfWeek={daysOfWeek}
        />
    );
     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write(`<html><head><title>Schedule - ${teacherInfo.name}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css" /></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  };

  const handlePrintClassTimetable = () => {
    if (!selectedClassId || !selectedClassInfo) {
     toast({ title: "Please select a class to print.", variant: "destructive" });
     return;
   }
    const printContent = renderToString(
       <TimetablePrint
           classInfo={selectedClassInfo}
           timetableData={timetableData}
           timeSlots={timeSlots}
           daysOfWeek={daysOfWeek}
           breakAfterPeriod={breakAfterPeriod}
           breakDuration={breakDuration}
       />
    );
    const printWindow = window.open('', '_blank');
    if (printWindow) {
       printWindow.document.write(`<html><head><title>Timetable - ${selectedClassInfo.name}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"/></head><body>${printContent}</body></html>`);
       printWindow.document.close();
       printWindow.focus();
    }
 };
 
  // Subject Management
  const openSubjectManagerDialog = (classId: string) => {
    setSubjectManagerClassId(classId);
    setOpenSubjectManager(true);
  };
  
  const subjectsForManager = useMemo(() => {
    if (!subjectManagerClassId) return [];
    return classes.find(c => c.id === subjectManagerClassId)?.subjects || [];
  }, [subjectManagerClassId, classes]);

  const handleAddSubject = () => {
    if (!subjectManagerClassId || !newSubjectName.trim()) return;
    const classToUpdate = classes.find(c => c.id === subjectManagerClassId);
    if (classToUpdate) {
        const updatedSubjects = [...(classToUpdate.subjects || []), newSubjectName.trim()];
        updateClass(subjectManagerClassId, { ...classToUpdate, subjects: updatedSubjects });
        setNewSubjectName('');
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
     if (!subjectManagerClassId) return;
     const classToUpdate = classes.find(c => c.id === subjectManagerClassId);
     if (classToUpdate) {
        const updatedSubjects = (classToUpdate.subjects || []).filter(s => s !== subjectToRemove);
        updateClass(subjectManagerClassId, { ...classToUpdate, subjects: updatedSubjects });
     }
  };

  const PeriodCell = ({ periodIndex }: { periodIndex: number }) => {
    const cellData = timetableData[periodIndex];

    return (
        <div className="h-24 w-full p-0.5 flex flex-col border-t-2 border-double border-gray-300">
            <Select
                value={cellData?.teacherId || 'none'}
                onValueChange={(teacherId) => handleCellChange(periodIndex, 'teacherId', teacherId)}
            >
                <SelectTrigger className="h-12 text-xs border-0 rounded-b-none focus:ring-0 bg-transparent justify-center font-semibold">
                    <SelectValue placeholder="Teacher" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">- Teacher -</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <div className="border-t border-dashed border-gray-300 mx-1"></div>

            <Select
                value={cellData?.subject || 'none'}
                onValueChange={(subject) => handleCellChange(periodIndex, 'subject', subject)}
            >
                <SelectTrigger className="h-12 text-xs border-0 rounded-t-none focus:ring-0 bg-transparent justify-center">
                    <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="none">- Subject -</SelectItem>
                    {(selectedClassInfo?.subjects || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><CalendarClock /> Timetable Management</h1>
      
      <Tabs defaultValue="class-timetable">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="class-timetable"><BookOpen className="mr-2 h-4 w-4"/>Class Timetable</TabsTrigger>
          <TabsTrigger value="teacher-schedule"><User className="mr-2 h-4 w-4"/>Teacher Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="class-timetable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle>Class Schedule Template</CardTitle>
                  <CardDescription>Define the daily schedule for each class. This template will apply to all weekdays.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleSaveTimetable} disabled={!selectedClassId}><Save className="mr-2 h-4 w-4"/>Save Timetable</Button>
                    <Button onClick={handlePrintClassTimetable} variant="outline" disabled={!selectedClassId}><Printer className="mr-2 h-4 w-4"/> Print Weekly</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end gap-2 flex-wrap">
                    <div className="space-y-1">
                        <Label>Select Class to Edit</Label>
                        <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                    {selectedClassId && <Button variant="outline" onClick={() => openSubjectManagerDialog(selectedClassId)}>Manage Subjects</Button>}
                </div>
                
                 <Card className="p-4 bg-muted/50">
                    <div className="flex flex-wrap items-end gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="break-after">Break After Period</Label>
                             <Select value={String(breakAfterPeriod)} onValueChange={(v) => setBreakAfterPeriod(Number(v))}>
                                <SelectTrigger className="w-48" id="break-after">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({length: NUM_PERIODS-1}).map((_, i) => (
                                        <SelectItem key={i+1} value={String(i+1)}>After Period {i+1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="break-duration">Break Duration</Label>
                             <Input id="break-duration" value={breakDuration} onChange={(e) => setBreakDuration(e.target.value)} placeholder="e.g., 30 minutes" />
                        </div>
                    </div>
                </Card>

              {selectedClassId ? (
                 <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-muted">
                                {Array.from({length: NUM_PERIODS}).map((_, i) => {
                                    if (i + 1 === breakAfterPeriod + 1) {
                                        return (
                                            <th key={`break-header-${i}`} className="border p-2 font-bold bg-green-200" rowSpan={2}>
                                                 <div className="flex flex-col items-center justify-center h-full">
                                                    <p className="[writing-mode:vertical-rl] transform -rotate-180 text-lg p-2">BREAK</p>
                                                    <p className="text-sm">({breakDuration})</p>
                                                </div>
                                            </th>
                                        )
                                    }
                                    return (
                                        <th key={i} className="border p-2 font-semibold w-40">
                                            <p>Period {i < breakAfterPeriod ? i+1 : i}</p>
                                            <Input 
                                                placeholder="e.g., 8:00" 
                                                className="h-7 text-xs mt-1" 
                                                value={timeSlots[i] || ''}
                                                onChange={(e) => handleTimeSlotChange(i, e.target.value)}
                                            />
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {Array.from({length: NUM_PERIODS}).map((_, periodIndex) => {
                                    if (periodIndex === breakAfterPeriod) return null; // Skip rendering the cell under the break column
                                    return (
                                        <td key={periodIndex} className="border p-0 align-middle">
                                            <PeriodCell periodIndex={periodIndex} />
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                 </div>
              ) : (
                 <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
                    <p className="text-muted-foreground">Please select a class to edit its schedule template.</p>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher-schedule">
          <Card>
            <CardHeader>
               <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Teacher Schedule</CardTitle>
                  <CardDescription>Select a teacher to view and print their individual weekly schedule.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                  <Select onValueChange={setSelectedTeacherId} value={selectedTeacherId || ''}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handlePrintTeacherSchedule} disabled={!selectedTeacherId}><Printer className="mr-2 h-4 w-4" />Print Schedule</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
               {selectedTeacherId && teacherSchedule ? (
                 <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted">
                                <th className="border p-2 font-semibold">Day</th>
                                {Array.from({length: NUM_PERIODS}).map((_, i) => {
                                    if (i === breakAfterPeriod) {
                                         return (
                                            <th key={i} className="border p-2 font-bold bg-green-200">BREAK</th>
                                         );
                                    }
                                    const periodNumber = i < breakAfterPeriod ? i + 1 : i;
                                    const time = timeSlots[i] || '';
                                    return <th key={i} className="border p-2 font-semibold">Period {periodNumber} ({time})</th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {daysOfWeek.map(day => (
                                <tr key={day}>
                                    <td className="border p-2 w-28 font-medium">{day}</td>
                                    {Array.from({length: NUM_PERIODS}).map((_, periodIndex) => {
                                        if (periodIndex === breakAfterPeriod) return <td key={`break-cell-${periodIndex}`} className="border p-2"></td>
                                        const entry = teacherSchedule[day].find(e => e.period === (periodIndex < breakAfterPeriod ? periodIndex + 1 : periodIndex));
                                        return (
                                            <td key={periodIndex} className="border p-2 align-top h-24">
                                                {entry ? (
                                                    <div className="text-xs">
                                                        <p className="font-bold">{entry.class}</p>
                                                        <p>{entry.subject}</p>
                                                    </div>
                                                ) : null}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
               ) : (
                <div className="flex items-center justify-center h-96 border rounded-lg bg-gray-50">
                    <p className="text-muted-foreground">Please select a teacher to view their schedule.</p>
                </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
       <Dialog open={openSubjectManager} onOpenChange={setOpenSubjectManager}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Subjects for {classes.find(c => c.id === subjectManagerClassId)?.name}</DialogTitle>
            <DialogDescription>
              Add or remove subjects for this class. These subjects will appear in the timetable dropdown.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
                <Input 
                    placeholder="Enter new subject name" 
                    value={newSubjectName} 
                    onChange={e => setNewSubjectName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject}><PlusCircle className="mr-2 h-4 w-4"/> Add</Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {subjectsForManager.map(subject => (
                    <div key={subject} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                        <span className="font-medium">{subject}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveSubject(subject)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                ))}
                {subjectsForManager.length === 0 && <p className="text-center text-muted-foreground pt-4">No subjects added yet.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSubjectManager(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
