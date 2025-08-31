
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { families, students, fees } from '@/lib/data';
import type { Student, Fee } from '@/lib/types';

export default function AdmissionsPage() {
    const { toast } = useToast();
    const [familyId, setFamilyId] = useState('');
    const [familyExists, setFamilyExists] = useState(false);
    
    const handleFamilySearch = () => {
        const family = families.find(f => f.id === familyId);
        if (family) {
            setFamilyExists(true);
            toast({
                title: 'Family Found',
                description: `Family "${family.fatherName}" is selected. You can now proceed with admission.`,
            });
        } else {
            setFamilyExists(false);
            toast({
                title: 'Family Not Found',
                description: 'This family ID does not exist. Please add them from the Families page first.',
                variant: 'destructive',
            });
        }
    };

    const handleAdmission = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!familyExists) {
            toast({
                title: 'Admission Failed',
                description: 'Please search for and verify a valid family ID before admitting a student.',
                variant: 'destructive',
            });
            return;
        }

        const formData = new FormData(e.currentTarget);
        
        const studentName = formData.get('student-name') as string;
        const fatherName = formData.get('father-name') as string;
        const dob = formData.get('dob') as string;
        const studentClass = formData.get('class') as string;
        const phone = formData.get('phone') as string;
        const address = formData.get('address') as string;
        const registrationFee = Number(formData.get('registration-fee'));
        const monthlyFee = Number(formData.get('monthly-fee'));

        if (!studentName || !fatherName || !dob || !studentClass || !phone || !address || !registrationFee || !monthlyFee) {
             toast({
                title: 'Missing Information',
                description: 'Please fill out all required fields.',
                variant: 'destructive',
            });
            return;
        }

        const lastStudentId = students.reduce((max, s) => {
            const idNum = parseInt(s.id.replace('S', ''));
            return idNum > max ? idNum : max;
        }, 0);
        const newStudentId = `S${String(lastStudentId + 1).padStart(3, '0')}`;

        const newStudent: Student = {
            id: newStudentId,
            name: studentName,
            fatherName: fatherName,
            class: studentClass,
            admissionDate: new Date().toISOString().split('T')[0],
            familyId: familyId,
            status: 'Active',
            phone: phone,
            address: address,
            dob: dob,
            photoUrl: `https://picsum.photos/seed/${newStudentId}/100/100`
        };

        const lastFeeId = fees.reduce((max, f) => {
            const idNum = parseInt(f.id.replace('FEE', ''));
            return idNum > max ? idNum : max;
        }, 0);
        
        const newRegFee: Fee = {
            id: `FEE${String(lastFeeId + 1).padStart(2, '0')}`,
            familyId: familyId,
            amount: registrationFee,
            month: 'Registration',
            year: new Date().getFullYear(),
            status: 'Unpaid',
            paymentDate: ''
        };
        const newMonthlyFee: Fee = {
            id: `FEE${String(lastFeeId + 2).padStart(2, '0')}`,
            familyId: familyId,
            amount: monthlyFee,
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear(),
            status: 'Unpaid',
            paymentDate: ''
        };

        students.push(newStudent);
        fees.push(newRegFee, newMonthlyFee);
        
        toast({
            title: 'Student Admitted!',
            description: `${studentName} has been successfully admitted to ${studentClass} class.`,
        });

        e.currentTarget.reset();
        setFamilyId('');
        setFamilyExists(false);
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">New Student Admission</h1>
        <p className="text-muted-foreground">Follow the steps to enroll a new student in the school.</p>
      </div>

      <form className="space-y-8" onSubmit={handleAdmission}>
        <Card>
          <CardHeader>
            <CardTitle>Family Information</CardTitle>
            <CardDescription>
              Search for an existing family ID. If the family is new, first add them from the 'Families' page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 max-w-sm">
              <div className="flex-grow space-y-2">
                <Label htmlFor="family-id">Family Number</Label>
                <Input id="family-id" placeholder="Enter existing family number (e.g., 1)" value={familyId} onChange={(e) => setFamilyId(e.target.value)} />
              </div>
              <Button variant="outline" type="button" onClick={handleFamilySearch} disabled={!familyId}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            {familyExists && <p className="mt-2 text-sm font-medium text-green-600">Family verified. You can proceed.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Enter the personal details for the new student.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="student-name">Student Name</Label>
                <Input id="student-name" name="student-name" placeholder="Enter full name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father-name">Father's Name</Label>
                <Input id="father-name" name="father-name" placeholder="Enter father's name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class to Admit</Label>
                <Select name="class" required>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nursery">Nursery</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={`${i + 1}th`}>{`${i + 1}th Class`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" placeholder="Enter contact number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Student Photo</Label>
                <Input id="photo" type="file" className="file:text-primary file:font-medium" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="Enter residential address" required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Structure</CardTitle>
            <CardDescription>
              Define the fee structure for this student. The registration fee is a one-time charge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="registration-fee">Registration Fee (PKR)</Label>
                <Input id="registration-fee" name="registration-fee" type="number" placeholder="e.g., 5000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-fee">Monthly Tution Fee (PKR)</Label>
                <Input id="monthly-fee" name="monthly-fee" type="number" placeholder="e.g., 2500" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual-charges">Annual Charges (PKR)</Label>
                <Input id="annual-charges" name="annual-charges" type="number" placeholder="e.g., 3000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summer-peak-fee">Summer Peak Fee (PKR)</Label>
                <Input id="summer-peak-fee" name="summer-peak-fee" type="number" placeholder="e.g., 1500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg" type="submit">Admit Student</Button>
        </div>
      </form>
    </div>
  );
}

    