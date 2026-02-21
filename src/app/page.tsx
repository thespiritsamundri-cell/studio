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
      await signInWithEmailAndPassword(auth, email, password);
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
             {isClient && isSettingsInitialized && settings.schoolLogo ? (
                <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain rounded-full" />
             ) : (
                <div className="p-3 rounded-full bg-primary/10">
                    <School className="w-8 h-8 text-primary" />
                </div>
             )}
          </div>
          <CardTitle className="text-2xl font-bold font-headline">THE SPIRIT SCHOOL SAMUNDRI</CardTitle>
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
           <p className="text-xs text-muted-foreground">Developed by SchoolUP</p>
        </CardFooter>
      </Card>
    </div>
  );
}

    