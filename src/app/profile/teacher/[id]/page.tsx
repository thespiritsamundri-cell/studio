'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import type { Teacher } from '@/lib/types';
import { Loader2, School, User, BookOpen, Briefcase, Phone, Hash } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

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
                const teacherDocRef = doc(db, "teachers", teacherId);
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
                <div className="bg-primary/10 p-6 text-center border-b-2 border-primary">
                    {settings.schoolLogo && (
                        <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="mx-auto rounded-full mb-2"/>
                    )}
                    <h1 className="text-2xl font-bold text-primary">{settings.schoolName}</h1>
                    <p className="text-sm text-muted-foreground">{settings.schoolAddress}</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <Image src={teacher.photoUrl} alt={teacher.name} width={120} height={120} className="rounded-full object-cover border-4 border-primary/20 shadow-md"/>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-foreground">{teacher.name}</h2>
                            <p className="text-md text-muted-foreground">Teacher Profile</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4 border-t">
                        <InfoItem icon={Hash} label="Teacher ID" value={teacher.id} />
                        <InfoItem icon={User} label="Father's Name" value={teacher.fatherName} />
                        <InfoItem icon={Phone} label="Contact" value={teacher.phone} />
                        <InfoItem icon={Briefcase} label="Education" value={teacher.education} />
                        <div className="sm:col-span-2">
                          <InfoItem icon={BookOpen} label="Assigned Subjects" value={teacher.assignedSubjects?.join(', ')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
        <Icon className="w-5 h-5 text-primary mt-0.5"/>
        <div>
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="font-medium text-foreground">{value || 'N/A'}</p>
        </div>
    </div>
);
