

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Student, Family, Alumni } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ArrowLeft, Printer, QrCode, Edit, Users } from 'lucide-react';
import { StudentDetailsPrint } from '@/components/reports/student-details-report';
import { renderToString } from 'react-dom/server';
import { useSettings } from '@/context/settings-context';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { openPrintWindow } from '@/lib/print-helper';

const MALE_AVATAR_URL = 'https://i.postimg.cc/x1BZ31bs/male.png';
const FEMALE_AVATAR_URL = 'https://i.postimg.cc/7hgPwR8W/1487318.png';
const NEUTRAL_AVATAR_URL = 'https://i.postimg.cc/3Jp4JMfC/avatar-placeholder.png';

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { students, families, alumni } = useData();
  const { settings } = useSettings();
  const [student, setStudent] = useState<Student | Alumni | undefined>(undefined);
  const [family, setFamily] = useState<Family | undefined>(undefined);
  
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string>('');
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const [familyQrCodeDataUri, setFamilyQrCodeDataUri] = useState<string>('');
  const [openFamilyQrDialog, setOpenFamilyQrDialog] = useState(false);
  
  useEffect(() => {
    const id = params.id as string;
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

  const handlePrint = async () => {
    if (!student || !family) return;

    let familyQrCode = '';
    try {
        const content = `${window.location.origin}/profile/family/${family.id}`;
        const result = await generateQrCode({ content });
        familyQrCode = result.qrCodeDataUri;
    } catch (e) {
      console.error("Failed to generate family QR code for print", e);
    }

    const printContent = renderToString(
        <StudentDetailsPrint student={student as Student} family={family} settings={settings} familyQrCodeDataUri={familyQrCode} />
    );

    openPrintWindow(printContent, `Student Details - ${student.name}`);
  };
  
  const handleGenerateQr = async () => {
    if (!student) return;
    try {
        const content = `${window.location.origin}/profile/student/${student.id}`;
        const result = await generateQrCode({ content, logoUrl: student.photoUrl });
        setQrCodeDataUri(result.qrCodeDataUri);
        setOpenQrDialog(true);
    } catch(e) {
        console.error(e);
    }
  }

  const handleGenerateFamilyQr = async () => {
    if (!family) return;
    try {
      const content = `${window.location.origin}/profile/family/${family.id}`;
      const result = await generateQrCode({ content });
      setFamilyQrCodeDataUri(result.qrCodeDataUri);
      setOpenFamilyQrDialog(true);
    } catch (e) {
      console.error(e);
    }
  };


  if (!student || !family) {
    return <div>Loading student details or student not found...</div>;
  }
  
  const status = 'status' in student ? student.status : 'Graduated';
  const photoUrl = student.photoUrl || (student.gender === 'Male' ? MALE_AVATAR_URL : student.gender === 'Female' ? FEMALE_AVATAR_URL : NEUTRAL_AVATAR_URL);

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold font-headline">Student Details</h1>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleGenerateQr}><QrCode className="h-4 w-4 mr-2"/> Profile QR</Button>
            <Button variant="outline" onClick={handleGenerateFamilyQr}><Users className="h-4 w-4 mr-2"/> Family QR</Button>
            <Button variant="outline" onClick={() => router.push(`/students/edit/${student.id}`)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
            <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
        </div>
      </div>
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Image
                alt="Student image"
                className="aspect-square rounded-full object-cover border-4 border-background shadow-md"
                height="120"
                src={photoUrl}
                width="120"
                data-ai-hint="student photo"
            />
            <div className='space-y-1 text-center sm:text-left'>
                <CardTitle className="text-4xl font-headline">{student.name}</CardTitle>
                <CardDescription className="text-lg">Student ID: {student.id} | Class: {student.class} {student.section ? `(${student.section})` : ''}</CardDescription>
                <Badge variant={status === 'Active' ? 'default' : 'destructive'} className={status === 'Active' ? 'bg-green-500/20 text-green-700 border-green-500/30 w-fit mx-auto sm:mx-0' : 'w-fit mx-auto sm:mx-0'}>{status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Personal Information</h3>
                <Table>
                  <TableBody>
                    <InfoRow label="Date of Birth" value={student.dob} />
                    <InfoRow label="Gender" value={student.gender} />
                    <InfoRow label="Admission Date" value={student.admissionDate} />
                    <InfoRow label="Contact Number" value={student.phone} />
                    <InfoRow label="Alternate Contact" value={student.alternatePhone} />
                    <InfoRow label="Student CNIC / B-Form" value={student.cnic} />
                    <InfoRow label="Address" value={student.address} />
                  </TableBody>
                </Table>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Family Information</h3>
                 <Table>
                  <TableBody>
                    <InfoRow label="Family ID" value={student.familyId} />
                    <InfoRow label="Father's Name" value={family?.fatherName} />
                    <InfoRow label="Father's Profession" value={family?.profession} />
                    <InfoRow label="Father's CNIC" value={family?.cnic} />
                    <InfoRow label="Family Address" value={family?.address} />
                  </TableBody>
                </Table>
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
        <Dialog open={openFamilyQrDialog} onOpenChange={setOpenFamilyQrDialog}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-center">QR Code for Family of {family.fatherName}</DialogTitle>
              <DialogDescription className="text-center">
                Scan this to view a public profile for the entire family.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {familyQrCodeDataUri ? <Image src={familyQrCodeDataUri} alt="Family QR Code" width={200} height={200} /> : <p>Generating...</p>}
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

const InfoRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <TableRow>
      <TableCell className="text-sm font-medium text-muted-foreground p-2 w-1/3">{label}</TableCell>
      <TableCell className="text-base font-semibold p-2">{value || 'N/A'}</TableCell>
    </TableRow>
);
