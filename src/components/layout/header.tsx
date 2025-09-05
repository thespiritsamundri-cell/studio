
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
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Header() {
  const pathname = usePathname();
  const pageTitle = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Set date once on mount to avoid hydration mismatch
    setCurrentDate(format(new Date(), 'd MMMM yyyy'));
    
    // Set up an interval to update the time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timer);
  }, []);
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <SidebarTrigger className="md:hidden" />
       <div className="w-full flex-1">
          <h1 className="text-xl font-semibold hidden md:block">{capitalize(pageTitle)}</h1>
        </div>
      <div className="flex items-center gap-4">
        <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search students or families..."
            className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[280px]"
            />
        </div>
         <div className="hidden md:flex items-center gap-2 text-sm font-medium">
            <div className="rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 p-px">
                <div className="bg-muted px-3 py-1.5 rounded-[7px]">
                    {currentDate}
                </div>
            </div>
             <div className="rounded-lg bg-gradient-to-br from-chart-2 to-chart-3 p-px">
                <div className="bg-muted px-3 py-1.5 rounded-[7px] w-28 text-center">
                    {currentTime}
                </div>
            </div>
        </div>
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
    </header>
  );
}
