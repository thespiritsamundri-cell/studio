
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
import { Mail } from 'lucide-react';

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

interface SupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Support</DialogTitle>
          <DialogDescription>
            Assistance and contact information.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-foreground space-y-4">
            <p>At Schoolup – A Unique Platform for Smart Schools, we believe that every question deserves a clear answer and every problem deserves a quick solution. Our support team is always here to guide you, whether it’s about setting up your account, managing attendance, handling finances, or exploring advanced features like WhatsApp integration and live data management.</p>
            <p>We have designed Schoolup to be simple, reliable, and family-focused, ensuring that schools can run smarter and parents can stay more connected. If you ever face any issue, need detailed guidance, or want to unlock the full potential of our platform, our dedicated support team is just a message away.</p>
            <p>Your trust matters to us, and we are committed to keeping your school management experience smooth, efficient, and stress-free.</p>
            <p className="pt-4 border-t">You can also find our official contact channel at <a href="mailto:mianmudassar137@gmail.com" className="text-primary font-semibold hover:underline">mianmudassar137@gmail.com</a> to reach us directly.</p>
        </div>
        <DialogFooter className="flex-col gap-4 items-center">
            <div className="text-sm">Schoolup – Because Smart Schools Deserve a Unique Platform.</div>
            <div className="text-sm text-muted-foreground">Developed by "Mian Muhammad Mudassar"</div>
             <div className="flex items-center gap-4">
                <Link href="https://wa.link/j5f42q" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <WhatsappIcon className="h-5 w-5" />
                </Link>
                <Link href="https://www.facebook.com/mianmudassar.in" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <FacebookIcon className="h-5 w-5" />
                </Link>
                <Link href="https://www.instagram.com/mianmudassar" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <InstagramIcon className="h-5 w-5" />
                </Link>
                <Link href="mailto:mianmudassar137@gmail.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Mail className="h-5 w-5" />
                </Link>
           </div>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
