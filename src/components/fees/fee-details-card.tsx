
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Family, Student, Fee } from '@/lib/types';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface FeeDetailsCardProps {
    family: Family;
    students: Student[];
    fees: Fee[];
}

export function FeeDetailsCard({ family, students, fees }: FeeDetailsCardProps) {
    const unpaidFees = fees.filter(f => f.status === 'Unpaid');
    const totalDues = unpaidFees.reduce((acc, fee) => acc + fee.amount, 0);

    return (
        <Card>
            <CardHeader>
                <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle>Fee Details for Family: {family.id}</CardTitle>
                        <CardDescription>Father&apos;s Name: {family.fatherName} | Phone: {family.phone}</CardDescription>
                    </div>
                    <div className='text-right'>
                        <p className='text-sm text-muted-foreground'>Total Dues</p>
                        <p className='text-2xl font-bold text-destructive'>PKR {totalDues.toLocaleString()}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-lg font-semibold mb-2">Students</h3>
                <div className="border rounded-md mb-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.id}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>{student.class}</TableCell>
                                    <TableCell><Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{student.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <h3 className="text-lg font-semibold mb-2">Outstanding Fee Challans</h3>
                 <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Challan ID</TableHead>
                                <TableHead>Month/Year</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount (PKR)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {unpaidFees.length > 0 ? (
                                unpaidFees.map(fee => (
                                    <TableRow key={fee.id}>
                                        <TableCell>{fee.id}</TableCell>
                                        <TableCell>{fee.month}, {fee.year}</TableCell>
                                        <TableCell><Badge variant="destructive">{fee.status}</Badge></TableCell>
                                        <TableCell className="text-right font-medium">{fee.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">No outstanding fees found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <Separator className="my-6" />

                <div className="flex justify-end gap-4">
                    <Button variant="outline">Add Annual Charges</Button>
                    <Button variant="outline">Add Summer Peak Fee</Button>
                    <Button disabled={totalDues === 0}>Collect Fee &amp; Print Receipt</Button>
                </div>

            </CardContent>
        </Card>
    );
}
