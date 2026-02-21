'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSettings } from '@/context/settings-context';
import type { Student, Family, Fee } from '@/lib/types';
import { Loader2, School, User, Home, Phone, Hash, Users, Wallet, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';

// Public Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAtnV9kiSJ-NFLfI6pG4LDvvLcjpRh_jtM",
  authDomain: "educentral-mxfgr.firebaseapp.com",
  projectId: "educentral-mxfgr",
  storageBucket: "educentral-mxfgr.appspot.com",
  messagingSenderId: "93439797301",
  appId: "1:93439797301:web:c0cd1d46e7588e4df4297c"
};

const publicApp = !getApps().some(app => app.name === 'public-voucher') ? initializeApp(firebaseConfig, 'public-voucher') : getApp('public-voucher');
const publicDb = getFirestore(publicApp);

interface VoucherData {
    fee: Fee;
    family: Family;
    students: Student[];
}

export default function PublicVoucherPage() {
    const params = useParams();
    const { id } = params;
    const { settings, isSettingsInitialized } = useSettings();
    
    const [voucherData, setVoucherData] = useState<VoucherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !isSettingsInitialized) return;

        const voucherId = id as string;
        const feeDocRef = doc(publicDb, "fees", voucherId);

        const unsubscribe = onSnapshot(feeDocRef, async (feeDoc) => {
            if (!feeDoc.exists()) {
                setError(`Voucher with ID "${voucherId}" not found.`);
                setIsLoading(false);
                return;
            }
            
            const feeData = { id: feeDoc.id, ...feeDoc.data() } as Fee;
            
            try {
                const familyDocRef = doc(publicDb, "families", feeData.familyId);
                const familyDoc = await getDoc(familyDocRef);
                if (!familyDoc.exists()) throw new Error(`Family with ID "${feeData.familyId}" not found.`);
                const familyData = { id: familyDoc.id, ...familyDoc.data() } as Family;
                
                const studentsQuery = query(collection(publicDb, "students"), where("familyId", "==", feeData.familyId));
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentsData = studentsSnapshot.docs.map(d => ({id: d.id, ...d.data()} as Student));

                setVoucherData({ fee: feeData, family: familyData, students: studentsData });
                setError(null);
            } catch (err: any) {
                 console.error("Error fetching related data:", err);
                setError(err.message || "Could not load complete voucher details.");
            } finally {
                setIsLoading(false);
            }
        }, (err) => {
            console.error("Error with snapshot listener:", err);
            setError("Could not connect to live data.");
            setIsLoading(false);
        });

        return () => unsubscribe(); // Cleanup listener on component unmount

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
                    <p className="ml-3 text-lg">Loading Voucher Status...</p>
                </div>
            </div>
        );
    }
    
    if (error || !voucherData) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100">
                <p className="text-destructive text-center p-4">{error || "Voucher data could not be loaded."}</p>
            </div>
        );
    }
    
    const { fee, family, students } = voucherData;

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
            <Card className="w-full max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-primary/10 p-6 text-center border-b-2 border-primary">
                    {settings.schoolLogo && (
                        <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="mx-auto rounded-full mb-2"/>
                    )}
                    <h1 className="text-2xl font-bold text-foreground dark:text-white">{settings.schoolName}</h1>
                    <p className="text-sm text-muted-foreground">{settings.schoolAddress}</p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-bold">Voucher Status</h2>
                        <p className="text-muted-foreground">Voucher ID: {fee.id}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                        <InfoItem icon={User} label="Father's Name" value={family.fatherName} />
                        <InfoItem icon={Hash} label="Family ID" value={family.id} />
                        <div className="col-span-1 sm:col-span-2"><InfoItem icon={Users} label="Student(s)" value={students.map(s => `${s.name} (${s.class})`).join(', ')} /></div>
                    </div>
                    
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Fee Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableBody>
                                    <TableRow><TableCell className="font-semibold">Fee For</TableCell><TableCell>{fee.month}, {fee.year}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-semibold">Amount</TableCell><TableCell>PKR {fee.amount.toLocaleString()}</TableCell></TableRow>
                                    <TableRow><TableCell className="font-semibold">Status</TableCell>
                                        <TableCell>
                                            <Badge variant={fee.status === 'Paid' ? 'default' : 'destructive'} className={fee.status === 'Paid' ? 'bg-green-600' : ''}>
                                                {fee.status === 'Paid' ? <CheckCircle className="h-4 w-4 mr-1"/> : <XCircle className="h-4 w-4 mr-1"/>}
                                                {fee.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    {fee.status === 'Paid' && (
                                        <>
                                            <TableRow><TableCell className="font-semibold">Payment Date</TableCell><TableCell>{format(new Date(fee.paymentDate), 'PPP')}</TableCell></TableRow>
                                            <TableRow><TableCell className="font-semibold">Payment Method</TableCell><TableCell>{fee.paymentMethod}</TableCell></TableRow>
                                            <TableRow><TableCell className="font-semibold">Receipt ID</TableCell><TableCell>{fee.receiptId}</TableCell></TableRow>
                                        </>
                                    )}
                                </TableBody>
                             </Table>
                        </CardContent>
                    </Card>
                </CardContent>
                 <CardFooter className="text-center text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved. | Developed by SchoolUP</p>
                </CardFooter>
            </Card>
        </div>
    );
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-base font-semibold">{value || 'N/A'}</p>
        </div>
    </div>
);
