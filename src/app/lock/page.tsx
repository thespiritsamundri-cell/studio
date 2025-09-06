
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Lock, School, LogOut, Phone, MapPin } from 'lucide-react';
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
      sessionStorage.removeItem('locked');
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
            <CardFooter className="flex-col gap-2 text-center text-xs text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4"/>
                    <span>{settings.schoolAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4"/>
                    <span>{settings.schoolPhone}</span>
                </div>
            </CardFooter>
        </Card>
        </div>
    </div>
  );
}
