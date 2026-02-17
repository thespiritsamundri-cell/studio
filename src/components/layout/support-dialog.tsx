
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Briefcase } from 'lucide-react';
import Image from 'next/image';

interface SupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
            <div className="flex items-center justify-center flex-col gap-2 pt-4">
                 <div className="p-3 rounded-full bg-primary/10">
                    <Image src="https://firebasestorage.googleapis.com/v0/b/educentral-mxfgr.appspot.com/o/images%2Flogo.png?alt=media&token=2621443c-6902-4467-9b2f-7679d2800334" alt="SchoolUp Logo" width={64} height={64} className="object-contain" />
                 </div>
                <DialogTitle className="text-2xl">Support</DialogTitle>
            </div>
          <DialogDescription className="text-center px-4">
            Support Information for the SchoolUp Platform.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 px-2 text-sm text-center text-foreground space-y-3">
            <p>At Schoolup – A Unique Platform for Smart Schools, we believe that every question deserves a clear answer and every problem deserves a quick solution. Our support team is always here to guide you, whether it’s about setting up your account, managing attendance, handling finances, or exploring advanced features like WhatsApp integration and live data management.</p>
            <p>We have designed Schoolup to be simple, reliable, and family-focused, ensuring that schools can run smarter and parents can stay more connected. If you ever face any issue, need detailed guidance, or want to unlock the full potential of our platform, our dedicated support team is just a message away.</p>
            <p>Your trust matters to us, and we are committed to keeping your school management experience smooth, efficient, and stress-free.</p>
        </div>
        <DialogFooter className="flex-col items-center gap-4 pt-4 border-t">
           <p className="text-sm font-semibold text-center text-gray-700">Schoolup – Because Smart Schools Deserve a Unique Platform.</p>
           <p className="text-xs text-muted-foreground">Developed by SchoolUP</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
