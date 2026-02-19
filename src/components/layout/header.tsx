
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
import { Lock, Search, User, Home, School, Bell, Loader2, Database, Settings, LogOut, LifeBuoy } from 'lucide-react';
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
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { SearchResultsDialog } from './search-dialog';
import { collection, query as firestoreQuery, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


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


export function Header({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getTitleFromPathname(pathname);
  const { settings } = useSettings();
  const { userRole, notifications, markNotificationAsRead } = useData();
  const { toast } = useToast();
  
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [openSupportDialog, setOpenSupportDialog] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ students: Student[], families: Family[] }>({ students: [], families: [] });
  
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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const searchTerm = searchQuery.trim();
    if (!searchTerm) return;
    
    setIsSearching(true);
    
    try {
        const studentNameQuery = firestoreQuery(
            collection(db, "students"), 
            where("name", ">=", searchTerm), 
            where("name", "<=", searchTerm + '\uf8ff'),
            limit(10)
        );
        const familyNameQuery = firestoreQuery(
            collection(db, "families"), 
            where("fatherName", ">=", searchTerm), 
            where("fatherName", "<=", searchTerm + '\uf8ff'),
            limit(10)
        );
        const studentIdQuery = firestoreQuery(collection(db, "students"), where("id", "==", searchTerm), limit(10));
        const familyIdQuery = firestoreQuery(collection(db, "families"), where("id", "==", searchTerm), limit(10));
        const familyCnicQuery = firestoreQuery(collection(db, "families"), where("cnic", "==", searchTerm), limit(10));

        const [
            studentNameSnap,
            familyNameSnap,
            studentIdSnap,
            familyIdSnap,
            familyCnicSnap
        ] = await Promise.all([
            getDocs(studentNameQuery),
            getDocs(familyNameQuery),
            getDocs(studentIdQuery),
            getDocs(familyIdQuery),
            getDocs(familyCnicSnap)
        ]);
        
        const studentsMap = new Map<string, Student>();
        studentNameSnap.forEach(doc => studentsMap.set(doc.id, { id: doc.id, ...doc.data() } as Student));
        studentIdSnap.forEach(doc => studentsMap.set(doc.id, { id: doc.id, ...doc.data() } as Student));

        const familiesMap = new Map<string, Family>();
        familyNameSnap.forEach(doc => familiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Family));
        familyIdSnap.forEach(doc => familiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Family));
        familyCnicSnap.forEach(doc => familiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Family));

        setSearchResults({
            students: Array.from(studentsMap.values()),
            families: Array.from(familiesMap.values())
        });

        setIsSearchOpen(true);

    } catch (error) {
        console.error("Search failed:", error);
        toast({
            title: "Search Error",
            description: "Could not perform search. Please check the console for details.",
            variant: "destructive"
        });
    } finally {
        setIsSearching(false);
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
      <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6", className)}>
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
                {isSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin" />}
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
                <Link href="/data-management">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Data Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setOpenSupportDialog(true)}>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <SupportDialog open={openSupportDialog} onOpenChange={setOpenSupportDialog} />
       <SearchResultsDialog 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
        students={searchResults.students}
        families={searchResults.families}
        query={searchQuery}
       />
    </>
  );
}
