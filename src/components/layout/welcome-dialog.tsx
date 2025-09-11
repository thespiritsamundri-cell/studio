
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { School } from 'lucide-react';
import Image from 'next/image';
import { useSettings } from '@/context/settings-context';
import { format } from 'date-fns';

interface WelcomeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isWelcomeBack: boolean;
}

export function WelcomeDialog({ open, onOpenChange, isWelcomeBack }: WelcomeDialogProps) {
    const { settings } = useSettings();
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <DialogHeader className="items-center text-center">
                {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="rounded-full object-contain mb-2" />}
                <DialogTitle className="text-2xl">{isWelcomeBack ? 'Welcome Back!' : `Welcome to ${settings.schoolName}`}</DialogTitle>
                <DialogDescription>
                    {format(new Date(), 'PPPP')}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col items-center gap-2 pt-4 border-t">
                <p className="text-xs text-muted-foreground">Developed by "Mian Muhammad Mudassar"</p>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
