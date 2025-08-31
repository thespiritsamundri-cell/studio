
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, BookOpenCheck, DollarSign, Users, CalendarIcon, Loader2 } from 'lucide-react';
import { students as allStudents, fees as allFees, families } from '@/lib/data';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import { IncomePrintReport } from '@/components/reports/income-report';
import { AttendancePrintReport } from '@/components/reports/attendance-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Student, Fee } from '@/lib/types';


export default function ReportsPage() {
    const printRef = useRef<HTMLDivElement>(null);
    const [reportType, setReportType] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    // States for Attendance Report
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [attendanceDate, setAttendanceDate] = useState<Date>(new Date());
    const [studentsForAttendance, setStudentsForAttendance] = useState<Student[]>([]);
    const [isGeneratingAttendance, setIsGeneratingAttendance] = useState(false);

    // States for Fee Report
    const [paidFees, setPaidFees] = useState<(Fee & {fatherName?: string})[]>([]);
    const [totalIncome, setTotalIncome] = useState(0);
    
    useEffect(() => {
        if (isPrinting) {
            window.print();
            setIsPrinting(false);
            // Reset report data after printing if needed
            // setReportType(null); 
        }
    }, [isPrinting]);

    const handlePrint = (type: string) => {
        setReportType(type);

        if (type === 'students') {
            setIsPrinting(true);
        } else if (type === 'fees') {
            const feesWithFatherName = allFees
                .filter(fee => fee.status === 'Paid')
                .map(fee => {
                    const family = families.find(f => f.id === fee.familyId);
                    return { ...fee, fatherName: family?.fatherName || 'N/A' };
                });
            setPaidFees(feesWithFatherName);
            setTotalIncome(feesWithFatherName.reduce((acc, fee) => acc + fee.amount, 0));
            setIsPrinting(true);

        } else if (type === 'attendance') {
            if (!selectedClass) {
                alert('Please select a class first.');
                return;
            }
            setIsGeneratingAttendance(true);
            // Simulate fetching and generating attendance
            setTimeout(() => {
                const classStudents = allStudents.filter(s => s.class === selectedClass);
                setStudentsForAttendance(classStudents);
                setIsGeneratingAttendance(false);
                setIsPrinting(true);
            }, 500);
        }
    };
    
    const getMockAttendance = () => {
        const attendance: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
        studentsForAttendance.forEach(s => {
            const rand = Math.random();
            if (rand < 0.9) attendance[s.id] = 'Present';
            else if (rand < 0.95) attendance[s.id] = 'Absent';
            else attendance[s.id] = 'Leave';
        });
        return attendance;
    }

  return (
    <div className="space-y-6">
       <div className="hidden print:block">
        <div ref={printRef}>
            {reportType === 'students' && <AllStudentsPrintReport students={allStudents} date={new Date()} />}
            {reportType === 'fees' && <IncomePrintReport fees={paidFees} totalIncome={totalIncome} />}
            {reportType === 'attendance' && selectedClass && <AttendancePrintReport className={selectedClass} date={attendanceDate} students={studentsForAttendance} attendance={getMockAttendance()} />}
        </div>
       </div>

      <div className="print:hidden">
        <h1 className="text-3xl font-bold font-headline">Reports</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
            <Card>
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <Users className='w-8 h-8 text-primary' />
                    <div>
                        <CardTitle>Student Data Report</CardTitle>
                        <CardDescription>Export complete data of all students.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Button onClick={() => handlePrint('students')}>
                <FileDown className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <DollarSign className='w-8 h-8 text-primary' />
                    <div>
                        <CardTitle>Fee Collection Report</CardTitle>
                        <CardDescription>Reports on all fee collections.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Button onClick={() => handlePrint('fees')}>
                <FileDown className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <BookOpenCheck className='w-8 h-8 text-primary' />
                    <div>
                        <CardTitle>Attendance Report</CardTitle>
                        <CardDescription>Daily report for a selected class.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Select onValueChange={setSelectedClass} value={selectedClass || ''}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                        {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'].map(c => (
                            <SelectItem key={c} value={c}>{c} Class</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !attendanceDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {attendanceDate ? format(attendanceDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={attendanceDate}
                        onSelect={(date) => setAttendanceDate(date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                <Button onClick={() => handlePrint('attendance')} disabled={!selectedClass || isGeneratingAttendance}>
                  {isGeneratingAttendance ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generating...</> : <><FileDown className="mr-2 h-4 w-4" /> Download PDF</>}
                </Button>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
