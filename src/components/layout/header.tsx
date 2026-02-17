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
import { Lock, Search, User, Home, School, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useSettings } from '@/context/settings-context';
import { useData } from '@/context/data-context';
import type { Student, Family, AppNotification } from '@/lib/types';
import { SupportDialog } from './support-dialog';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';


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
  const { userRole, notifications, markNotificationAsRead } = useData();
  
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [openSupportDialog, setOpenSupportDialog] = useState(false);
  
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  useEffect(() => {
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleLockClick = () => {
    sessionStorage.setItem('lockedFrom', pathname);
    router.push('/lock');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Heuristic to decide where to search
    // If it's a number, it could be a family ID or part of a CNIC.
    // If it contains a hyphen, it's likely a CNIC.
    if (/^\d+$/.test(query) || query.includes('-')) {
        // Search by ID/CNIC - redirect to families page as CNIC is on family level
        router.push(`/families?search=${query}`);
    } else {
        // Otherwise, assume it's a name and go to students page
        router.push(`/students?search=${query}`);
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
      if (!notification.isRead) {
          markNotificationAsRead(notification.id);
      }
      if (notification.link) {
          router.push(notification.link);
      }
  }


  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
        </div>

        {/* Search */}
        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by Name, ID, or CNIC..."
                    className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[336px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>
            
          {dateTime && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="animated-gradient-border p-0.5 rounded-lg">
                <div className="bg-card rounded-md px-3 py-1.5 text-sm font-medium">
                  {format(dateTime, 'd MMMM yyyy')}
                </div>
              </div>
              <div className="animated-gradient-border p-0.5 rounded-lg">
                <div className="bg-card rounded-md px-3 py-1.5 text-sm font-medium">
                  {format(dateTime, 'hh:mm:ss a')}
                </div>
              </div>
            </div>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLockClick} className="hidden lg:inline-flex">
            <Lock className="h-4 w-4" />
            <span className="sr-only">Lock screen</span>
          </Button>

           {userRole === 'super_admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications.length > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-[10px]">
                            {unreadNotifications.length}
                        </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-96">
                    {notifications.length > 0 ? (
                        notifications.map(n => (
                            <DropdownMenuItem key={n.id} className={cn("flex flex-col items-start gap-1 whitespace-normal", !n.isRead && "bg-accent")} onSelect={() => handleNotificationClick(n)}>
                                <p className="font-semibold">{n.title}</p>
                                <p className="text-xs text-muted-foreground">{n.description}</p>
                                <p className="text-xs text-muted-foreground self-end">{formatDistanceToNow(new Date(n.timestamp), { addSuffix: true })}</p>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          <DropdownMenu open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" onMouseEnter={() => setIsUserDropdownOpen(true)}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={settings.schoolLogo || "https://picsum.photos/id/237/100"} alt={settings.schoolName} />
                  <AvatarFallback><School /></AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onMouseLeave={() => setIsUserDropdownOpen(false)}>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenSupportDialog(true)}>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">Logout</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <SupportDialog open={openSupportDialog} onOpenChange={setOpenSupportDialog} />
    </>
  );
}
