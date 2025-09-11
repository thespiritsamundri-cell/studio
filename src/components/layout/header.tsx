
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
import { Lock, Search, User, Home, School } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useSettings } from '@/context/settings-context';
import { useData } from '@/context/data-context';
import type { Student, Family } from '@/lib/types';
import { SupportDialog } from './support-dialog';
import { ThemeToggle } from './theme-toggle';

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

type SearchResult = 
  | { type: 'student'; data: Student }
  | { type: 'family'; data: Family };


export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getTitleFromPathname(pathname);
  const { settings } = useSettings();
  const { students, families } = useData();
  
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [openSupportDialog, setOpenSupportDialog] = useState(false);

  useEffect(() => {
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const handleLockClick = () => {
    sessionStorage.setItem('lockedFrom', pathname);
    router.push('/lock');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(e.target.value);

    if (query.length > 0) {
        const studentResults: SearchResult[] = students.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.fatherName.toLowerCase().includes(query) ||
            student.id.toLowerCase().includes(query) ||
            student.familyId.toLowerCase().includes(query)
        ).map(s => ({ type: 'student', data: s }));

        const familyResults: SearchResult[] = families.filter(family =>
            family.fatherName.toLowerCase().includes(query) ||
            family.id.toLowerCase().includes(query)
        ).map(f => ({ type: 'family', data: f }));
        
        const combinedResults = [...studentResults, ...familyResults];
        const uniqueResults: SearchResult[] = [];
        const seen = new Set<string>();

        for (const result of combinedResults) {
            if (result.type === 'student') {
                const key = `student-${result.data.id}`;
                if (!seen.has(key)) {
                    uniqueResults.push(result);
                    seen.add(key);
                }
            } else if (result.type === 'family') {
                const key = `family-${result.data.id}`;
                if (!seen.has(key)) {
                    uniqueResults.push(result);
                    seen.add(key);
                }
            }
        }

      setSearchResults(uniqueResults.slice(0, 7)); 
      setIsSearchDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'student') {
        router.push(`/students/details/${result.data.id}`);
    } else {
        router.push(`/students?familyId=${result.data.id}`);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchDropdownOpen(false);
  }


  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile Header */}
      <div className="flex w-full items-center gap-4 md:hidden">
        <SidebarTrigger />
        <div className="relative flex-1">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-card pl-8 h-9"
            value={searchQuery}
            onChange={handleSearchChange}
            onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 150)}
            onFocus={() => searchQuery.length > 1 && setIsSearchDropdownOpen(true)}
           />
           {isSearchDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full max-w-md rounded-md border bg-card shadow-lg z-50">
              <ul>
                {searchResults.map((result, index) => (
                  <li 
                    key={`${result.type}-${result.type === 'student' ? result.data.id : result.data.id}-${index}`}
                    className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                    onMouseDown={() => handleResultClick(result)}
                  >
                     <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {result.type === 'student' && <AvatarImage src={result.data.photoUrl} alt={result.data.name} />}
                          <AvatarFallback>
                            {result.type === 'student' ? <User /> : <Home />}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{result.data.name || result.data.fatherName}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.type === 'student'
                                ? `Student (ID: ${result.data.id}, Family: ${result.data.familyId})`
                                : `Family (ID: ${result.data.id}, Phone: ${result.data.phone})`
                            }
                          </p>
                        </div>
                     </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleLockClick} className="h-9 w-9">
            <Lock className="h-4 w-4" />
        </Button>
        <ThemeToggle />
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

      {/* Desktop Header */}
      <div className="hidden w-full md:flex items-center">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
          <div className="relative flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students or families..."
              className="w-full rounded-lg bg-card pl-8 md:w-[200px] lg:w-[280px]"
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setIsSearchDropdownOpen(false), 150)}
              onFocus={() => searchQuery.length > 1 && setIsSearchDropdownOpen(true)}
            />
            {isSearchDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full max-w-md rounded-md border bg-card shadow-lg z-50">
                <ul>
                  {searchResults.map((result, index) => (
                    <li 
                      key={`${result.type}-${result.type === 'student' ? result.data.id : result.data.id}-${index}`}
                      className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                      onMouseDown={() => handleResultClick(result)}
                    >
                      <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {result.type === 'student' && <AvatarImage src={result.data.photoUrl} alt={result.data.name} />}
                            <AvatarFallback>
                              {result.type === 'student' ? <User /> : <Home />}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{result.data.name || result.data.fatherName}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.type === 'student'
                                  ? `Student (ID: ${result.data.id}, Family: ${result.data.familyId})`
                                  : `Family (ID: ${result.data.id}, Phone: ${result.data.phone})`
                              }
                            </p>
                          </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
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
      </div>
    </header>
    <SupportDialog open={openSupportDialog} onOpenChange={setOpenSupportDialog} />
    </>
  );
}
