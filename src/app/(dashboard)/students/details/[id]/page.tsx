
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Student, Family, Alumni } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ArrowLeft, Printer, QrCode } from 'lucide-react';
import { StudentDetailsPrint } from '@/components/reports/student-details-report';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { students, families, alumni } = useData();
  const { settings } = useSettings();
  const [student, setStudent] = useState<Student | Alumni | undefined>(undefined);
  const [family, setFamily] = useState<Family | undefined>(undefined);
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string>('');
  const [openQrDialog, setOpenQrDialog] = useState(false);
  
  useEffect(() => {
    const id = params.id as string;
    // Search in active students first, then in alumni
    let studentData = students.find((s) => s.id === id);
    if (!studentData) {
        studentData = alumni.find((a) => a.id === id);
    }
    
    if (studentData) {
      setStudent(studentData);
      const familyData = families.find((f) => f.id === studentData.familyId);
      setFamily(familyData);
    }
  }, [params.id, students, families, alumni]);

  const handlePrint = () => {
    if (!student || !family) return;

    const printContent = renderToString(
        <StudentDetailsPrint student={student as Student} family={family} settings={settings} />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Student Details - ${student.name}</title>
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
  
  const handleGenerateQr = async () => {
    if (!student) return;
    try {
        const content = `${window.location.origin}/profile/student/${student.id}`;
        const result = await generateQrCode({ content });
        setQrCodeDataUri(result.qrCodeDataUri);
        setOpenQrDialog(true);
    } catch(e) {
        console.error(e);
    }
  }


  if (!student || !family) {
    return <div>Loading student details or student not found...</div>;
  }
  
  const status = 'status' in student ? student.status : 'Graduated';

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold font-headline">Student Details</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateQr}><QrCode className="h-4 w-4 mr-2"/> Show QR Code</Button>
            <Button variant="outline" onClick={() => router.push(`/students/edit/${student.id}`)}>Edit Student</Button>
            <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
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
                <CardDescription className="text-lg">Student ID: {student.id} | Class: {student.class} {student.section ? `(${student.section})` : ''}</CardDescription>
                <Badge variant={status === 'Active' ? 'default' : 'destructive'} className={status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30 w-fit' : 'w-fit'}>{status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DetailItem label="Date of Birth" value={student.dob} />
                    <DetailItem label="Gender" value={student.gender} />
                    <DetailItem label="Admission Date" value={student.admissionDate} />
                    <DetailItem label="Contact Number" value={student.phone} />
                    <DetailItem label="Alternate Contact" value={student.alternatePhone} />
                    <DetailItem label="Student CNIC / B-Form" value={student.cnic} />
                    <div className="md:col-span-3">
                     <DetailItem label="Address" value={student.address} />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Family Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DetailItem label="Family ID" value={student.familyId} />
                    <DetailItem label="Father's Name" value={family?.fatherName} />
                    <DetailItem label="Father's Profession" value={family?.profession} />
                    <DetailItem label="Father's CNIC" value={family?.cnic} />
                    <div className="md:col-span-3">
                        <DetailItem label="Family Address" value={family?.address} />
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
       <Dialog open={openQrDialog} onOpenChange={setOpenQrDialog}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">Profile QR Code for {student.name}</DialogTitle>
              <DialogDescription className="text-center">
                Scan this code to view the public profile for this student.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {qrCodeDataUri ? <Image src={qrCodeDataUri} alt="Student QR Code" width={200} height={200} /> : <p>Generating...</p>}
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

const DetailItem = ({ label, value }: { label: string, value: string | undefined }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value || 'N/A'}</p>
    </div>
  );
