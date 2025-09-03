

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, CalendarClock, User, BookOpen, Save, Users, PlusCircle, MinusCircle } from 'lucide-react';
import type { Timetable as TimetableType, TimetableData } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { MasterTimetablePrint } from '@/components/reports/master-timetable-print';
import { TimetablePrint } from '@/components/reports/timetable-print';
import { TeacherSchedulePrint } from '@/components/reports/teacher-schedule-print';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { classes, timetables, updateTimetable, teachers } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  const [numPeriods, setNumPeriods] = useState(8);
  const [breakAfterPeriod, setBreakAfterPeriod] = useState<number>(4);
  const [breakDuration, setBreakDuration] = useState('30 minutes');
  
  const [masterTimetableData, setMasterTimetableData] = useState<Record<string, TimetableData>>({});
  const [timeSlots, setTimeSlots] = useState<string[]>(Array(numPeriods).fill(''));

  // Sync data on initial load and when timetables change
  useEffect(() => {
    const firstTimetableWithSettings = timetables.find(t => t.breakAfterPeriod !== undefined);
    if (firstTimetableWithSettings) {
        const periodCount = firstTimetableWithSettings.timeSlots?.length || 8;
        setNumPeriods(periodCount);
        setBreakAfterPeriod(firstTimetableWithSettings.breakAfterPeriod || 4);
        setBreakDuration(firstTimetableWithSettings.breakDuration || '30 minutes');
        setTimeSlots(firstTimetableWithSettings.timeSlots || Array(periodCount).fill(''));
    }

    const initialMasterData: Record<string, TimetableData> = {};
    classes.forEach(c => {
        const tt = timetables.find(t => t.classId === c.id);
        const periodCount = tt?.data?.length || numPeriods;
        initialMasterData[c.id] = tt?.data || Array.from({ length: periodCount }, () => null);
    });
    setMasterTimetableData(initialMasterData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetables, classes]);
  
  const handleNumPeriodsChange = (newNumPeriods: number) => {
    if (newNumPeriods < 1 || newNumPeriods > 12) return;

    // Adjust break period if it's out of bounds
    if (breakAfterPeriod >= newNumPeriods) {
        setBreakAfterPeriod(newNumPeriods - 1);
    }
    
    // Adjust timeSlots
    setTimeSlots(prev => {
        const newSlots = [...prev];
        while (newSlots.length < newNumPeriods) newSlots.push('');
        return newSlots.slice(0, newNumPeriods);
    });

    // Adjust master timetable data
    setMasterTimetableData(prev => {
        const newData = {...prev};
        for (const classId in newData) {
            const classData = [...newData[classId]];
            while(classData.length < newNumPeriods) classData.push(null);
            newData[classId] = classData.slice(0, newNumPeriods);
        }
        return newData;
    });

    setNumPeriods(newNumPeriods);
  };

  const handleMasterCellChange = (classId: string, periodIndex: number, field: 'teacherId' | 'subject', value: string) => {
    const classData = masterTimetableData[classId] ? [...masterTimetableData[classId]] : Array.from({ length: numPeriods }, () => null);
    const cell = classData[periodIndex] ? { ...classData[periodIndex] } : { teacherId: '', subject: '' };
    
    const actualValue = value === 'none' ? '' : value;
    cell[field] = actualValue;

    classData[periodIndex] = (cell.teacherId || cell.subject) ? cell : null;

    setMasterTimetableData(prev => ({
        ...prev,
        [classId]: classData
    }));
  };

  const handleTimeSlotChange = (periodIndex: number, value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[periodIndex] = value;
    setTimeSlots(newTimeSlots);
  }

  const handleSaveAllTimetables = () => {
    Object.keys(masterTimetableData).forEach(classId => {
        updateTimetable(classId, masterTimetableData[classId], timeSlots, breakAfterPeriod, breakDuration);
    });
    toast({
      title: "All Timetables Saved",
      description: `All school schedules have been updated.`,
    });
  };

  const teacherSchedule = useMemo(() => {
    if (!selectedTeacherId) return null;
    const schedule: { [day: string]: { period: number; class: string; subject: string, time: string }[] } = {};
    daysOfWeek.forEach(day => schedule[day] = []);

    Object.entries(masterTimetableData).forEach(([classId, data]) => {
      const classInfo = classes.find(c => c.id === classId);
      if (!classInfo || !data) return;

      data.forEach((cell, periodIndex) => {
          if (cell && cell.teacherId === selectedTeacherId) {
             daysOfWeek.forEach(day => {
                schedule[day].push({
                    period: periodIndex + 1,
                    class: classInfo.name,
                    subject: cell.subject,
                    time: timeSlots[periodIndex] || ''
                });
             });
          }
      });
    });
    Object.keys(schedule).forEach(day => schedule[day].sort((a,b) => a.period - b.period));
    return schedule;
  }, [selectedTeacherId, masterTimetableData, classes, timeSlots]);

  const handlePrint = (type: 'master' | 'class' | 'teacher') => {
    let printContent = '';
    let printTitle = 'Timetable';
    let isLandscape = false;
    
    if (type === 'master') {
        printContent = renderToString(<MasterTimetablePrint settings={settings} teachers={teachers} classes={classes} masterTimetableData={masterTimetableData} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} breakDuration={breakDuration} />);
        printTitle = 'Master Timetable';
        isLandscape = true;
    } else if (type === 'class') {
        const classInfo = classes.find(c => c.id === selectedClassId);
        if (!classInfo || !masterTimetableData[selectedClassId]) {
            toast({ title: "Please select a class.", variant: "destructive" });
            return;
        }
        printContent = renderToString(<TimetablePrint classInfo={classInfo} timetableData={masterTimetableData[selectedClassId] || []} timeSlots={timeSlots} daysOfWeek={daysOfWeek} breakAfterPeriod={breakAfterPeriod} breakDuration={breakDuration} settings={settings} teachers={teachers} />);
        printTitle = `Timetable - ${classInfo.name}`;
        isLandscape = true;
    } else if (type === 'teacher') {
        const teacherInfo = teachers.find(t => t.id === selectedTeacherId);
        if (!teacherInfo || !teacherSchedule) {
            toast({ title: "Please select a teacher.", variant: "destructive" });
            return;
        }
        printContent = renderToString(<TeacherSchedulePrint teacher={teacherInfo} schedule={teacherSchedule} daysOfWeek={daysOfWeek} settings={settings} />);
        printTitle = `Schedule - ${teacherInfo.name}`;
    }

     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write(`<html><head><title>${printTitle}</title><script src="https://cdn.tailwindcss.com"></script><style>@page { size: ${isLandscape ? 'landscape' : 'portrait'}; }</style><link rel="stylesheet" href="/print-styles.css" /></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><CalendarClock /> Timetable Management</h1>
      
      <Tabs defaultValue="master-timetable">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="master-timetable"><Users className="mr-2 h-4 w-4"/>Master Timetable</TabsTrigger>
          <TabsTrigger value="class-timetable"><BookOpen className="mr-2 h-4 w-4"/>Class Timetable</TabsTrigger>
          <TabsTrigger value="teacher-schedule"><User className="mr-2 h-4 w-4"/>Teacher Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="master-timetable">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                        <CardTitle>Master Timetable Editor</CardTitle>
                        <CardDescription>Define the daily schedule for all classes. This template applies to all weekdays.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={handleSaveAllTimetables}><Save className="mr-2 h-4 w-4"/>Save All Changes</Button>
                            <Button onClick={() => handlePrint('master')} variant="outline"><Printer className="mr-2 h-4 w-4"/> Print Master</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Card className="p-4 bg-muted/50">
                        <div className="flex flex-wrap items-end gap-6">
                             <div className="space-y-2">
                                <Label>Number of Periods</Label>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" onClick={() => handleNumPeriodsChange(numPeriods - 1)} disabled={numPeriods <= 1}>
                                        <MinusCircle className="h-4 w-4"/>
                                    </Button>
                                    <span className="font-bold text-lg w-10 text-center">{numPeriods}</span>
                                     <Button size="icon" variant="outline" onClick={() => handleNumPeriodsChange(numPeriods + 1)} disabled={numPeriods >= 12}>
                                        <PlusCircle className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="break-after">Break After Period</Label>
                                <Select value={String(breakAfterPeriod)} onValueChange={(v) => setBreakAfterPeriod(Number(v))}>
                                    <SelectTrigger className="w-48" id="break-after">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({length: numPeriods - 1}).map((_, i) => (
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
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full border-collapse min-w-[1600px]">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="border p-2 font-semibold w-32 sticky left-0 bg-muted z-10">Class</th>
                                    {Array.from({ length: numPeriods }).map((_, i) => {
                                        const periodNumber = i + 1;
                                        if (i === breakAfterPeriod) {
                                            return (
                                                <React.Fragment key={`break-header-${i}`}>
                                                    <th className="border p-2 font-semibold w-48">
                                                        <p>Period {periodNumber}</p>
                                                        <Input
                                                            placeholder="e.g., 8:00"
                                                            className="h-7 text-xs mt-1"
                                                            value={timeSlots[i] || ''}
                                                            onChange={(e) => handleTimeSlotChange(i, e.target.value)}
                                                        />
                                                    </th>
                                                    <th className="border p-2 font-bold bg-green-200 text-center align-middle [writing-mode:vertical-rl] transform rotate-180" rowSpan={classes.length + 1}>
                                                        BREAK ({breakDuration})
                                                    </th>
                                                </React.Fragment>
                                            );
                                        }
                                        return (
                                            <th key={i} className="border p-2 font-semibold w-48">
                                                <p>Period {periodNumber}</p>
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
                                {classes.map((cls) => (
                                    <tr key={cls.id}>
                                        <td className="border p-2 font-semibold sticky left-0 bg-background z-10">{cls.name}</td>
                                        {Array.from({ length: numPeriods }).map((_, periodIndex) => {
                                            if (periodIndex === breakAfterPeriod) return null;
                                            
                                            const cellData = masterTimetableData[cls.id]?.[periodIndex];
                                            return (
                                                <td key={periodIndex} className="border p-0 align-top">
                                                    <div className="h-24 w-full flex flex-col">
                                                        <Select
                                                            value={cellData?.teacherId || 'none'}
                                                            onValueChange={(teacherId) => handleMasterCellChange(cls.id, periodIndex, 'teacherId', teacherId)}
                                                        >
                                                            <SelectTrigger className="h-12 text-xs border-0 border-b rounded-none focus:ring-0 bg-transparent justify-center font-semibold">
                                                                <SelectValue placeholder="- Teacher -" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">- No Teacher -</SelectItem>
                                                                {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <Input
                                                            className="h-12 text-xs text-center border-0 rounded-none focus-visible:ring-0 bg-transparent"
                                                            placeholder="- Subject -"
                                                            value={cellData?.subject || ''}
                                                            onChange={(e) => handleMasterCellChange(cls.id, periodIndex, 'subject', e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="class-timetable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Class Timetable</CardTitle>
                  <CardDescription>View the weekly schedule for a specific class.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
                        <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                        {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => handlePrint('class')} variant="outline" disabled={!selectedClassId}><Printer className="mr-2 h-4 w-4"/> Print Weekly</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedClassId ? (
                 <div className="border rounded-lg overflow-x-auto">
                    <TimetablePrint classInfo={classes.find(c => c.id === selectedClassId)!} timetableData={masterTimetableData[selectedClassId] || []} timeSlots={timeSlots} daysOfWeek={daysOfWeek} breakAfterPeriod={breakAfterPeriod} breakDuration={breakDuration} settings={settings} teachers={teachers} />
                 </div>
              ) : (
                 <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
                    <p className="text-muted-foreground">Please select a class to view its schedule.</p>
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
                  <Button variant="outline" onClick={() => handlePrint('teacher')} disabled={!selectedTeacherId}><Printer className="mr-2 h-4 w-4" />Print Schedule</Button>
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
                                <th className="border p-2 font-semibold">Period / Time</th>
                                <th className="border p-2 font-semibold">Class</th>
                                <th className="border p-2 font-semibold">Subject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {daysOfWeek.map(day => (
                                teacherSchedule[day].length > 0 ? (
                                    teacherSchedule[day].map((entry, index) => (
                                        <tr key={`${day}-${entry.period}`}>
                                            {index === 0 && <td className="border p-2 w-28 font-medium align-top" rowSpan={teacherSchedule[day].length}>{day}</td>}
                                            <td className="border p-2 align-top">
                                                Period {entry.period}
                                                {entry.time && <p className="text-xs text-muted-foreground">({entry.time})</p>}
                                            </td>
                                            <td className="border p-2 align-top">{entry.class}</td>
                                            <td className="border p-2 align-top">{entry.subject}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr key={day}>
                                        <td className="border p-2 w-28 font-medium">{day}</td>
                                        <td colSpan={3} className="border p-2 text-center text-muted-foreground">No periods scheduled.</td>
                                    </tr>
                                )
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
    </div>
  );
}
