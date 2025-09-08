

'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

function getTitleFromPathname(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';
  
  const lastPart = parts[parts.length - 1];
  
  if (lastPart === 'details' || lastPart === 'edit') {
    const parent = parts[parts.length - 2];
    return parent.charAt(0).toUpperCase() + parent.slice(1) + ' ' + lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }
  
  return lastPart.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}


export function Header() {
  const pathname = usePathname();
  const pageTitle = getTitleFromPathname(pathname);
  
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex w-full items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="w-full flex-1">
            <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
           {dateTime && (
             <div className="hidden lg:flex items-center gap-4 animated-gradient-border rounded-lg p-0.5">
                <div className="bg-background rounded-md px-3 py-1 text-sm font-medium">
                    <p className="text-center">{format(dateTime, 'PPPP')}</p>
                    <p className="text-center font-mono text-muted-foreground">{format(dateTime, 'hh:mm:ss a')}</p>
                </div>
             </div>
           )}
          <div className="relative flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[280px]"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://picsum.photos/id/237/100" alt="Admin" data-ai-hint="person avatar" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">Logout</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
