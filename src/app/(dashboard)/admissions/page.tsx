
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, PlusCircle, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import type { Student, Fee, Family } from '@/lib/types';

interface CustomFee {
  id: number;
  name: string;
  amount: number;
}

export default function AdmissionsPage() {
    const { toast } = useToast();
    const { families, students, fees, addStudent, addFee } = useData();
    const [familyId, setFamilyId] = useState('');
    const [familyExists, setFamilyExists] = useState(false);
    const [foundFamily, setFoundFamily] = useState<Family | null>(null);

    // Form state for student details
    const [studentName, setStudentName] = useState('');
    const [fatherName, setFatherName] = useState('');
    const [profession, setProfession] = useState('');
    const [dob, setDob] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [studentCnic, setStudentCnic] = useState('');

    // State for dynamic fees
    const [customFees, setCustomFees] = useState<CustomFee[]>([]);
    
    useEffect(() => {
        if (foundFamily) {
            setFatherName(foundFamily.fatherName);
            setPhone(foundFamily.phone);
            setAddress(foundFamily.address);
            setProfession(foundFamily.profession || '');
        } else {
            setFatherName('');
            setPhone('');
            setAddress('');
            setProfession('');
        }
    }, [foundFamily]);
    
    const handleFamilySearch = () => {
        const family = families.find(f => f.id === familyId);
        if (family) {
            setFamilyExists(true);
            setFoundFamily(family);
            toast({
                title: 'Family Found',
                description: `Family "${family.fatherName}" is selected. You can now proceed with admission.`,
            });
        } else {
            setFamilyExists(false);
            setFoundFamily(null);
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
            cnic: studentCnic,
            photoUrl: `https://picsum.photos/seed/${newStudentId}/100/100`
        };

        let lastFeeId = fees.reduce((max, f) => {
            const idNum = parseInt(f.id.replace('FEE', ''));
            return idNum > max ? idNum : max;
        }, 0);
        
        const feesToAdd: Fee[] = [];

        // Registration Fee (One-time)
        feesToAdd.push({
            id: `FEE${String(++lastFeeId).padStart(3, '0')}`,
            familyId: familyId,
            amount: registrationFee,
            month: 'Registration', // This indicates it's a one-time registration fee
            year: new Date().getFullYear(),
            status: 'Unpaid',
            paymentDate: ''
        });

        // First Month's Tuition Fee
        feesToAdd.push({
            id: `FEE${String(++lastFeeId).padStart(3, '0')}`,
            familyId: familyId,
            amount: monthlyFee,
            month: new Date().toLocaleString('default', { month: 'long' }), // Fee for the current month
            year: new Date().getFullYear(),
            status: 'Unpaid',
            paymentDate: ''
        });

        // Custom Fees (One-time at admission)
        customFees.forEach(fee => {
            if (fee.name && fee.amount > 0) {
                 feesToAdd.push({
                    id: `FEE${String(++lastFeeId).padStart(3, '0')}`,
                    familyId: familyId,
                    amount: fee.amount,
                    month: fee.name, // Use the custom fee name as the one-time charge description
                    year: new Date().getFullYear(),
                    status: 'Unpaid',
                    paymentDate: ''
                });
            }
        });

        addStudent(newStudent);
        feesToAdd.forEach(fee => addFee(fee));
        
        toast({
            title: 'Student Admitted!',
            description: `${studentName} has been successfully admitted to ${studentClass} class.`,
        });

        // Reset form
        e.currentTarget.reset();
        setFamilyId('');
        setFamilyExists(false);
        setFoundFamily(null);
        setStudentName('');
        setDob('');
        setStudentClass('');
        setStudentCnic('');
        setCustomFees([]);
    };

    const addCustomFeeField = () => {
        setCustomFees(prev => [...prev, { id: Date.now(), name: '', amount: 0 }]);
    };

    const removeCustomFeeField = (id: number) => {
        setCustomFees(prev => prev.filter(fee => fee.id !== id));
    };

    const handleCustomFeeChange = (id: number, field: 'name' | 'amount', value: string) => {
        setCustomFees(prev => prev.map(fee => 
            fee.id === id 
                ? { ...fee, [field]: field === 'amount' ? Number(value) : value } 
                : fee
        ));
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
            {familyExists && foundFamily && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg max-w-sm">
                <p className="font-semibold text-green-800">Family Verified</p>
                <p className="text-sm text-green-700">Father's Name: {foundFamily.fatherName}</p>
                <p className="text-sm text-green-700">Father's Profession: {foundFamily.profession}</p>
                <p className="text-sm text-green-700">CNIC: {foundFamily.cnic}</p>
              </div>
            )}
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
                <Input id="student-name" name="student-name" placeholder="Enter full name" value={studentName} onChange={e => setStudentName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father-name">Father's Name</Label>
                <Input id="father-name" name="father-name" placeholder="Enter father's name" value={fatherName} onChange={e => setFatherName(e.target.value)} required readOnly={familyExists} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="profession">Father's Profession</Label>
                <Input id="profession" name="profession" placeholder="Father's Profession" value={profession} onChange={e => setProfession(e.target.value)} required readOnly={familyExists} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" name="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentCnic">Student CNIC / B-Form</Label>
                <Input id="studentCnic" name="studentCnic" placeholder="e.g. 12345-1234567-1" value={studentCnic} onChange={e => setStudentCnic(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class to Admit</Label>
                <Select name="class" onValueChange={setStudentClass} value={studentClass} required>
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
                <Input id="phone" name="phone" type="tel" placeholder="Enter contact number" value={phone} onChange={e => setPhone(e.target.value)} required readOnly={familyExists} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Student Photo</Label>
                <Input id="photo" type="file" className="file:text-primary file:font-medium" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" placeholder="Enter residential address" value={address} onChange={e => setAddress(e.target.value)} required readOnly={familyExists} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Fee Structure</CardTitle>
                <CardDescription>
                  Define the fee structure for this student. The registration fee is a one-time charge.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={addCustomFeeField}>
                  <PlusCircle className="h-4 w-4" />
                  <span className="sr-only">Add Fee Type</span>
              </Button>
            </div>
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
               {customFees.map((fee, index) => (
                    <div key={fee.id} className="grid grid-cols-10 gap-x-2">
                        <div className="space-y-2 col-span-5">
                            <Label htmlFor={`custom-fee-name-${fee.id}`}>Fee Name</Label>
                            <Input 
                                id={`custom-fee-name-${fee.id}`} 
                                name={`custom-fee-name-${index}`}
                                placeholder="e.g., Annual" 
                                value={fee.name}
                                onChange={(e) => handleCustomFeeChange(fee.id, 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 col-span-4">
                            <Label htmlFor={`custom-fee-amount-${fee.id}`}>Amount</Label>
                            <Input 
                                id={`custom-fee-amount-${fee.id}`}
                                name={`custom-fee-amount-${index}`}
                                type="number" 
                                placeholder="e.g., 3000" 
                                value={fee.amount === 0 ? '' : fee.amount}
                                onChange={(e) => handleCustomFeeChange(fee.id, 'amount', e.target.value)}
                            />
                        </div>
                        <div className="flex items-end col-span-1">
                             <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomFeeField(fee.id)}>
                                <X className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Remove</span>
                            </Button>
                        </div>
                    </div>
                ))}
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
