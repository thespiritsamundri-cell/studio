
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, CalendarClock, User, BookOpen, Clock, Users, Save, MoreVertical, Trash2 } from 'lucide-react';
import type { Timetable, TimetableData, TimetableCell } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { TimetablePrint } from '@/components/reports/timetable-print';
import { TeacherSchedulePrint } from '@/components/reports/teacher-schedule-print';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [timetableData, setTimetableData] = useState<TimetableData>([]);
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
        const emptyData: TimetableCell[] = Array(NUM_PERIODS).fill(null);
        initialMaster[c.id] = { classId: c.id, data: emptyData, timeSlots: Array(NUM_PERIODS).fill('') };
      }
    });
    setMasterTimetableData(initialMaster);

    // Set global time/break settings from the first available timetable or defaults
    const firstTimetable = timetables[0];
    if (firstTimetable) {
        setBreakAfterPeriod(firstTimetable.breakAfterPeriod || 4);
        setBreakDuration(firstTimetable.breakDuration || '30 minutes');
    }
  }, [classes, timetables]);


  const handleMasterCellChange = (classId: string, periodIndex: number, value: TimetableCell | null) => {
    setMasterTimetableData(prev => {
        const newMaster = { ...prev };
        const newTimetable = { ...newMaster[classId] };
        const newData = [...newTimetable.data];
        newData[periodIndex] = value;
        newTimetable.data = newData;
        newMaster[classId] = newTimetable;
        return newMaster;
    });
  }

  const handleTimeSlotChange = (classId: string, periodIndex: number, value: string) => {
     setMasterTimetableData(prev => {
        const newMaster = { ...prev };
        Object.keys(newMaster).forEach(cId => {
            if (newMaster[cId].timeSlots) {
                newMaster[cId].timeSlots[periodIndex] = value;
            } else {
                const newTimeSlots = Array(NUM_PERIODS).fill('');
                newTimeSlots[periodIndex] = value;
                newMaster[cId].timeSlots = newTimeSlots;
            }
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
      const existingTimetable = timetables.find(t => t.classId === selectedClassId);
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
  }, [selectedClassId, timetables, classes]);
  
  const handleSaveTimetable = () => {
    if (!selectedClassId) return;
    const classData = timetableData[0]; // Since it's a template, all days are the same
    updateTimetable(selectedClassId, classData, timeSlots);
    toast({
      title: "Timetable Saved",
      description: `The timetable for the selected class has been updated.`,
    });
  };

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
    // Sort periods for each day
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
  
  const MasterTimetableCell = ({classId, periodIndex}: {classId: string, periodIndex: number}) => {
      const classInfo = classes.find(c => c.id === classId);
      const cellData = masterTimetableData[classId]?.data[periodIndex];
      const assignedTeacher = teachers.find(t => t.id === cellData?.teacherId);
      const [selectedSubject, setSelectedSubject] = useState(cellData?.subject || '');

      const handleSelect = (subject: string, teacherId: string) => {
          handleMasterCellChange(classId, periodIndex, { subject, teacherId });
      }
      
      const getTeachersForSubject = (subject: string) => {
          return teachers.filter(t => t.assignedSubjects?.includes(subject));
      }

      return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="h-20 w-full p-1 cursor-pointer hover:bg-muted/50 rounded-md flex flex-col justify-center items-center text-center border-2 border-transparent hover:border-primary">
                    {cellData ? (
                        <>
                            <p className="text-xs font-bold text-primary">{assignedTeacher?.name || 'N/A'}</p>
                            <p className="text-[11px] text-muted-foreground">{cellData.subject}</p>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">Assign</span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2">
                <div className="space-y-2">
                    <h4 className="font-medium text-sm">Assign Period</h4>
                    <Select onValueChange={setSelectedSubject} defaultValue={selectedSubject}>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>
                             {(classInfo?.subjects || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {selectedSubject && (
                        <Select onValueChange={(teacherId) => handleSelect(selectedSubject, teacherId)} defaultValue={cellData?.teacherId}>
                             <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                             <SelectContent>
                                {getTeachersForSubject(selectedSubject).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                             </SelectContent>
                        </Select>
                    )}
                     <Button variant="destructive" size="sm" className="w-full" onClick={() => handleMasterCellChange(classId, periodIndex, null)}>Clear</Button>
                </div>
            </PopoverContent>
        </Popover>
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
    
    const periodHeaders = Array.from({ length: NUM_PERIODS }, (_, i) => `Period ${i + 1}`);
    const classTemplate = timetableData[0]; // All days use the same template

    return (
        <div className="border rounded-lg overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
                <thead>
                    <tr className="bg-muted">
                        <th className="border p-2 font-semibold">Day</th>
                        {periodHeaders.map((header, index) => {
                            if (index + 1 === breakAfterPeriod) {
                                return (
                                    <React.Fragment key={header}>
                                        <th className="border p-2 font-semibold">{header}<br/>({timeSlots[index]})</th>
                                        <th className="border p-2 font-bold bg-green-200" rowSpan={daysOfWeek.length + 1}>BREAK</th>
                                    </React.Fragment>
                                )
                            }
                            if (index + 1 > breakAfterPeriod) {
                               return <th key={header} className="border p-2 font-semibold">{`Period ${index}`}<br/>({timeSlots[index-1]})</th>
                            }
                            return <th key={header} className="border p-2 font-semibold">{header}<br/>({timeSlots[index]})</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {daysOfWeek.map((day, dayIndex) => {
                        return (
                            <tr key={day}>
                                <td className="border p-2 w-28 font-medium text-center">{day}</td>
                                {classTemplate?.map((cell, colIndex) => {
                                    const teacher = teachers.find(t => t.id === cell?.teacherId);
                                    return (
                                        <td key={colIndex} className="border p-1 align-top">
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
                                }).filter((_, i) => i !== breakAfterPeriod-1)}
                            </tr>
                        )
                    })}
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
                  <CardDescription>Define the daily schedule template for all classes. Changes here will apply to all days of the week.</CardDescription>
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
                      <th className="border p-2 font-semibold sticky left-0 bg-muted z-10">Class</th>
                      {Array.from({length: NUM_PERIODS}).map((_, i) => (
                        <th key={i} className="border p-2 font-semibold">
                            <p>Period {i + 1}</p>
                            <Input 
                                placeholder="e.g., 8:00" 
                                className="h-7 text-xs mt-1" 
                                value={getMasterTimeSlots()[i]}
                                onChange={(e) => handleTimeSlotChange(classes[0]?.id, i, e.target.value)}
                            />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls, classIndex) => (
                        <tr key={cls.id}>
                          <td className="border p-2 w-28 font-medium text-center sticky left-0 bg-background z-10">{cls.name}</td>
                          {Array.from({length: NUM_PERIODS}).map((_, periodIndex) => (
                            <td key={periodIndex} className="border p-0 align-middle">
                               <MasterTimetableCell classId={cls.id} periodIndex={periodIndex} />
                            </td>
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
                                    if (i + 1 > breakAfterPeriod) {
                                        return <th key={i} className="border p-2 font-semibold">Period {i}</th>
                                    }
                                    return <th key={i} className="border p-2 font-semibold">Period {i+1}</th>
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {daysOfWeek.map(day => (
                                <tr key={day}>
                                    <td className="border p-2 w-28 font-medium">{day}</td>
                                    {Array.from({length: NUM_PERIODS}).map((_, periodIndex) => {
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
                                    }).filter((_, i) => i !== breakAfterPeriod)}
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
