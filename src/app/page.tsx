

'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettings } from '@/context/settings-context';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, School } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { doc, setDoc } from 'firebase/firestore';
import type { Session } from '@/lib/types';


const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

export default function LoginPage() {
  const { settings, isSettingsInitialized } = useSettings();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
      if (isSettingsInitialized && settings.schoolName) {
        document.title = `${settings.schoolName} | Login`;
      }
  }, [settings.schoolName, isSettingsInitialized]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Create session document
        const sessionId = `SESS-${Date.now()}`;
        const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
        const ipData = ipResponse ? await ipResponse.json() : {};

        const newSession: Session = {
            id: sessionId,
            userId: user.uid,
            loginTime: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            ipAddress: ipData.ip || 'Unknown',
            userAgent: navigator.userAgent,
            location: 'Unknown',
        };
        await setDoc(doc(db, 'sessions', sessionId), newSession);
        sessionStorage.setItem('sessionId', sessionId);
      }
      
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           toast({
                title: 'Login Failed',
                description: 'Invalid email or password. Please try again.',
                variant: 'destructive',
           });
      } else {
           console.error("Firebase login failed:", error);
           toast({
                title: 'Login Failed',
                description: 'An unexpected error occurred. Please check your network and try again.',
                variant: 'destructive',
           });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             {isClient && settings.schoolLogo ? (
                <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain rounded-full" />
             ) : (
                <div className="p-3 rounded-full bg-primary/10">
                    <School className="w-8 h-8 text-primary" />
                </div>
             )}
          </div>
          <CardTitle className="text-2xl font-bold font-headline">{isClient && isSettingsInitialized ? settings.schoolName : 'School Management'}</CardTitle>
          <CardDescription>Welcome back! Please login to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-center gap-4 pt-4 border-t">
           <p className="text-xs text-muted-foreground">Developed by "Mian Mudassar"</p>
           <div className="flex items-center gap-4">
                <Link href="https://www.facebook.com/mianmudassar.in" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <FacebookIcon className="h-5 w-5" />
                </Link>
                 <Link href="https://wa.link/j5f42q" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <WhatsappIcon className="h-5 w-5" />
                </Link>
                 <Link href="https://www.instagram.com/mianmudassar_" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <InstagramIcon className="h-5 w-5" />
                </Link>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
