import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown, BookOpenCheck, DollarSign, Users } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Reports</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className='flex items-center gap-4'>
                <BookOpenCheck className='w-8 h-8 text-primary' />
                <div>
                    <CardTitle>Attendance Report</CardTitle>
                    <CardDescription>Daily, weekly, or monthly reports.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button>
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
                    <CardDescription>Reports on collections and dues.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>
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
            <Button>
              <FileDown className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
