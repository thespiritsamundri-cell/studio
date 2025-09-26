
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import type { Student } from '@/lib/types';
import { Loader2, School, User, BookOpen, Calendar, Hash, Home, Activity } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';


export default function PublicStudentProfilePage() {
    const params = useParams();
    const { id } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [student, setStudent] = useState<Student | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !isSettingsInitialized) return;

        const loadStudentData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const studentId = id as string;
                const studentDocRef = doc(db, "students", studentId);
                const studentDoc = await getDoc(studentDocRef);

                if (!studentDoc.exists()) {
                   throw new Error(`Student with ID "${studentId}" not found.`);
                }
                
                setStudent({ id: studentDoc.id, ...studentDoc.data() } as Student);

            } catch (err: any) {
                console.error("Error loading student data:", err);
                setError(err.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadStudentData();

    }, [id, isSettingsInitialized]);
    
    if (isLoading || !isSettingsInitialized) {
        return (
            <div className="flex flex-col h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                {settings.schoolLogo ? (
                    <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="rounded-full mb-4"/>
                ) : (
                    <School className="h-12 w-12 text-primary mb-4" />
                )}
                <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-3 text-lg">Please wait...</p>
                </div>
            </div>
        );
    }
    
    if (error || !student) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive text-center p-4">{error || "Student data could not be loaded."}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
                <div className="bg-primary/10 p-6 text-center border-b-2 border-primary">
                    {settings.schoolLogo && (
                        <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="mx-auto rounded-full mb-2"/>
                    )}
                    <h1 className="text-2xl font-bold text-foreground dark:text-white">{settings.schoolName}</h1>
                    <p className="text-sm text-muted-foreground">{settings.schoolAddress}</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <Image src={student.photoUrl} alt={student.name} width={120} height={120} className="rounded-full object-cover border-4 border-primary/20 shadow-md"/>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-foreground">{student.name}</h2>
                            <p className="text-md text-muted-foreground">Student Profile</p>
                        </div>
                    </div>
                    <Table>
                        <TableBody>
                            <InfoRow label="Student ID" value={student.id} />
                            <InfoRow label="Class" value={`${student.class} ${student.section ? `(${student.section})` : ''}`} />
                            <InfoRow label="Father's Name" value={student.fatherName} />
                            <InfoRow label="Family ID" value={student.familyId} />
                            <InfoRow label="Date of Birth" value={student.dob} />
                            <InfoRow label="Gender" value={student.gender} />
                            <InfoRow label="Status">
                                <Badge variant={student.status === 'Active' ? 'default' : 'destructive'} className={student.status === 'Active' ? 'bg-green-600' : ''}>
                                    {student.status}
                                </Badge>
                            </InfoRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

const InfoRow = ({ label, value, children }: { label: string, value?: string, children?: React.ReactNode }) => (
    <TableRow>
        <TableCell className="font-semibold w-1/3">{label}</TableCell>
        <TableCell>
            {value && <p className="font-medium text-foreground">{value || 'N/A'}</p>}
            {children}
        </TableCell>
    </TableRow>
);
