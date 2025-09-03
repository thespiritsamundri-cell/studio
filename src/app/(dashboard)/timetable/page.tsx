
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, CalendarClock, User, BookOpen, Save } from 'lucide-react';
import type { Timetable, TimetableData, TimetableCell } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { TimetablePrint } from '@/components/reports/timetable-print';
import { TeacherSchedulePrint } from '@/components/reports/teacher-schedule-print';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { MasterTimetablePrint } from '@/components/reports/master-timetable-print';
import { Label } from '@/components/ui/label';

const NUM_PERIODS = 8;
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { classes, timetables, updateTimetable, teachers } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableData[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>(Array(NUM_PERIODS).fill(''));
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  
  const [masterTimetableData, setMasterTimetableData] = useState<Record<string, Timetable>>({});
  const [breakAfterPeriod, setBreakAfterPeriod] = useState<number>(4);
  const [breakDuration, setBreakDuration] = useState('30 minutes');

  useEffect(() => {
    const initialMaster: Record<string, Timetable> = {};
    classes.forEach(c => {
      const existing = timetables.find(t => t.classId === c.id);
      if (existing) {
        initialMaster[c.id] = existing;
      } else {
        const emptyData: TimetableData = Array(NUM_PERIODS).fill(null);
        initialMaster[c.id] = { classId: c.id, data: emptyData, timeSlots: Array(NUM_PERIODS).fill('') };
      }
    });
    setMasterTimetableData(initialMaster);

    const firstTimetableWithSettings = timetables.find(t => t.breakAfterPeriod !== undefined);
    if (firstTimetableWithSettings) {
        setBreakAfterPeriod(firstTimetableWithSettings.breakAfterPeriod || 4);
        setBreakDuration(firstTimetableWithSettings.breakDuration || '30 minutes');
    }
  }, [classes, timetables]);


  const handleMasterCellChange = (classId: string, periodIndex: number, field: 'teacherId' | 'subject', value: string) => {
    // Use "none" as the value for clearing the selection
    const actualValue = value === 'none' ? '' : value;

    setMasterTimetableData(prev => {
        const newMaster = { ...prev };
        const newTimetable = { ...newMaster[classId] };
        const newData = [...newTimetable.data];
        
        let currentCell = newData[periodIndex] ? { ...newData[periodIndex] } : { teacherId: '', subject: '' };
        let newCell = { ...currentCell };

        if (field === 'teacherId') {
            newCell.teacherId = actualValue;
        } else {
            newCell.subject = actualValue;
        }
        
        newData[periodIndex] = (newCell.teacherId || newCell.subject) ? newCell as TimetableCell : null;

        newTimetable.data = newData;
        newMaster[classId] = newTimetable;
        return newMaster;
    });
  };

  const handleTimeSlotChange = (periodIndex: number, value: string) => {
     setMasterTimetableData(prev => {
        const newMaster = { ...prev };
        Object.keys(newMaster).forEach(cId => {
            const timeSlotsArray = newMaster[cId].timeSlots ? [...newMaster[cId].timeSlots] : Array(NUM_PERIODS).fill('');
            timeSlotsArray[periodIndex] = value;
            newMaster[cId].timeSlots = timeSlotsArray;
        });
        return newMaster;
    });
  }
  
  const getMasterTimeSlots = () => {
      const firstClassId = classes[0]?.id;
      return firstClassId ? masterTimetableData[firstClassId]?.timeSlots || Array(NUM_PERIODS).fill('') : Array(NUM_PERIODS).fill('');
  }


  const handleSaveAllTimetables = () => {
    Object.values(masterTimetableData).forEach(tt => {
        updateTimetable(tt.classId, tt.data, tt.timeSlots, breakAfterPeriod, breakDuration);
    });
    toast({
      title: "All Timetables Saved",
      description: `All school timetables have been updated successfully.`,
    });
  };

  useEffect(() => {
    if (selectedClassId) {
      const existingTimetable = masterTimetableData[selectedClassId];
      if (existingTimetable) {
        setTimetableData(Array(daysOfWeek.length).fill(existingTimetable.data));
        setTimeSlots(existingTimetable.timeSlots || Array(NUM_PERIODS).fill(''));
      } else {
        setTimetableData(Array.from({ length: daysOfWeek.length }, () => Array(NUM_PERIODS).fill(null)));
        setTimeSlots(Array(NUM_PERIODS).fill(''));
      }
    } else {
      setTimetableData([]);
      setTimeSlots(Array(NUM_PERIODS).fill(''));
    }
  }, [selectedClassId, masterTimetableData]);
  
  const selectedClassInfo = useMemo(() => {
    return classes.find(c => c.id === selectedClassId);
  }, [selectedClassId, classes]);
  
  const handlePrintClassTimetable = () => {
     if (!selectedClassId || !selectedClassInfo) {
      toast({ title: "Please select a class to print.", variant: "destructive" });
      return;
    }
     const printContent = renderToString(
        <TimetablePrint
            settings={settings}
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
  
 const teacherSchedule = useMemo(() => {
    if (!selectedTeacherId) return null;
    const schedule: { [day: string]: ({ period: number; class: string; subject: string, section?: string, time: string })[] } = {};
    daysOfWeek.forEach(day => schedule[day] = []);

    Object.values(masterTimetableData).forEach(tt => {
      const classInfo = classes.find(c => c.id === tt.classId);
      if (!classInfo) return;

      tt.data.forEach((cell, periodIndex) => {
          if (cell && cell.teacherId === selectedTeacherId) {
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
    Object.keys(schedule).forEach(day => {
        schedule[day].sort((a,b) => a.period - b.period);
    });

    return schedule;
  }, [selectedTeacherId, masterTimetableData, classes]);


  const handlePrintTeacherSchedule = () => {
    if (!selectedTeacherId || !teacherSchedule) {
      toast({ title: "Please select a teacher.", variant: "destructive" });
      return;
    }
    const teacherInfo = teachers.find(t => t.id === selectedTeacherId);
    if (!teacherInfo) return;

    const printContent = renderToString(
        <TeacherSchedulePrint
            settings={settings}
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
  
  const handlePrintMasterTimetable = () => {
     const printContent = renderToString(
        <MasterTimetablePrint
            settings={settings}
            classes={classes}
            masterTimetableData={masterTimetableData}
            timeSlots={getMasterTimeSlots()}
            breakAfterPeriod={breakAfterPeriod}
            breakDuration={breakDuration}
        />
     );
     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write(`<html><head><title>Master Timetable</title><script src="https://cdn.tailwindcss.com"></script><link rel="stylesheet" href="/print-styles.css"/></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  }
  
  const MasterTimetableCell = ({ classId, periodIndex }: { classId: string, periodIndex: number }) => {
    const classInfo = classes.find(c => c.id === classId);
    const cellData = masterTimetableData[classId]?.data[periodIndex];

    return (
        <div className="h-24 w-full p-0.5 flex flex-col border-t-2 border-double border-gray-300">
            <Select
                value={cellData?.teacherId || ''}
                onValueChange={(teacherId) => handleMasterCellChange(classId, periodIndex, 'teacherId', teacherId)}
            >
                <SelectTrigger className="h-12 text-xs border-0 rounded-b-none focus:ring-0 bg-transparent justify-center font-semibold">
                    <SelectValue placeholder="Teacher" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">- None -</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
            </Select>

            <div className="border-t border-dashed border-gray-300 mx-1"></div>

            <Select
                value={cellData?.subject || ''}
                onValueChange={(subject) => handleMasterCellChange(classId, periodIndex, 'subject', subject)}
            >
                <SelectTrigger className="h-12 text-xs border-0 rounded-t-none focus:ring-0 bg-transparent justify-center">
                    <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                     <SelectItem value="none">- None -</SelectItem>
                    {(classInfo?.subjects || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
    );
  }


  const renderTimetableGrid = () => {
    if (!selectedClassId || !selectedClassInfo) {
      return (
        <div className="flex items-center justify-center h-96 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground">Please select a class to view its timetable.</p>
        </div>
      );
    }
    
    const classTemplate = timetableData[0] || [];

    return (
        <div className="border rounded-lg overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
                <thead>
                    <tr className="bg-muted">
                        <th className="border p-2 font-semibold w-28">Day</th>
                        {Array.from({ length: NUM_PERIODS }).map((_, index) => {
                            const currentPeriod = index + 1;
                            if (currentPeriod === breakAfterPeriod + 1) {
                                return (
                                    <React.Fragment key={`header-break-${index}`}>
                                        <th className="border p-2 font-bold bg-green-200" rowSpan={daysOfWeek.length + 1}>
                                            <div className="flex flex-col items-center">
                                                <span>BREAK</span>
                                                <span className="text-xs font-normal">({breakDuration})</span>
                                            </div>
                                        </th>
                                        <th className="border p-2 font-semibold">Period {currentPeriod}<br/>({timeSlots[index]})</th>
                                    </React.Fragment>
                                )
                            }
                             if (currentPeriod > breakAfterPeriod + 1) {
                               return <th key={`header-${index}`} className="border p-2 font-semibold">Period {currentPeriod}<br/>({timeSlots[index]})</th>
                            }
                            return <th key={`header-${index}`} className="border p-2 font-semibold">Period {currentPeriod}<br/>({timeSlots[index]})</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {daysOfWeek.map((day) => (
                        <tr key={day}>
                            <td className="border p-2 font-medium text-center">{day}</td>
                            {Array.from({ length: NUM_PERIODS }).map((_, colIndex) => {
                                const cell = classTemplate[colIndex];
                                const teacher = teachers.find(t => t.id === cell?.teacherId);
                                return (
                                    <td key={`${day}-${colIndex}`} className="border p-1 align-top">
                                        <div className="h-24 p-1 rounded-md flex flex-col justify-center items-center text-center">
                                            {cell ? (
                                                <>
                                                    <p className="text-sm font-bold">{cell.subject}</p>
                                                    <p className="text-xs text-muted-foreground">{teacher?.name}</p>
                                                </>
                                            ): <span className="text-xs text-muted-foreground">Empty</span>}
                                        </div>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><CalendarClock /> Timetable Management</h1>
      </div>
      
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
                  <CardTitle>Master School Timetable</CardTitle>
                  <CardDescription>Define the daily schedule template for all classes. This schedule will be repeated daily.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handlePrintMasterTimetable} variant="outline"><Printer className="mr-2 h-4 w-4"/> Print Master</Button>
                    <Button onClick={handleSaveAllTimetables}><Save className="mr-2 h-4 w-4"/>Save All Timetables</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <Card className="p-4 mb-4 bg-muted/50">
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
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 font-semibold sticky left-0 bg-muted z-10 w-32">Class</th>
                      {Array.from({length: NUM_PERIODS}).map((_, i) => (
                        <React.Fragment key={i}>
                          <th className="border p-2 font-semibold w-40">
                              <p>Period {i + 1}</p>
                              <Input 
                                  placeholder="e.g., 8:00" 
                                  className="h-7 text-xs mt-1" 
                                  value={getMasterTimeSlots()[i] || ''}
                                  onChange={(e) => handleTimeSlotChange(i, e.target.value)}
                              />
                          </th>
                           {i + 1 === breakAfterPeriod && (
                                <th className="border p-2 font-bold bg-green-200" rowSpan={classes.length + 1}>
                                    <div className="[writing-mode:vertical-rl] transform -rotate-180 text-lg p-2">
                                      BREAK
                                    </div>
                                </th>
                           )}
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                        <tr key={cls.id}>
                          <td className="border p-2 w-32 font-medium text-center sticky left-0 bg-background z-10">{cls.name}</td>
                          {Array.from({length: NUM_PERIODS}).map((_, periodIndex) => {
                             if (periodIndex === breakAfterPeriod) return null; // Skip rendering the break column
                             return (
                                <td key={periodIndex} className="border p-0 align-middle">
                                    <MasterTimetableCell classId={cls.id} periodIndex={periodIndex} />
                                </td>
                             )
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
                  <CardDescription>View the weekly timetable for a specific class, based on the master template.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                  <Select onValueChange={setSelectedClassId} value={selectedClassId || ''}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handlePrintClassTimetable} disabled={!selectedClassId}><Printer className="mr-2 h-4 w-4" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderTimetableGrid()}
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
                  <Button variant="outline" onClick={handlePrintTeacherSchedule} disabled={!selectedTeacherId}><Printer className="mr-2 h-4 w-4" />Print Slip</Button>
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
                                    if (i + 1 === breakAfterPeriod) {
                                         return (
                                            <React.Fragment key={i}>
                                                <th className="border p-2 font-semibold">Period {i+1}</th>
                                                <th className="border p-2 font-bold bg-green-200">BREAK</th>
                                            </React.Fragment>
                                         );
                                    }
                                    const periodNumber = i < breakAfterPeriod ? i + 1 : i;
                                    return <th key={i} className="border p-2 font-semibold">Period {periodNumber}</th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {daysOfWeek.map(day => (
                                <tr key={day}>
                                    <td className="border p-2 w-28 font-medium">{day}</td>
                                    {Array.from({length: NUM_PERIODS}).map((_, periodIndex) => {
                                        if (periodIndex + 1 === breakAfterPeriod) return null;
                                        const entry = teacherSchedule[day].find(e => e.period === (periodIndex + 1));
                                        return (
                                            <td key={periodIndex} className="border p-2 align-top h-24">
                                                {entry ? (
                                                    <div className="text-xs">
                                                        <p className="font-bold">{entry.class}</p>
                                                        <p>{entry.subject}</p>
                                                        <p className="text-muted-foreground">{entry.time}</p>
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
    </div>
  );
}
