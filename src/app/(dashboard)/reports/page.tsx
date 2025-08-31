
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, BookOpenCheck, DollarSign, Users, CalendarIcon, Loader2, Printer } from 'lucide-react';
import { useData } from '@/context/data-context';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import { IncomePrintReport } from '@/components/reports/income-report';
import { AttendancePrintReport } from '@/components/reports/attendance-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { useToast } from '@/hooks/use-toast';

export default function ReportsPage() {
  const { students: allStudents, fees: allFees, families, classes } = useData();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [reportType, setReportType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);


  // States for Attendance Report
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(undefined);

  // Set date on client mount to avoid hydration errors
  useEffect(() => {
    setAttendanceDate(new Date());
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      setIsPrinting(false);
      setIsLoading(null);
      setReportData(null);
      setReportType(null);
    },
  });
  
  useEffect(() => {
      if (isPrinting && printRef.current) {
          setTimeout(() => {
            handlePrint();
          }, 100);
      }
  }, [isPrinting, handlePrint]);

  const generateReport = (type: string) => {
    setIsLoading(type);

    let data: any;
    if (type === 'students') {
      data = { students: allStudents, date: new Date() };
    } else if (type === 'fees') {
      const feesWithFatherName = allFees
        .filter(fee => fee.status === 'Paid' && fee.paymentDate)
        .map(fee => {
          const family = families.find(f => f.id === fee.familyId);
          return { ...fee, fatherName: family?.fatherName || 'N/A' };
        });
      data = {
        fees: feesWithFatherName,
        totalIncome: feesWithFatherName.reduce((acc, fee) => acc + fee.amount, 0),
        dateRange: undefined,
      };
    } else if (type === 'attendance') {
      if (!selectedClass) {
        toast({ title: 'Please select a class first.', variant: 'destructive' });
        setIsLoading(null);
        return;
      }
      if (!attendanceDate) {
        toast({ title: 'Please select a date first.', variant: 'destructive' });
        setIsLoading(null);
        return;
      }
      const classStudents = allStudents.filter(s => s.class === selectedClass);
      // This is mock data for demonstration
      const mockAttendance: Record<string, 'Present' | 'Absent' | 'Leave'> = {};
      classStudents.forEach(s => {
        const rand = Math.random();
        if (rand < 0.9) mockAttendance[s.id] = 'Present';
        else if (rand < 0.95) mockAttendance[s.id] = 'Absent';
        else mockAttendance[s.id] = 'Leave';
      });
      data = { className: selectedClass, date: attendanceDate, students: classStudents, attendance: mockAttendance };
    }

    setReportData(data);
    setReportType(type);
    
    // Defer printing to allow state to update and component to render
    setTimeout(() => {
      setIsPrinting(true);
    }, 100);
  };
  
  const renderReportComponent = () => {
    if (!reportData) return null;
    
    const propsWithRef = { ...reportData, ref: printRef };

    switch (reportType) {
        case 'students':
            return <AllStudentsPrintReport {...propsWithRef} />;
        case 'fees':
            return <IncomePrintReport {...propsWithRef} />;
        case 'attendance':
            return <AttendancePrintReport {...propsWithRef} />;
        default:
            return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Printable content, always in DOM but hidden */}
      <div className="hidden">
          <div ref={printRef}>
            {renderReportComponent()}
          </div>
      </div>


      {/* UI */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold font-headline">Reports</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {/* Student Report */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-4'>
                <Users className='w-8 h-8 text-primary' />
                <div>
                  <CardTitle>Student Data Report</CardTitle>
                  <CardDescription>Generate a printable report of all students.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => generateReport('students')} disabled={isLoading === 'students'}>
                {isLoading === 'students'
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Printer className="mr-2 h-4 w-4" />}
                Print Report
              </Button>
            </CardContent>
          </Card>

          {/* Fees Report */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-4'>
                <DollarSign className='w-8 h-8 text-primary' />
                <div>
                  <CardTitle>Fee Collection Report</CardTitle>
                  <CardDescription>Generate a report of all fee collections.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => generateReport('fees')} disabled={isLoading === 'fees'}>
                {isLoading === 'fees'
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Printer className="mr-2 h-4 w-4" />}
                Print Report
              </Button>
            </CardContent>
          </Card>

          {/* Attendance Report */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-4'>
                <BookOpenCheck className='w-8 h-8 text-primary' />
                <div>
                  <CardTitle>Attendance Report</CardTitle>
                  <CardDescription>Print a daily report for a selected class.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={setSelectedClass} value={selectedClass || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !attendanceDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {attendanceDate ? format(attendanceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={attendanceDate} onSelect={(date) => setAttendanceDate(date || new Date())} initialFocus />
                </PopoverContent>
              </Popover>
              <Button onClick={() => generateReport('attendance')} disabled={!selectedClass || isLoading === 'attendance'}>
                {isLoading === 'attendance'
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                  : <><Printer className="mr-2 h-4 w-4" /> Print Report</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
