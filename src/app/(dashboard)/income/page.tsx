
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Printer, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { IncomePrintReport } from '@/components/reports/income-report';
import { renderToString } from 'react-dom/server';


export default function IncomePage() {
  const { fees: allFees, families } = useData();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [familyIdFilter, setFamilyIdFilter] = useState('');

  const paidFees = useMemo(() => {
    return allFees
      .filter((fee) => fee.status === 'Paid' && fee.paymentDate)
      .map(fee => {
        const family = families.find(f => f.id === fee.familyId);
        return { ...fee, fatherName: family?.fatherName || 'N/A' };
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [allFees, families]);

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
  
  const triggerPrint = () => {
    const printContent = renderToString(
      <IncomePrintReport fees={filteredFees} totalIncome={totalIncome} dateRange={dateRange} />
    );
    const printWindow = window.open('', '_blank');
    if(printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Income Report</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleExportCsv = () => {
    const headers = ['Challan ID', 'Family ID', "Father's Name", 'Payment Date', 'Month', 'Year', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...filteredFees.map((fee) => 
        [
          fee.id,
          fee.familyId,
          `"${fee.fatherName}"`,
          fee.paymentDate ? format(new Date(fee.paymentDate), 'yyyy-MM-dd') : '',
          fee.month,
          fee.year,
          fee.amount
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'income-report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold font-headline">Income</h1>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Income Report</CardTitle>
            <CardDescription>View a detailed history of all collected fees. Total income for selection: PKR {totalIncome.toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-4 flex-grow">
                  <Input
                    placeholder="Filter by Family ID..."
                    value={familyIdFilter}
                    onChange={(e) => setFamilyIdFilter(e.target.value)}
                    className="max-w-xs"
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
                  <Button variant="ghost" onClick={() => { setDateRange(undefined); setFamilyIdFilter(''); }}>Clear Filters</Button>
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={triggerPrint}><Printer className="mr-2 h-4 w-4" />Print Report</Button>
                  <Button variant="outline" onClick={handleExportCsv}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel Export</Button>
              </div>
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
                    <TableCell>{fee.paymentDate && format(new Date(fee.paymentDate), 'PPP')}</TableCell>
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
    </div>
  );
}
