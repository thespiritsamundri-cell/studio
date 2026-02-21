'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import type { Student, Family } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  families: Family[];
  query: string;
}

export function SearchResultsDialog({ open, onOpenChange, students, families, query }: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Results for "{query}"</DialogTitle>
          <DialogDescription>
            Found {students.length} student(s) and {families.length} family(ies).
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          {students.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Students</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={`student-${student.id}`}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="link" onClick={() => onOpenChange(false)}>
                            <Link href={`/students/details/${student.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {families.length > 0 && (
             <div>
              <h3 className="font-semibold mb-2">Families</h3>
              <Table>
                 <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {families.map(family => (
                    <TableRow key={`family-${family.id}`}>
                      <TableCell>{family.id}</TableCell>
                      <TableCell>{family.fatherName}</TableCell>
                      <TableCell>{family.phone}</TableCell>
                       <TableCell className="text-right">
                        <Button asChild variant="link" onClick={() => onOpenChange(false)}>
                            <Link href={`/families?search=${family.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {students.length === 0 && families.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No results found.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
