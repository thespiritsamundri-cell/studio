
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { students as allStudents } from '@/lib/data';
import type { Student } from '@/lib/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ClassesPage() {
  const classes = useMemo(() => {
    const classMap: Record<string, Student[]> = {};
    allStudents.forEach(student => {
      if (!classMap[student.class]) {
        classMap[student.class] = [];
      }
      classMap[student.class].push(student);
    });
    return Object.entries(classMap).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Classes</h1>
      <Card>
        <CardHeader>
          <CardTitle>Class Overview</CardTitle>
          <CardDescription>View all classes and the students enrolled in each.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {classes.map(([className, students]) => (
              <AccordionItem value={className} key={className}>
                <AccordionTrigger className="text-lg font-semibold">
                  <div className="flex items-center gap-4">
                    <span>{className} Class</span>
                    <Badge variant="secondary">{students.length} Students</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Photo</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <Image
                                alt="Student image"
                                className="aspect-square rounded-md object-cover"
                                height="40"
                                src={student.photoUrl}
                                width="40"
                                data-ai-hint="student photo"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.id}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>
                              <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{student.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <Link href={`/students/details/${student.id}`} className="text-primary hover:underline text-sm font-medium">
                                 View Details
                               </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
