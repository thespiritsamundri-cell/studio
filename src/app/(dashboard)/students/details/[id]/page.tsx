
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { Student, Family } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ArrowLeft, Printer } from 'lucide-react';
import { StudentDetailsPrint } from '@/components/reports/student-details-report';
import { useReactToPrint } from 'react-to-print';

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { students, families } = useData();
  const [student, setStudent] = useState<Student | undefined>(undefined);
  const [family, setFamily] = useState<Family | undefined>(undefined);
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  useEffect(() => {
    const id = params.id as string;
    const studentData = students.find((s) => s.id === id);
    if (studentData) {
      setStudent(studentData);
      const familyData = families.find((f) => f.id === studentData.familyId);
      setFamily(familyData);
    } else {
      // notFound(); We can't use this as it throws an error. A simple loading/not found state is better.
    }
  }, [params.id, students, families]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onAfterPrint: () => setIsPrinting(false),
  });

  useEffect(() => {
    if (isPrinting) {
      handlePrint();
    }
  }, [isPrinting, handlePrint]);

  const triggerPrint = () => {
    setIsPrinting(true);
  };
  

  if (!student || !family) {
    return <div>Loading student details or student not found...</div>;
  }

  const DetailItem = ({ label, value }: { label: string, value: string | undefined }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="space-y-6">
       <div style={{ display: 'none' }}>
        {isPrinting && (
          <div ref={printRef}>
            <StudentDetailsPrint student={student} family={family} />
          </div>
        )}
      </div>
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold font-headline">Student Details</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/students/edit/${student.id}`)}>Edit Student</Button>
            <Button onClick={triggerPrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <Image
                alt="Student image"
                className="aspect-square rounded-lg object-cover"
                height="120"
                src={student.photoUrl}
                width="120"
                data-ai-hint="student photo"
            />
            <div className='space-y-1'>
                <CardTitle className="text-4xl">{student.name}</CardTitle>
                <CardDescription className="text-lg">Student ID: {student.id} | Class: {student.class}</CardDescription>
                <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30 w-fit' : 'w-fit'}>{student.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DetailItem label="Date of Birth" value={student.dob} />
                    <DetailItem label="Admission Date" value={student.admissionDate} />
                    <DetailItem label="Contact Number" value={student.phone} />
                    <DetailItem label="Student CNIC / B-Form" value={student.cnic} />
                    <div className="md:col-span-2">
                     <DetailItem label="Address" value={student.address} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Family Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DetailItem label="Family ID" value={student.familyId} />
                    <DetailItem label="Father's Name" value={family?.fatherName} />
                    <DetailItem label="Father's CNIC" value={family?.cnic} />
                    <DetailItem label="Family Contact" value={family?.phone} />
                    <div className="md:col-span-3">
                        <DetailItem label="Family Address" value={family?.address} />
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
