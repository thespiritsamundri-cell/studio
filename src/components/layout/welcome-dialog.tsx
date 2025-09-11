
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
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
    const { settings } = useSettings();
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader className="items-center text-center">
                {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="rounded-full object-contain mb-2" />}
                <DialogTitle className="text-2xl">Welcome to {settings.schoolName}</DialogTitle>
                <DialogDescription>
                    {format(new Date(), 'PPPP')}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col items-center gap-2 pt-4 border-t">
                <Button onClick={() => onOpenChange(false)}>Continue to Dashboard</Button>
                <p className="text-xs text-muted-foreground mt-4">Developed by "Mian Muhammad Mudassar"</p>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
