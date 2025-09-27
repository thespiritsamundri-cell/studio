
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import type { Teacher } from '@/lib/types';
import { Loader2, School, User, BookOpen, Briefcase, Phone, Hash, Activity } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

// Public Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtnV9kiSJ-NFLfI6pG4LDvvLcjpRh_jtM",
  authDomain: "educentral-mxfgr.firebaseapp.com",
  projectId: "educentral-mxfgr",
  storageBucket: "educentral-mxfgr.appspot.com",
  messagingSenderId: "93439797301",
  appId: "1:93439797301:web:c0cd1d46e7588e4df4297c"
};

const publicApp = !getApps().some(app => app.name === 'public-teacher') ? initializeApp(firebaseConfig, 'public-teacher') : getApp('public-teacher');
const publicDb = getFirestore(publicApp);

export default function PublicTeacherProfilePage() {
    const params = useParams();
    const { id } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !isSettingsInitialized) return;

        const loadTeacherData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const teacherId = id as string;
                const teacherDocRef = doc(publicDb, "teachers", teacherId);
                const teacherDoc = await getDoc(teacherDocRef);

                if (!teacherDoc.exists()) {
                   throw new Error(`Teacher with ID "${teacherId}" not found.`);
                }
                
                setTeacher({ id: teacherDoc.id, ...teacherDoc.data() } as Teacher);

            } catch (err: any) {
                console.error("Error loading teacher data:", err);
                setError(err.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadTeacherData();

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
    
    if (error || !teacher) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive text-center p-4">{error || "Teacher data could not be loaded."}</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden">
                <div className="bg-primary/10 p-6 text-center border-b-2 border-primary relative h-32">
                     <div className="absolute top-4 left-4 flex items-center gap-2">
                        {settings.schoolLogo && (
                            <Image src={settings.schoolLogo} alt="School Logo" width={40} height={40} className="rounded-full"/>
                        )}
                        <div>
                             <h1 className="text-lg font-bold text-foreground dark:text-white text-left">{settings.schoolName}</h1>
                             <p className="text-xs text-muted-foreground text-left">{settings.schoolAddress}</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 space-y-6 -mt-16">
                    <div className="flex flex-col items-center gap-4">
                        <Image src={teacher.photoUrl} alt={teacher.name} width={128} height={128} className="rounded-full object-cover border-4 border-white shadow-lg"/>
                        <div className="text-center mt-2">
                            <h2 className="text-3xl font-bold text-foreground">{teacher.name}</h2>
                            <p className="text-md text-muted-foreground">Teacher Profile</p>
                        </div>
                    </div>
                     <Table>
                       <TableBody>
                            <InfoRow label="Teacher ID" value={teacher.id} />
                            <InfoRow label="Father's Name" value={teacher.fatherName} />
                            <InfoRow label="Contact" value={teacher.phone} />
                            <InfoRow label="Education" value={teacher.education} />
                            <InfoRow label="Assigned Subjects" value={teacher.assignedSubjects?.join(', ')} />
                            <InfoRow label="Status">
                                <Badge variant={teacher.status === 'Active' ? 'default' : 'destructive'} className={teacher.status === 'Active' ? 'bg-green-600' : ''}>
                                    {teacher.status}
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
