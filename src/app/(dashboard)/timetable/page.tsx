

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
  
  const [masterTimetableData, setMasterTimetableData] = useState<Record<string, TimetableData>>({});
  const [timeSlots, setTimeSlots] = useState<string[]>(Array(numPeriods).fill(''));
  

  useEffect(() => {
    // This effect initializes the state from the first available timetable settings
    const firstTimetableWithSettings = timetables.find(t => t.timeSlots && t.timeSlots.length > 0);
    const periodCount = 8; // Hardcode to 8 periods
    setNumPeriods(periodCount);
    setTimeSlots(firstTimetableWithSettings?.timeSlots || Array(periodCount).fill(''));
    setBreakAfterPeriod(firstTimetableWithSettings?.breakAfterPeriod || 4);
    
    // Initialize master data for all classes based on the determined period count
    const initialMasterData: Record<string, TimetableData> = {};
    classes.forEach(c => {
        const tt = timetables.find(t => t.classId === c.id);
        // Ensure every class has an array of the correct length
        const classData = tt?.data || [];
        while (classData.length < periodCount) {
             classData.push({ teacherId: '', subject: '' });
        }
        initialMasterData[c.id] = classData.slice(0, periodCount);
    });
    setMasterTimetableData(initialMasterData);

  }, [timetables, classes]);


  const handleNumPeriodsChange = (newNumPeriods: number) => {
    // This function is kept for potential future use but the UI controls are removed.
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
        updateTimetable(classId, masterTimetableData[classId], timeSlots, breakAfterPeriod);
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
    
    if (type === 'master') {
        printContent = renderToString(<MasterTimetablePrint settings={settings} teachers={teachers} classes={classes} masterTimetableData={masterTimetableData} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} />);
        printTitle = 'Master Timetable';
    } else if (type === 'class') {
        const classInfo = classes.find(c => c.id === selectedClassId);
        if (!classInfo || !masterTimetableData[selectedClassId]) {
            toast({ title: "Please select a class.", variant: "destructive" });
            return;
        }
        printContent = renderToString(<TimetablePrint classInfo={classInfo} timetableData={masterTimetableData[selectedClassId] || []} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} breakDuration="" numPeriods={numPeriods} settings={settings} teachers={teachers} />);
        printTitle = `Timetable - ${classInfo.name}`;
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
        printWindow.document.write(`<html><head><title>${printTitle}</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css" /></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  };
  
    const renderCell = (classId: string, periodIndex: number) => {
        const cellData = masterTimetableData[classId]?.[periodIndex];
        return (
             <td key={periodIndex} className="border p-0 align-top h-24">
                <div className="h-full w-full flex flex-col">
                    <Select
                        value={cellData?.teacherId || 'none'}
                        onValueChange={(teacherId) => handleMasterCellChange(classId, periodIndex, 'teacherId', teacherId)}
                    >
                        <SelectTrigger className="h-1/2 text-xs border-0 border-b rounded-none focus:ring-0 bg-transparent justify-center font-semibold data-[placeholder]:text-muted-foreground">
                            <SelectValue placeholder="- Teacher -" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">- No Teacher -</SelectItem>
                            {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input
                        className="h-1/2 text-xs text-center border-0 rounded-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground"
                        placeholder="- Subject -"
                        value={cellData?.subject || ''}
                        onChange={(e) => handleMasterCellChange(classId, periodIndex, 'subject', e.target.value)}
                    />
                </div>
            </td>
        );
    };

    const sortedClasses = useMemo(() => {
        return [...classes].sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [classes]);

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
                            <Button onClick={handleSaveAllTimetables}><Save className="mr-2 h-4 w-4"/>Save All</Button>
                            <Button onClick={() => handlePrint('master')} variant="outline"><Printer className="mr-2 h-4 w-4"/> Print</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full border-collapse min-w-[1600px] table-fixed">
                             <colgroup>
                                <col style={{ width: '120px' }} />
                                {/* 8 periods */}
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: 'auto' }} />
                                {/* Break */}
                                <col style={{ width: '40px' }} /> 
                                {/* 4 more periods */}
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: 'auto' }} />
                                <col style={{ width: 'auto' }} />
                             </colgroup>
                             <thead>
                                <tr className="bg-muted h-24">
                                    <th className="border p-1 font-semibold sticky left-0 bg-muted z-10 text-sm">
                                        Class
                                    </th>
                                    {Array.from({ length: 8 }).map((_, periodIndex) => (
                                        <React.Fragment key={`header-frag-${periodIndex}`}>
                                            {periodIndex === 4 && (
                                                <th key="break-header" className="border bg-green-100 p-0 w-10"></th>
                                            )}
                                            <th className="border p-1 font-semibold text-xs">
                                                <div>Period {periodIndex + 1}</div>
                                                <Input 
                                                    value={timeSlots[periodIndex] || ''}
                                                    onChange={(e) => handleTimeSlotChange(periodIndex, e.target.value)}
                                                    className="h-7 mt-1 text-center text-xs"
                                                    placeholder="N/A"
                                                />
                                            </th>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedClasses.map((cls) => (
                                    <tr key={cls.id}>
                                        <td className="border p-2 font-semibold sticky left-0 bg-background z-10 text-sm">{cls.name}</td>
                                        {Array.from({ length: 8 }).map((_, periodIndex) => (
                                             <React.Fragment key={`cell-frag-${cls.id}-${periodIndex}`}>
                                                {periodIndex === 4 && <td key={`break-cell-${cls.id}`} className="border bg-green-100"></td>}
                                                {renderCell(cls.id, periodIndex)}
                                            </React.Fragment>
                                        ))}
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
                    <TimetablePrint classInfo={classes.find(c => c.id === selectedClassId)!} timetableData={masterTimetableData[selectedClassId] || []} timeSlots={timeSlots} breakAfterPeriod={breakAfterPeriod} breakDuration="" numPeriods={numPeriods} settings={settings} teachers={teachers} />
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
