
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, DollarSign, Users, CalendarIcon, Loader2, Printer, UserX, FileSpreadsheet, Download } from 'lucide-react';
import { useData } from '@/context/data-context';
import { AllStudentsPrintReport } from '@/components/reports/all-students-report';
import { IncomePrintReport } from '@/components/reports/income-report';
import { AttendancePrintReport } from '@/components/reports/attendance-report';
import { UnpaidFeesPrintReport } from '@/components/reports/unpaid-fees-report';
import { StudentFinancialPrintReport, type StudentFinancialData } from '@/components/reports/student-financial-report';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import type { Family, Student, Fee } from '@/lib/types';

interface UnpaidFamilyData {
  family: Family;
  students: Student[];
  unpaidFees: Fee[];
  totalDue: number;
}

export default function ReportsPage() {
  const { students: allStudents = [], fees: allFees = [], families = [], classes = [] } = useData() || {};
  const { settings = {} } = useSettings() || {};
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Attendance states
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<Date | undefined>(new Date());

  const getStudentFinancialData = (): StudentFinancialData[] => {
      return allStudents.map(student => {
        const familyFees = allFees.filter(fee => fee.familyId === student.familyId);
        const totalDues = familyFees.reduce((acc, fee) => acc + fee.amount, 0);
        const paidFees = familyFees.filter(f => f.status === 'Paid').reduce((acc, fee) => acc + fee.amount, 0);
        const remainingDues = totalDues - paidFees;
        
        return {
          id: student.id,
          name: student.name,
          fatherName: student.fatherName,
          dob: student.dob,
          class: student.class,
          familyId: student.familyId,
          totalDues,
          paidFees,
          remainingDues
        };
      });
  }

  const generateStudentFinancialCsv = () => {
    setIsLoading('student-financial-csv');
    try {
      const headers = ['Roll Number', 'Student Name', "Father's Name", 'Date of Birth', 'Class', 'Family Number', 'Total Dues', 'Paid Fees', 'Remaining Dues'];
      const studentData = getStudentFinancialData();

      const csvRows = studentData.map(s =>
        [
          s.id,
          s.name,
          s.fatherName,
          s.dob,
          s.class,
          s.familyId,
          s.totalDues,
          s.paidFees,
          s.remainingDues
        ].join(',')
      );

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'student_financial_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast({ title: 'Report Generated', description: 'The student financial report has been downloaded.' });
    } catch (error) {
      toast({ title: 'Error Generating Report', description: 'An unexpected error occurred.', variant: 'destructive'});
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  const generateStudentFinancialPrintReport = () => {
    setIsLoading('student-financial-print');
    try {
        const studentData = getStudentFinancialData();
        const printContent = renderToString(
            <StudentFinancialPrintReport
                students={studentData}
                date={new Date()}
                settings={settings}
            />
        );
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Student Financial Report</title><script src="https://cdn.tailwindcss.com"></script></head>
                <body>${printContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
        }
        toast({ title: 'Report Generated', description: 'The student financial report is ready for printing.' });
    } catch (error) {
        toast({ title: 'Error Generating Report', variant: 'destructive' });
        console.error(error);
    } finally {
        setIsLoading(null);
    }
  }

  const generateReport = (type: string) => {
    setIsLoading(type);
    let printContent = '';
    let reportTitle = 'Report';

    setTimeout(() => {
      const currentDate = new Date();

      if (type === 'students') {
        printContent = renderToString(
          <AllStudentsPrintReport students={allStudents} date={currentDate} settings={settings} />
        );
        reportTitle = 'All Students Report';
      } else if (type === 'fees') {
        const feesWithFatherName = allFees
          .filter(fee => fee.status === 'Paid' && fee.paymentDate)
          .map(fee => {
            const family = families.find(f => f.id === fee.familyId);
            return { ...fee, fatherName: family?.fatherName || 'N/A' };
          });

        const totalIncome = feesWithFatherName.reduce((acc, fee) => acc + fee.amount, 0);
        printContent = renderToString(
          <IncomePrintReport fees={feesWithFatherName} totalIncome={totalIncome} settings={settings} />
        );
        reportTitle = 'Fee Collection Report';
      } else if (type === 'attendance') {
        if (!selectedClass || !attendanceDate) {
          toast({ title: 'Please select a class and date first.', variant: 'destructive' });
          setIsLoading(null);
          return;
        }

        const classStudents = allStudents.filter(s => s.class === selectedClass);
        const mockAttendance: Record<string, 'Present' | 'Absent' | 'Leave'> = {};

        classStudents.forEach(s => {
          const rand = Math.random();
          if (rand < 0.9) mockAttendance[s.id] = 'Present';
          else if (rand < 0.95) mockAttendance[s.id] = 'Absent';
          else mockAttendance[s.id] = 'Leave';
        });

        printContent = renderToString(
          <AttendancePrintReport
            className={selectedClass}
            date={attendanceDate}
            students={classStudents}
            attendance={mockAttendance}
            settings={settings}
          />
        );
        reportTitle = `Attendance Report - ${selectedClass}`;
      } else if (type === 'unpaid-fees') {
        const unpaidFeesByFamily: Record<string, Fee[]> = allFees
          .filter(f => f.status === 'Unpaid')
          .reduce((acc, fee) => {
            if (!acc[fee.familyId]) {
              acc[fee.familyId] = [];
            }
            acc[fee.familyId].push(fee);
            return acc;
          }, {} as Record<string, Fee[]>);

        const unpaidData: UnpaidFamilyData[] = Object.keys(unpaidFeesByFamily)
          .map(familyId => {
            const family = families.find(f => f.id === familyId);
            if (!family) return null;

            const students = allStudents.filter(s => s.familyId === familyId);
            const unpaidFees = unpaidFeesByFamily[familyId];
            const totalDue = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0);

            return { family, students, unpaidFees, totalDue };
          })
          .filter((item): item is UnpaidFamilyData => item !== null);

        const grandTotalDue = unpaidData.reduce((sum, item) => sum + item.totalDue, 0);

        printContent = renderToString(
          <UnpaidFeesPrintReport
            data={unpaidData}
            date={currentDate}
            settings={settings}
            grandTotal={grandTotalDue}
          />
        );
        reportTitle = 'Unpaid Dues Report';
      }

      if (printContent) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>${reportTitle}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link rel="stylesheet" href="/print-styles.css">
              </head>
              <body>
                ${printContent}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
        }
      }

      setIsLoading(null);
    }, 500);
  };

  return (
    <div className="space-y-6 print:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Reports</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {/* Student Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <CardTitle>All Students Report</CardTitle>
                <CardDescription>Generate a printable list of all students.</CardDescription>
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
        
        {/* Student Financial Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <CardTitle>Student Financial Report</CardTitle>
                <CardDescription>Export or print detailed student financials.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button onClick={generateStudentFinancialCsv} disabled={isLoading === 'student-financial-csv'} variant="outline">
              {isLoading === 'student-financial-csv'
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Download className="mr-2 h-4 w-4" />}
              Excel
            </Button>
             <Button onClick={generateStudentFinancialPrintReport} disabled={isLoading === 'student-financial-print'}>
              {isLoading === 'student-financial-print'
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Printer className="mr-2 h-4 w-4" />}
              Print
            </Button>
          </CardContent>
        </Card>

        {/* Fees Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-primary" />
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

        {/* Unpaid Dues Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <UserX className="w-8 h-8 text-destructive" />
              <div>
                <CardTitle>Unpaid Dues Report</CardTitle>
                <CardDescription>View a list of all families with outstanding fees.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => generateReport('unpaid-fees')}
              disabled={isLoading === 'unpaid-fees'}
            >
              {isLoading === 'unpaid-fees'
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Printer className="mr-2 h-4 w-4" />}
              Print Report
            </Button>
          </CardContent>
        </Card>

        {/* Attendance Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <BookOpenCheck className="w-8 h-8 text-primary" />
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
                <Button
                  variant="outline"
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
                  onSelect={date => setAttendanceDate(date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={() => generateReport('attendance')}
              disabled={!selectedClass || isLoading === 'attendance'}
            >
              {isLoading === 'attendance'
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                : <><Printer className="mr-2 h-4 w-4" /> Print Report</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    