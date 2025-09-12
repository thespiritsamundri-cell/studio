
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, CalendarClock, User, BookOpen, Save, Users, PlusCircle, MinusCircle } from 'lucide-react';
import type { TimetableData, Class, Teacher } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { MasterTimetablePrint } from '@/components/reports/master-timetable-print';
import { TimetablePrint } from '@/components/reports/timetable-print';
import { TeacherSchedulePrint } from '@/components/reports/teacher-schedule-print';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  useEffect(() => {
    const firstTimetableWithSettings = timetables.find(t => t.breakAfterPeriod !== undefined);
    const periodCount = firstTimetableWithSettings?.timeSlots?.length || 8;
    setNumPeriods(periodCount);
    setBreakAfterPeriod(firstTimetableWithSettings?.breakAfterPeriod || 4);
    setBreakDuration(firstTimetableWithSettings?.breakDuration || '30 minutes');
    setTimeSlots(firstTimetableWithSettings?.timeSlots || Array(periodCount).fill(''));

    const initialMasterData: Record<string, TimetableData> = {};
    classes.forEach(c => {
        const tt = timetables.find(t => t.classId === c.id);
        const dataLength = tt?.data?.length || periodCount;
        const classData = tt?.data || Array.from({ length: dataLength }, () => ({ teacherId: '', subject: '' }));
        while (classData.length < periodCount) {
             classData.push({ teacherId: '', subject: '' });
        }
        initialMasterData[c.id] = classData.slice(0, periodCount);
    });
    setMasterTimetableData(initialMasterData);
  }, [timetables, classes]);
  
  const handleNumPeriodsChange = (newNumPeriods: number) => {
    if (newNumPeriods < 1 || newNumPeriods > 12) return;

    setNumPeriods(newNumPeriods);

    if (breakAfterPeriod >= newNumPeriods) {
        setBreakAfterPeriod(newNumPeriods > 1 ? newNumPeriods - 1 : 1);
    }
    
    setTimeSlots(prev => {
        const newSlots = [...prev];
        while (newSlots.length < newNumPeriods) newSlots.push('');
        return newSlots.slice(0, newNumPeriods);
    });

    setMasterTimetableData(prev => {
        const newData = {...prev};
        for (const classId in newData) {
            const classData = [...newData[classId]];
            while(classData.length < newNumPeriods) classData.push({ teacherId: '', subject: '' });
            newData[classId] = classData.slice(0, newNumPeriods);
        }
        return newData;
    });
  };

  const handleMasterCellChange = (classId: string, periodIndex: number, field: 'teacherId' | 'subject', value: string) => {
    setMasterTimetableData(prev => {
      const newMasterData = { ...prev };
      const classData = newMasterData[classId] ? [...newMasterData[classId]] : Array.from({ length: numPeriods }, () => ({ teacherId: '', subject: '' }));
      
      const cellData = classData[periodIndex] ? { ...classData[periodIndex] } : { teacherId: '', subject: '' };
      
      const actualValue = value === 'none' ? '' : value;
      cellData[field] = actualValue;

      classData[periodIndex] = cellData;
      newMasterData[classId] = classData;

      return newMasterData;
    });
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
    
    const schedule: { period: number; class: string; subject: string, time: string }[] = [];

    Array.from({ length: numPeriods }).forEach((_, periodIndex) => {
        Object.entries(masterTimetableData).forEach(([classId, data]) => {
            const classInfo = classes.find(c => c.id === classId);
            if (!classInfo || !data) return;

            const cell = data[periodIndex];
            if (cell && cell.teacherId === selectedTeacherId) {
                schedule.push({
                    period: periodIndex + 1,
                    class: classInfo.name,
                    subject: cell.subject,
                    time: timeSlots[periodIndex] || ''
                });
            }
        });
    });

    schedule.sort((a,b) => a.period - b.period);
    return schedule;
  }, [selectedTeacherId, masterTimetableData, classes, timeSlots, numPeriods]);


  const handlePrint = (type: 'master' | 'class' | 'teacher') => {
    let printContent = '';
    let printTitle = 'Timetable';
    let isLandscape = false;
    
    if (type === 'master') {
        printContent = renderToString(<MasterTimetablePrint settings={settings} teachers={teachers} classes={classes} masterTimetableData={masterTimetableData} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} breakDuration={breakDuration} numPeriods={numPeriods} />);
        printTitle = 'Master Timetable';
        isLandscape = true;
    } else if (type === 'class') {
        const classInfo = classes.find(c => c.id === selectedClassId);
        if (!classInfo || !masterTimetableData[selectedClassId]) {
            toast({ title: "Please select a class.", variant: "destructive" });
            return;
        }
        printContent = renderToString(<TimetablePrint classInfo={classInfo} timetableData={masterTimetableData[selectedClassId] || []} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} breakDuration={breakDuration} numPeriods={numPeriods} settings={settings} teachers={teachers} />);
        printTitle = `Timetable - ${classInfo.name}`;
        isLandscape = true;
    } else if (type === 'teacher') {
        const teacherInfo = teachers.find(t => t.id === selectedTeacherId);
        if (!teacherInfo || !teacherSchedule) {
            toast({ title: "Please select a teacher.", variant: "destructive" });
            return;
        }
        printContent = renderToString(<TeacherSchedulePrint teacher={teacherInfo} schedule={teacherSchedule} settings={settings} />);
        printTitle = `Schedule - ${teacherInfo.name}`;
    }

     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write(`<html><head><title>${printTitle}</title><script src="https://cdn.tailwindcss.com"></script><style>@page { size: ${isLandscape ? 'landscape' : 'portrait'}; }</style><link rel="stylesheet" href="/print-styles.css" /></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  };

  const renderMasterTableHeader = () => {
    const headers = [];
    for (let i = 0; i < numPeriods; i++) {
        headers.push(
            <th key={`header-period-${i}`} className="p-0 font-semibold w-48 align-middle">
                <div className="flex flex-col items-center justify-center h-24">
                  <p>Period {i + 1}</p>
                  <Input
                      placeholder="e.g., 8:00"
                      className="h-7 text-xs mt-1 w-24 text-center"
                      value={timeSlots[i] || ''}
                      onChange={(e) => handleTimeSlotChange(i, e.target.value)}
                  />
                </div>
            </th>
        );
    }
    return headers;
  };
  
    const renderMasterTableBody = () => {
      return classes.map(cls => (
          <tr key={cls.id}>
              <td className="border p-2 font-semibold sticky left-0 bg-background z-10">{cls.name}</td>
              {Array.from({ length: numPeriods }).map((_, periodIndex) => {
                  const cellData = masterTimetableData[cls.id]?.[periodIndex];
                   if (periodIndex + 1 === breakAfterPeriod) {
                       return (
                           <td key={`break-cell-${cls.id}`} className="border p-0 bg-green-100"></td>
                       )
                   }
                  
                  return (
                       <td key={`${cls.id}-${periodIndex}`} className="border p-0 align-top">
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
      ));
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
                                        {Array.from({length: numPeriods}).map((_, i) => (
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
                             <thead className="bg-muted">
                                <tr>
                                    <th className="border p-2 font-semibold w-32 sticky left-0 bg-muted z-10 align-middle">Class</th>
                                    {renderMasterTableHeader().slice(0, breakAfterPeriod)}
                                    <th className="border p-2 font-semibold bg-green-200 text-green-800" rowSpan={classes.length + 1}>
                                        <div className="[writing-mode:vertical-rl] transform rotate-180 h-full flex items-center justify-center p-2">
                                            BREAK ({breakDuration})
                                        </div>
                                    </th>
                                    {renderMasterTableHeader().slice(breakAfterPeriod)}
                                </tr>
                            </thead>
                            <tbody>
                                {renderMasterTableBody()}
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
                    <TimetablePrint classInfo={classes.find(c => c.id === selectedClassId)!} timetableData={masterTimetableData[selectedClassId] || []} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} breakDuration={breakDuration} numPeriods={numPeriods} settings={settings} teachers={teachers} />
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
                  <CardDescription>Select a teacher to view and print their individual daily schedule.</CardDescription>
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
                                <th className="border p-2 font-semibold">Period</th>
                                <th className="border p-2 font-semibold">Time</th>
                                <th className="border p-2 font-semibold">Class</th>
                                <th className="border p-2 font-semibold">Subject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherSchedule.length > 0 ? (
                                teacherSchedule.map((entry) => (
                                    <tr key={`${entry.period}-${entry.class}`}>
                                        <td className="border p-2 text-center">{entry.period}</td>
                                        <td className="border p-2 text-center">{entry.time || '-'}</td>
                                        <td className="border p-2 text-center">{entry.class}</td>
                                        <td className="border p-2 text-center">{entry.subject}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="border p-4 text-center text-muted-foreground">No periods scheduled for this teacher.</td>
                                </tr>
                            )}
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
