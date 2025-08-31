
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/lib/types';
import { School } from 'lucide-react';

interface AttendancePrintReportProps {
  className: string;
  date: Date;
  students: Student[];
  attendance: Record<string, 'Present' | 'Absent' | 'Leave'>;
}

export const AttendancePrintReport = React.forwardRef<HTMLDivElement, AttendancePrintReportProps>(
  ({ className, date, students, attendance }, ref) => {
    const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'Absent').length;
    const leaveCount = Object.values(attendance).filter(s => s === 'Leave').length;

    return (
      <div ref={ref} className="p-8 font-sans">
        <header className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-4">
            <School className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">EduCentral</h1>
              <p className="text-sm text-muted-foreground">123 Education Lane, Knowledge City, Pakistan</p>
              <p className="text-sm text-muted-foreground">Phone: +92 300 1234567</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold">Attendance Report</h2>
            <p className="text-sm">Date: {date.toLocaleDateString()}</p>
          </div>
        </header>

        <div className="my-6 flex justify-between items-center">
          <div>
              <span className="font-bold">Class:</span> {className}
          </div>
          <div className="flex gap-4 text-sm">
              <span><span className='font-bold'>Total Students:</span> {students.length}</span>
              <span className='text-green-600'><span className='font-bold'>Present:</span> {presentCount}</span>
              <span className='text-red-600'><span className='font-bold'>Absent:</span> {absentCount}</span>
              <span className='text-yellow-600'><span className='font-bold'>On Leave:</span> {leaveCount}</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Roll No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Father Name</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.fatherName}</TableCell>
                <TableCell className="text-right font-medium"
                  style={{
                      color: attendance[student.id] === 'Present' ? 'green' : attendance[student.id] === 'Absent' ? 'red' : 'orange'
                  }}
                >{attendance[student.id]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>This is a computer-generated report and does not require a signature.</p>
          <p>&copy; {new Date().getFullYear()} EduCentral. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

AttendancePrintReport.displayName = 'AttendancePrintReport';
