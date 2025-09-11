
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { School } from 'lucide-react';
import Image from 'next/image';
import { useSettings } from '@/context/settings-context';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'welcome' | 'welcome-back';
}

export function WelcomeDialog({ open, onOpenChange, variant }: WelcomeDialogProps) {
  const { settings } = useSettings();
  const date = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center items-center">
            {settings.schoolLogo ? (
                <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain rounded-full mb-2" />
            ) : (
                <div className="p-3 rounded-full bg-primary/10 mb-2">
                    <School className="w-8 h-8 text-primary" />
                </div>
            )}
            <DialogTitle className="text-2xl font-bold">
              {variant === 'welcome' ? `Welcome to ${settings.schoolName}` : `Welcome Back!`}
            </DialogTitle>
            <DialogDescription>{format(date, 'PPPP')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col items-center gap-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">Developed by "Mian Mudassar"</p>
           <DialogClose asChild>
            <Button type="button">
              Continue
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
