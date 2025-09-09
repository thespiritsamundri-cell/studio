
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PreloaderProps {
  style?: string;
  className?: string;
}

const styles: { [key: string]: React.FC<{ className?: string }> } = {
  style1: ({ className }) => (
    <div className={cn("w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary", className)}></div>
  ),
  style2: ({ className }) => (
    <div className={cn("w-16 h-16 relative", className)}>
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
    </div>
  ),
  style3: ({ className }) => (
    <div className={cn("w-4 h-4 rounded-full bg-primary animate-bounce", className)} style={{ animationDelay: '0s' }}></div>
  ),
  style4: ({ className }) => (
     <div className={cn("flex space-x-2", className)}>
        <div className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
    </div>
  ),
  style5: ({ className }) => (
    <div className={cn("w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin", className)}></div>
  ),
  style6: ({ className }) => (
    <div className={cn("w-16 h-16 relative", className)}>
      <div className="absolute inset-2 border-4 border-primary rounded-full opacity-50"></div>
      <div className="absolute inset-0 border-t-4 border-transparent border-l-4 border-primary rounded-full animate-spin"></div>
      <div className="absolute inset-4 border-b-4 border-transparent border-r-4 border-primary rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
    </div>
  ),
  style7: ({ className }) => (
    <div className={cn("flex items-center justify-center space-x-1", className)}>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
    </div>
  ),
  style8: ({ className }) => (
    <div className={cn("w-16 h-16", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full animate-spin" style={{ animationDuration: '2s' }}>
        <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary) / 0.2)" strokeWidth="10" fill="none" />
        <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary))" strokeWidth="10" fill="none" strokeDasharray="282.74" strokeDashoffset="212.06" strokeLinecap="round" />
      </svg>
    </div>
  ),
};

export function Preloader({ style = 'style1', className }: PreloaderProps) {
  const SelectedStyle = styles[style] || styles.style1;
  return <SelectedStyle className={className} />;
}
