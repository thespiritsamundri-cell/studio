
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fees as allFees, families } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function IncomePage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [familyIdFilter, setFamilyIdFilter] = useState('');

  const paidFees = useMemo(() => {
    return allFees
      .filter((fee) => fee.status === 'Paid')
      .map(fee => {
        const family = families.find(f => f.id === fee.familyId);
        return { ...fee, fatherName: family?.fatherName || 'N/A' };
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, []);

  const filteredFees = useMemo(() => {
    let fees = paidFees;

    if (familyIdFilter) {
      fees = fees.filter(fee => fee.familyId.toLowerCase().includes(familyIdFilter.toLowerCase()));
    }

    if (dateRange?.from && dateRange?.to) {
      fees = fees.filter(fee => {
        const paymentDate = new Date(fee.paymentDate);
        return paymentDate >= dateRange.from! && paymentDate <= dateRange.to!;
      });
    } else if (dateRange?.from) {
        fees = fees.filter(fee => {
            const paymentDate = new Date(fee.paymentDate);
            return format(paymentDate, 'yyyy-MM-dd') === format(dateRange.from!, 'yyyy-MM-dd');
        });
    }

    return fees;
  }, [paidFees, dateRange, familyIdFilter]);
  
  const totalIncome = useMemo(() => {
      return filteredFees.reduce((acc, fee) => acc + fee.amount, 0);
  }, [filteredFees]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Income</h1>

      <Card>
        <CardHeader>
          <CardTitle>Income Report</CardTitle>
          <CardDescription>View a detailed history of all collected fees. Total income for selection: PKR {totalIncome.toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Input
              placeholder="Filter by Family ID..."
              value={familyIdFilter}
              onChange={(e) => setFamilyIdFilter(e.target.value)}
              className="max-w-sm"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
             <Button onClick={() => { setDateRange(undefined); setFamilyIdFilter(''); }}>Clear Filters</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan ID</TableHead>
                <TableHead>Family ID</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead className="text-right">Amount (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.id}</TableCell>
                  <TableCell className="font-medium">{fee.familyId}</TableCell>
                  <TableCell>{fee.fatherName}</TableCell>
                  <TableCell>{format(new Date(fee.paymentDate), 'PPP')}</TableCell>
                  <TableCell>{fee.month}, {fee.year}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{fee.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {filteredFees.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className='text-center py-10 text-muted-foreground'>No income records found for the selected filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
