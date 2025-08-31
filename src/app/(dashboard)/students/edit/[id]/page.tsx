
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { students } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Student } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | undefined>(undefined);

  useEffect(() => {
    const studentData = students.find((s) => s.id === params.id);
    if (studentData) {
      setStudent(studentData);
    } else {
      notFound();
    }
  }, [params.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically handle the form submission, e.g., send data to an API
    console.log('Updated student data:', student);
    toast({
      title: 'Student Updated',
      description: `${student?.name}'s information has been successfully updated.`,
    });
    router.push('/students');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setStudent(prev => prev ? { ...prev, [id]: value } : undefined);
  }

  const handleSelectChange = (id: keyof Student) => (value: string) => {
    setStudent(prev => prev ? { ...prev, [id]: value } : undefined);
  }

  if (!student) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Edit Student</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Image
                alt="Student image"
                className="aspect-square rounded-md object-cover"
                height="80"
                src={student.photoUrl}
                width="80"
                data-ai-hint="student photo"
            />
            <div>
                <CardTitle className="flex items-center gap-2">{student.name} <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{student.status}</Badge></CardTitle>
                <CardDescription>Update the student's information below.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name</Label>
              <Input id="name" value={student.name} onChange={handleInputChange} placeholder="Enter full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name</Label>
              <Input id="fatherName" value={student.fatherName} onChange={handleInputChange} placeholder="Enter father's name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={student.dob} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={student.class} onValueChange={handleSelectChange('class')}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i + 1} value={`${i + 1}th`}>{`${i + 1}th Class`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={student.status} onValueChange={handleSelectChange('status')}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyId">Family Number</Label>
              <Input id="familyId" value={student.familyId} onChange={handleInputChange} placeholder="Enter existing or new family number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={student.phone} onChange={handleInputChange} placeholder="Enter contact number" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={student.address} onChange={handleInputChange} placeholder="Enter residential address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Student Photo URL</Label>
              <Input id="photoUrl" value={student.photoUrl} onChange={handleInputChange} placeholder="Enter photo URL" />
            </div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
