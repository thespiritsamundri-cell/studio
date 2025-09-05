

'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Lock, School } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function LockPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm mx-auto shadow-2xl">
        <CardHeader className="text-center">
          {settings.schoolLogo ? (
            <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain mx-auto mb-4" />
          ) : (
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <School className="w-8 h-8 text-primary" />
              </div>
            </div>
          )}
          <CardTitle className="text-2xl font-bold font-headline">{settings.schoolName}</CardTitle>
          <CardDescription>{settings.schoolAddress}<br/>{settings.schoolPhone}</CardDescription>
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
        </CardContent>
      </Card>
    </div>
  );
}
