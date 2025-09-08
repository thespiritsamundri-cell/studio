
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
import { Lock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useSettings } from '@/context/settings-context';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const pageTitle = getTitleFromPathname(pathname);
  const { settings } = useSettings();
  
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleLockClick = () => {
    sessionStorage.setItem('lockedFrom', pathname);
    router.push('/lock');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background px-4 md:px-6">
       <div className="flex-1">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <div className="relative flex-grow-0 animated-gradient-border rounded-lg">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students or families..."
            className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[280px]"
          />
        </div>
         {dateTime && (
           <div className="hidden lg:flex items-center gap-2">
              <div className="bg-card rounded-md px-3 py-1.5 text-sm font-medium border">
                  {format(dateTime, 'd MMMM yyyy')}
              </div>
              <div className="bg-card rounded-md px-3 py-1.5 text-sm font-medium border">
                  {format(dateTime, 'hh:mm:ss a')}
              </div>
           </div>
         )}
        <Button variant="ghost" size="icon" onClick={handleLockClick} className="hidden lg:inline-flex">
            <Lock className="h-4 w-4" />
            <span className="sr-only">Lock screen</span>
        </Button>
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
    </header>
  );
}
