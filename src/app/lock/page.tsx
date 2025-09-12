

'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Lock, School, LogOut, Phone, MapPin } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import Link from 'next/link';

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

export default function LockPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  
  useEffect(() => {
    setIsClient(true);
    setDateTime(new Date());
    setBackgroundImageUrl(`https://picsum.photos/1920/1080?blur=5&random=${Math.random()}`);

    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (settings.schoolName) {
        document.title = `${settings.schoolName} | Locked`;
      }
  }, [settings.schoolName]);
  
  const [animatedSchoolName, setAnimatedSchoolName] = useState('');
  useEffect(() => {
    if (settings.schoolName) {
      let index = 0;
      const interval = setInterval(() => {
        setAnimatedSchoolName(settings.schoolName.substring(0, index + 1));
        index++;
        if (index >= settings.schoolName.length) {
          setTimeout(() => {
            index = 0;
            setAnimatedSchoolName('');
          }, 2000); 
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [settings.schoolName]);

  const attemptUnlock = useCallback(() => {
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
      sessionStorage.setItem('isUnlocked', 'true'); // Set flag for welcome back message
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
  }, [pin, settings.historyClearPin, router, toast]);

  useEffect(() => {
    if (pin.length === 4) {
      attemptUnlock();
    }
  }, [pin, attemptUnlock]);

  const handleLogoutAndRelogin = async () => {
    await auth.signOut();
    router.push('/');
  }

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attemptUnlock();
  };

  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration mismatch
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImageUrl})` }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="stat-card">
        <Card className="w-full max-w-md mx-auto shadow-2xl z-10 bg-background/80 backdrop-blur-lg border-primary/20">
            <CardHeader className="text-center">
                 <div className="text-muted-foreground font-mono mb-4">
                    {dateTime && (
                      <>
                        <span>{format(dateTime, 'PPPP')}</span> | <span>{format(dateTime, 'hh:mm:ss a')}</span>
                      </>
                    )}
                 </div>
                {settings.schoolLogo ? (
                    <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain mx-auto mb-2 rounded-full" />
                ) : (
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-full bg-primary/10">
                            <School className="w-8 h-8 text-primary" />
                        </div>
                    </div>
                )}
                <CardTitle className="text-3xl font-bold font-headline h-10">{animatedSchoolName}</CardTitle>
            </CardHeader>
            <CardContent>
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
                        autoComplete="off"
                        autoFocus
                    />
                  </div>
                </div>
              <Button type="button" variant="link" size="sm" className="w-full mt-4 text-muted-foreground" onClick={handleLogoutAndRelogin}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout and login with email & password
              </Button>
            </CardContent>
            <CardFooter className="flex-col gap-4 pt-6 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4"/>
                    <span>{settings.schoolAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-4 w-4"/>
                    <span>{settings.schoolPhone}</span>
                </div>
                <div className="mt-4 border-t w-full flex flex-col items-center gap-2 pt-4">
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
                </div>
            </CardFooter>
        </Card>
        </div>
    </div>
  );
}
