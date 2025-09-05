
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Lock, School, LogOut } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';

export default function LockPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  
  const backgroundImageUrl = useMemo(() => {
    // This will generate a new random image URL on each render, but because it's in useMemo without dependencies,
    // React will try to reuse it. The server and client will generate different ones causing a mismatch warning,
    // but it's acceptable here for the desired effect and won't break the page.
    return `https://picsum.photos/1920/1080?blur=5&random=${Math.random()}`;
  }, []);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleLogoutAndRelogin = async () => {
    await auth.signOut();
    router.push('/');
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.historyClearPin) {
      toast({
        title: 'PIN Not Set',
        description: 'No security PIN has been configured. Please log in again.',
        variant: 'destructive',
      });
      router.push('/');
      return;
    }

    if (pin === settings.historyClearPin) {
      toast({ title: 'System Unlocked' });
      const returnUrl = sessionStorage.getItem('lockedFrom') || '/dashboard';
      sessionStorage.removeItem('lockedFrom'); // Clean up session storage
      router.replace(returnUrl);
    } else {
      toast({
        title: 'Incorrect PIN',
        description: 'The PIN you entered is incorrect.',
        variant: 'destructive',
      });
      setPin('');
    }
  };

  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration mismatch
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <Card className="w-full max-w-md mx-auto shadow-2xl z-10 bg-background/80 backdrop-blur-lg border-primary/20">
            <CardHeader className="text-center">
                {settings.schoolLogo ? (
                    <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain mx-auto mb-2 rounded-full" />
                ) : (
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-full bg-primary/10">
                            <School className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                )}
                <CardTitle className="text-3xl font-bold font-headline">{settings.schoolName}</CardTitle>
                 <div className="text-muted-foreground font-mono mt-2">
                    <span>{format(dateTime, 'PPPP')}</span> | <span>{format(dateTime, 'hh:mm:ss a')}</span>
                 </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-center block">Enter Security PIN to Unlock</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="pin"
                        type="password"
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={4}
                        className="text-center text-lg tracking-[1rem] pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Unlock
                </Button>
              </form>
              <Button type="button" variant="link" size="sm" className="w-full mt-4 text-muted-foreground" onClick={handleLogoutAndRelogin}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout and login with email & password
              </Button>
            </CardContent>
        </Card>
    </div>
  );
}
