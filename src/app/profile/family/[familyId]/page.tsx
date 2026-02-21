
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import type { Student, Family, Fee } from '@/lib/types';
import { Loader2, School, User, Home, Phone, Hash, Users, Wallet, Calendar } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocs, getDoc, collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Public Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtnV9kiSJ-NFLfI6pG4LDvvLcjpRh_jtM",
  authDomain: "educentral-mxfgr.firebaseapp.com",
  projectId: "educentral-mxfgr",
  storageBucket: "educentral-mxfgr.appspot.com",
  messagingSenderId: "93439797301",
  appId: "1:93439797301:web:c0cd1d46e7588e4df4297c"
};

const publicApp = !getApps().some(app => app.name === 'public-family') ? initializeApp(firebaseConfig, 'public-family') : getApp('public-family');
const publicDb = getFirestore(publicApp);

interface FamilyStudent extends Student {
    fees: Fee[];
    totalDues: number;
}

interface FamilyProfileData {
    family: Family;
    students: FamilyStudent[];
}

export default function PublicFamilyProfilePage() {
    const params = useParams();
    const { familyId } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [profileData, setProfileData] = useState<FamilyProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!familyId || !isSettingsInitialized) return;

        const loadFamilyData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const id = familyId as string;
                
                const familyDocRef = doc(publicDb, "families", id);
                const familyDoc = await getDoc(familyDocRef);

                if (!familyDoc.exists()) {
                   throw new Error(`Family with ID "${id}" not found.`);
                }
                const familyData = { id: familyDoc.id, ...familyDoc.data() } as Family;
                
                // Fetch all students for this family
                const studentsQuery = query(collection(publicDb, "students"), where("familyId", "==", id));
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentsData = studentsSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Student));

                // Fetch all fees for this family
                const feesQuery = query(collection(publicDb, "fees"), where("familyId", "==", id));
                const feesSnapshot = await getDocs(feesQuery);
                const allFamilyFees = feesSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Fee));
                
                const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                allFamilyFees.sort((a, b) => {
                    if (a.year !== b.year) {
                        return a.year - b.year; // Sort by year ascending
                    }
                     if (a.month === 'Registration' || b.month === 'Registration') {
                        return a.month === 'Registration' ? -1 : 1;
                    }
                    const aMonthIndex = monthOrder.indexOf(a.month);
                    const bMonthIndex = monthOrder.indexOf(b.month);
                    
                    return aMonthIndex - bMonthIndex; // Sort by month ascending
                });
                
                const studentsWithFees: FamilyStudent[] = studentsData.map(student => {
                    const studentFees = allFamilyFees.filter(fee => {
                        // A simple heuristic, can be improved. This assumes a fee applies to a student if their class matches.
                        // For a more robust system, fees should be linked to student IDs.
                        return true; 
                    });
                     const totalDues = studentFees
                        .filter(f => f.status === 'Unpaid')
                        .reduce((sum, fee) => sum + fee.amount, 0);
                    return { ...student, fees: studentFees, totalDues };
                });

                setProfileData({ family: familyData, students: studentsWithFees });

            } catch (err: any) {
                console.error("Error loading family data:", err);
                setError(err.message || "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        loadFamilyData();

    }, [familyId, isSettingsInitialized]);
    
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
                    <p className="ml-3 text-lg">Loading Family Profile...</p>
                </div>
            </div>
        );
    }
    
    if (error || !profileData) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive text-center p-4">{error || "Family data could not be loaded."}</p>
            </div>
        );
    }
    
    const { family, students } = profileData;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
            <Card className="w-full max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-primary/10 p-6 text-center border-b-2 border-primary">
                    {settings.schoolLogo && (
                        <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="mx-auto rounded-full mb-2"/>
                    )}
                    <h1 className="text-2xl font-bold text-foreground dark:text-white">{settings.schoolName}</h1>
                    <p className="text-sm text-muted-foreground">{settings.schoolAddress}</p>
                    <p className="text-sm text-muted-foreground">Phone: {settings.schoolPhone}</p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="p-4 rounded-lg bg-muted/50 border mb-6">
                        <h2 className="text-xl font-bold text-foreground mb-2">Family Profile</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <InfoItem icon={User} label="Father's Name" value={family.fatherName} />
                            <InfoItem icon={Hash} label="Family ID" value={family.id} />
                            <InfoItem icon={Phone} label="Contact" value={family.phone} />
                            <InfoItem icon={Home} label="Address" value={family.address} className="md:col-span-3"/>
                        </div>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full" defaultValue={students[0]?.id}>
                        {students.map(student => (
                            <AccordionItem value={student.id} key={student.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4">
                                        <Image src={student.photoUrl || `https://picsum.photos/seed/${student.id}/64`} alt={student.name} width={40} height={40} className="rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-xs text-muted-foreground">ID: {student.id} | Class: {student.class}</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 bg-background rounded-b-lg">
                                        <h4 className="font-semibold mb-2">Fee Ledger</h4>
                                        <div className="max-h-60 overflow-y-auto border rounded-md">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Month/Year</TableHead>
                                                        <TableHead>Amount</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Payment Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {student.fees.length > 0 ? student.fees.map(fee => (
                                                        <TableRow key={fee.id}>
                                                            <TableCell>{fee.month}, {fee.year}</TableCell>
                                                            <TableCell>PKR {fee.amount.toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                <Badge variant={fee.status === 'Paid' ? 'default' : 'destructive'} className={fee.status === 'Paid' ? 'bg-green-600' : ''}>
                                                                    {fee.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>{fee.paymentDate || 'N/A'}</TableCell>
                                                        </TableRow>
                                                    )) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center">No fee records found.</TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <div className="text-right mt-2 font-bold text-destructive">
                                            Total Dues: PKR {student.totalDues.toLocaleString()}
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}

const InfoItem = ({ icon: Icon, label, value, className }: { icon: React.ElementType, label: string, value?: string, className?: string }) => (
    <div className={className}>
        <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="text-base font-semibold ml-6">{value || 'N/A'}</p>
    </div>
);
