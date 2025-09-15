
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Smartphone, Tablet, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const getDeviceIcon = (userAgent: string) => {
    const lowerCaseUA = userAgent.toLowerCase();
    if (lowerCaseUA.includes('mobile')) {
        if (lowerCaseUA.includes('tablet')) {
            return <Tablet className="h-5 w-5 text-muted-foreground" />;
        }
        return <Smartphone className="h-5 w-5 text-muted-foreground" />;
    }
    return <Monitor className="h-5 w-5 text-muted-foreground" />;
};

const getDeviceInfo = (userAgent: string) => {
    // This is a simplified parser. For more accuracy, a library like 'ua-parser-js' would be better.
    const lowerCaseUA = userAgent.toLowerCase();
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // OS detection
    if (lowerCaseUA.includes('windows')) os = 'Windows';
    else if (lowerCaseUA.includes('macintosh')) os = 'macOS';
    else if (lowerCaseUA.includes('linux')) os = 'Linux';
    else if (lowerCaseUA.includes('android')) os = 'Android';
    else if (lowerCaseUA.includes('iphone') || lowerCaseUA.includes('ipad')) os = 'iOS';

    // Browser detection
    if (lowerCaseUA.includes('firefox')) browser = 'Firefox';
    else if (lowerCaseUA.includes('chrome')) browser = 'Chrome';
    else if (lowerCaseUA.includes('safari') && !lowerCaseUA.includes('chrome')) browser = 'Safari';
    else if (lowerCaseUA.includes('edg')) browser = 'Edge';

    return `${browser} on ${os}`;
}

export function LoginHistory() {
    const { sessions, signOutSession } = useData();
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessionToSignOut, setSessionToSignOut] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const id = sessionStorage.getItem('sessionId');
        setCurrentSessionId(id);
    }, []);

    const handleSignOut = (sessionId: string) => {
        signOutSession(sessionId);
        toast({ title: "Session Signed Out", description: "The selected session has been logged out." });
        setSessionToSignOut(null);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Active Login Sessions</CardTitle>
                            <CardDescription>This is a list of devices that have logged into your account.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Device</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Last Accessed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map(session => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getDeviceIcon(session.userAgent)}
                                            <div>
                                                <div className="font-medium">{getDeviceInfo(session.userAgent)}</div>
                                                <div className="text-xs text-muted-foreground">{session.ipAddress}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{session.location || 'Unknown'}</TableCell>
                                    <TableCell>{formatDistanceToNow(new Date(session.lastAccess), { addSuffix: true })}</TableCell>
                                    <TableCell className="text-right">
                                        {session.id === currentSessionId ? (
                                            <span className="text-sm font-semibold text-green-600">Current Session</span>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => setSessionToSignOut(session.id)}>
                                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sessions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">No active sessions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={!!sessionToSignOut} onOpenChange={(open) => !open && setSessionToSignOut(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will sign out the selected session. If this is an unrecognized device, you should also change your password.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleSignOut(sessionToSignOut!)}>Yes, Sign Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
