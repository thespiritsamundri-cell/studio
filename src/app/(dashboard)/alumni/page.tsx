
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, Search, Medal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const MALE_AVATAR_URL = 'https://i.postimg.cc/x1BZ31bs/male.png';
const FEMALE_AVATAR_URL = 'https://i.postimg.cc/7hgPwR8W/1487318.png';
const NEUTRAL_AVATAR_URL = 'https://i.postimg.cc/3Jp4JMfC/avatar-placeholder.png';

export default function AlumniPage() {
  const { alumni: allAlumni } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const alumniStudents = useMemo(() => {
    let students = allAlumni;
    if (searchQuery) {
      students = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(student.graduationYear).includes(searchQuery)
      );
    }
    return students.sort((a, b) => b.graduationYear - a.graduationYear);
  }, [allAlumni, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Medal className="w-8 h-8 text-yellow-500" /> Alumni Records
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Graduated Student Records</CardTitle>
          <CardDescription>A record of all students who have completed their studies at the school.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Search alumni by name, ID, or graduation year..."
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button><Search className="h-4 w-4 mr-2" />Search</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Graduation Year</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alumniStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Student image"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={student.photoUrl || (student.gender === 'Male' ? MALE_AVATAR_URL : student.gender === 'Female' ? FEMALE_AVATAR_URL : NEUTRAL_AVATAR_URL)}
                      width="64"
                      data-ai-hint="student photo"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.graduationYear}</TableCell>
                  <TableCell>{student.admissionDate}</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/students/details/${student.id}`}>
                        <Eye className="mr-2 h-4 w-4" /> View Profile
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {alumniStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No alumni records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
