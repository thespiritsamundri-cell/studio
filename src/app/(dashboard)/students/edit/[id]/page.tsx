
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/data-context';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Student, Alumni } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { uploadFile } from '@/services/storage-service';

const MALE_AVATAR_URL = 'https://i.postimg.cc/x1BZ31bs/male.png';
const FEMALE_AVATAR_URL = 'https://i.postimg.cc/7hgPwR8W/1487318.png';
const NEUTRAL_AVATAR_URL = 'https://i.postimg.cc/3Jp4JMfC/avatar-placeholder.png';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const { students, alumni, updateStudent, updateAlumni, classes } = useData();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | Alumni | undefined>(undefined);
  const [isAlumnus, setIsAlumnus] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const studentId = params.id as string;
    let studentData = students.find((s) => s.id === studentId);
    if (studentData) {
      setStudent(studentData);
      setIsAlumnus(false);
    } else {
      let alumniData = alumni.find((a) => a.id === studentId);
      if (alumniData) {
        setStudent(alumniData);
        setIsAlumnus(true);
      }
    }
  }, [params.id, students, alumni]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    let finalStudentData = { ...student };
    
    if (photoFile) {
        try {
            const downloadURL = await uploadFile(photoFile, `students/${student.id}/${photoFile.name}`);
            finalStudentData.photoUrl = downloadURL;
            // Also update the state for the UI to reflect the new permanent URL
            setStudent(prev => prev ? { ...prev, photoUrl: downloadURL } : undefined);
        } catch (error: any) {
            toast({ title: "Photo Upload Failed", description: error.message, variant: "destructive" });
            // Continue with saving other data even if photo upload fails
        }
    }
    
    if (isAlumnus) {
      await updateAlumni(student.id, finalStudentData as Alumni & { status?: Student['status'] });
      toast({
        title: 'Alumnus Updated',
        description: `${student?.name}'s information has been successfully updated.`,
      });
      // Redirect based on whether the student was reactivated or not
      const newStatus = 'status' in student ? student.status : 'Graduated';
      if (newStatus !== 'Graduated') {
          router.push('/students');
      } else {
          router.push('/alumni');
      }
    } else {
      await updateStudent(student.id, finalStudentData as Student);
      toast({
        title: 'Student Updated',
        description: `${student?.name}'s information has been successfully updated.`,
      });
      // Redirect based on whether the student was graduated or not
      if (student.status === 'Graduated') {
          router.push('/alumni');
      } else {
          router.push('/students');
      }
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setStudent(prev => prev ? { ...prev, [id]: value } : undefined);
  }

  const handleSelectChange = (id: keyof (Student | Alumni)) => (value: string) => {
    setStudent(prev => prev ? { ...prev, [id]: value } : undefined);
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setPhotoFile(file); // Store the file object for upload
        // Create a temporary URL for immediate preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setStudent(prev => prev ? { ...prev, photoUrl: event.target?.result as string } : undefined);
        };
        reader.readAsDataURL(file);
    }
  };

  const availableSections = student ? classes.find(c => c.name === student.class)?.sections || [] : [];


  if (!student) {
    return <div>Loading...</div>;
  }
  
  const currentStatus = 'status' in student ? student.status : 'Graduated';
  const photoUrl = student.photoUrl || (student.gender === 'Male' ? MALE_AVATAR_URL : student.gender === 'Female' ? FEMALE_AVATAR_URL : NEUTRAL_AVATAR_URL);


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
                src={photoUrl}
                width="80"
                data-ai-hint="student photo"
            />
            <div>
                <CardTitle className="flex items-center gap-2">{student.name} <Badge variant={currentStatus === 'Active' ? 'default' : 'destructive'} className={currentStatus === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>{currentStatus}</Badge></CardTitle>
                <CardDescription>Update the student's information below.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <Label htmlFor="gender">Gender</Label>
                <Select value={student.gender} onValueChange={handleSelectChange('gender')}>
                    <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="cnic">Student CNIC / B-Form</Label>
                <Input id="cnic" value={student.cnic || ''} onChange={handleInputChange} placeholder="e.g. 12345-1234567-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={student.class} onValueChange={handleSelectChange('class')}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select value={student.section} onValueChange={handleSelectChange('section')} disabled={!student.class || availableSections.length === 0}>
                    <SelectTrigger id="section">
                        <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableSections.map((section) => (
                            <SelectItem key={section} value={section}>{section}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={currentStatus} onValueChange={handleSelectChange('status')}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
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
             <div className="space-y-2">
                <Label htmlFor="alternatePhone">Alternate Phone</Label>
                <Input id="alternatePhone" value={student.alternatePhone || ''} onChange={handleInputChange} placeholder="Enter alternate number" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={student.address} onChange={handleInputChange} placeholder="Enter residential address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photoUrl">Student Photo</Label>
              <Input id="photoUrl" type="file" className="file:text-primary file:font-medium" onChange={handlePhotoChange} accept="image/*" />
            </div>
            <div className="flex justify-end gap-2 lg:col-span-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
