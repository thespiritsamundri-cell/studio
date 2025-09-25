'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, Loader2, UserSquare2 } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeacherIdCardPrint } from '@/components/reports/teacher-id-card-print';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import Image from 'next/image';

export default function TeacherIdCardPage() {
  const { teachers } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeTeachers = useMemo(() => {
    return teachers.filter(t => t.status === 'Active');
  }, [teachers]);

  const handleTeacherSelection = (teacherId: string) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId) ? prev.filter(id => id !== teacherId) : [...prev, teacherId]
    );
  };
  
  const handleSelectAllTeachers = (checked: boolean) => {
    setSelectedTeacherIds(checked ? activeTeachers.map(t => t.id) : []);
  };
  
  const isAllTeachersSelected = activeTeachers.length > 0 && selectedTeacherIds.length === activeTeachers.length;

  const handlePrint = async () => {
    if (selectedTeacherIds.length === 0) {
      toast({ title: 'No Teachers Selected', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    toast({ title: "Generating ID Cards..." });

    const teachersToPrint = teachers.filter(t => selectedTeacherIds.includes(t.id));
    
    // Generate QR Codes
    const qrCodes: Record<string, string> = {};
    try {
      await Promise.all(teachersToPrint.map(async (teacher) => {
        const content = `${window.location.origin}/profile/teacher/${teacher.id}`;
        const result = await generateQrCode({ content });
        qrCodes[teacher.id] = result.qrCodeDataUri;
      }));
    } catch (error) {
       console.error("Failed to generate QR codes", error);
       toast({
        title: 'QR Code Generation Failed',
        description: 'Could not generate QR codes for the cards.',
        variant: 'destructive',
      });
    }

    setTimeout(() => {
      const printContent = renderToString(
        <TeacherIdCardPrint 
          teachers={teachersToPrint} 
          settings={settings}
          qrCodes={qrCodes}
        />
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Teacher ID Cards</title>
              <script src="https://cdn.tailwindcss.com"></script>
               <link rel="stylesheet" href="/print-styles.css">
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserSquare2 /> Teacher ID Card Generator</CardTitle>
          <CardDescription>Select teachers to generate and print their ID cards.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
              <h3 className="font-semibold text-lg">1. Select Teachers ({selectedTeacherIds.length} selected)</h3>
               <ScrollArea className="border rounded-md h-96">
                   <Table>
                    <TableHeader className="sticky top-0 bg-secondary z-10">
                        <TableRow>
                           <TableHead className="w-[50px]">
                             <Checkbox
                                onCheckedChange={(checked) => handleSelectAllTeachers(!!checked)}
                                checked={isAllTeachersSelected}
                                aria-label="Select all teachers"
                             />
                           </TableHead>
                           <TableHead className="w-[80px]">Photo</TableHead>
                           <TableHead>Teacher Name</TableHead>
                           <TableHead>Phone</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeTeachers.map(teacher => (
                            <TableRow key={teacher.id} data-state={selectedTeacherIds.includes(teacher.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedTeacherIds.includes(teacher.id)}
                                        onCheckedChange={() => handleTeacherSelection(teacher.id)}
                                        aria-label={`Select ${teacher.name}`}
                                    />
                                </TableCell>
                                <TableCell>
                                  <Image src={teacher.photoUrl} alt={teacher.name} width={40} height={40} className="rounded-full object-cover"/>
                                </TableCell>
                                <TableCell>{teacher.name}</TableCell>
                                <TableCell>{teacher.phone}</TableCell>
                            </TableRow>
                        ))}
                         {activeTeachers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No active teachers found.
                                </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                   </Table>
               </ScrollArea>
            </div>
          
           <div className="flex justify-end mt-8 pt-6 border-t">
              <Button size="lg" onClick={handlePrint} disabled={isLoading || selectedTeacherIds.length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4"/>}
                Print ID Cards ({selectedTeacherIds.length} Selected)
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
