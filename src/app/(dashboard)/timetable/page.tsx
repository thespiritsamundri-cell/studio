
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, CalendarClock, User, BookOpen } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { TimetableData } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { TimetablePrint } from '@/components/reports/timetable-print';
import { TeacherSchedulePrint } from '@/components/reports/teacher-schedule-print';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NUM_PERIODS = 8;
const NUM_DAYS = 6; // Monday to Saturday
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periodHeaders = Array.from({ length: NUM_PERIODS }, (_, i) => `Period ${i + 1}`);

export default function TimetablePage() {
  const { classes, timetables, updateTimetable, teachers } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableData>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClassId) {
      const existingTimetable = timetables.find(t => t.classId === selectedClassId);
      if (existingTimetable) {
        setTimetableData(existingTimetable.data);
      } else {
        const classInfo = classes.find(c => c.id === selectedClassId);
        const numRows = classInfo?.sections.length ? classInfo.sections.length * NUM_DAYS : NUM_DAYS;
        setTimetableData(Array.from({ length: numRows }, () => Array(NUM_PERIODS).fill('')));
      }
    } else {
      setTimetableData([]);
    }
  }, [selectedClassId, timetables, classes]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = timetableData.map((row, rIdx) => 
      rIdx === rowIndex ? row.map((cell, cIdx) => cIdx === colIndex ? value : cell) : row
    );
    setTimetableData(newData);
  };
  
  const handleSaveTimetable = () => {
    if (!selectedClassId) return;
    updateTimetable(selectedClassId, timetableData);
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
            periodHeaders={periodHeaders}
            daysOfWeek={daysOfWeek}
        />
     );
     const printWindow = window.open('', '_blank');
     if (printWindow) {
        printWindow.document.write(`<html><head><title>Timetable - ${selectedClassInfo.name}</title><script src="https://cdn.tailwindcss.com"></script></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  };
  
  const teacherSchedule = useMemo(() => {
    if (!selectedTeacherId) return null;
    const schedule: { [day: string]: { period: string; class: string; subject: string }[] } = {};
    daysOfWeek.forEach(day => schedule[day] = []);

    timetables.forEach(tt => {
      const classInfo = classes.find(c => c.id === tt.classId);
      if (!classInfo) return;

      tt.data.forEach((row, rowIndex) => {
        const dayIndex = rowIndex % NUM_DAYS;
        const day = daysOfWeek[dayIndex];
        const section = classInfo.sections.length > 0 ? classInfo.sections[Math.floor(rowIndex / NUM_DAYS)] : '';

        row.forEach((cell, colIndex) => {
          if (cell.toLowerCase().includes(teachers.find(t => t.id === selectedTeacherId)?.name.toLowerCase() || 'undefined')) {
            schedule[day].push({
              period: `Period ${colIndex + 1}`,
              class: `${classInfo.name} ${section ? `(${section})` : ''}`,
              subject: cell
            });
          }
        });
      });
    });
    return schedule;
  }, [selectedTeacherId, timetables, classes, teachers]);


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
        printWindow.document.write(`<html><head><title>Schedule - ${teacherInfo.name}</title><script src="https://cdn.tailwindcss.com"></script></head><body>${printContent}</body></html>`);
        printWindow.document.close();
        printWindow.focus();
     }
  };


  const renderTimetableGrid = () => {
    if (!selectedClassId || !selectedClassInfo) {
      return (
        <div className="flex items-center justify-center h-96 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground">Please select a class to view or create a timetable.</p>
        </div>
      );
    }

    const sections = selectedClassInfo.sections.length > 0 ? selectedClassInfo.sections : [''];
    let rowIndex = 0;

    return (
        <div className="border rounded-lg overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
                <thead>
                    <tr className="bg-muted">
                        <th className="border p-2 font-semibold">Day</th>
                        {sections.length > 1 && <th className="border p-2 font-semibold">Section</th>}
                        {periodHeaders.map(header => <th key={header} className="border p-2 font-semibold">{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {sections.map(section => (
                        daysOfWeek.map((day, dayIndex) => {
                            const currentRow = rowIndex;
                            rowIndex++;
                            return (
                                <tr key={`${section}-${day}`}>
                                    {dayIndex === 0 && <td rowSpan={NUM_DAYS} className="border p-2 align-middle text-center font-semibold w-24">{section || selectedClassInfo.name}</td>}
                                    <td className="border p-2 w-28 font-medium">{day}</td>
                                    {timetableData[currentRow]?.map((cell, colIndex) => (
                                        <td key={colIndex} className="border p-1">
                                            <Textarea
                                                value={cell}
                                                onChange={(e) => handleCellChange(currentRow, colIndex, e.target.value)}
                                                className="w-full h-20 resize-none text-xs"
                                                placeholder="Subject..."
                                            />
                                        </td>
                                    ))}
                                </tr>
                            )
                        })
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
      
      <Tabs defaultValue="class-timetable">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="class-timetable"><BookOpen className="mr-2 h-4 w-4"/>Class Timetable</TabsTrigger>
          <TabsTrigger value="teacher-schedule"><User className="mr-2 h-4 w-4"/>Teacher Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="class-timetable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Class Timetable</CardTitle>
                  <CardDescription>Select a class to create, view, or edit its weekly timetable.</CardDescription>
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
                  <Button onClick={handleSaveTimetable} disabled={!selectedClassId}>Save Timetable</Button>
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
                                {periodHeaders.map(p => <th key={p} className="border p-2 font-semibold">{p}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {daysOfWeek.map(day => (
                                <tr key={day}>
                                    <td className="border p-2 w-28 font-medium">{day}</td>
                                    {periodHeaders.map(period => {
                                        const entry = teacherSchedule[day].find(e => e.period === period);
                                        return (
                                            <td key={period} className="border p-2 align-top h-24">
                                                {entry && (
                                                    <div className="text-xs">
                                                        <p className="font-bold">{entry.class}</p>
                                                        <p>{entry.subject.replace(teachers.find(t=>t.id===selectedTeacherId)?.name || '', '')}</p>
                                                    </div>
                                                )}
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
