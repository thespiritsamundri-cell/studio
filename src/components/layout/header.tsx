
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
import { Lock, Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useSettings } from '@/context/settings-context';
import { useData } from '@/context/data-context';
import type { Student } from '@/lib/types';

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
  const { students } = useData();
  
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 1) {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.fatherName.toLowerCase().includes(query.toLowerCase()) ||
        student.id.toLowerCase().includes(query.toLowerCase()) ||
        student.familyId.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 7)); // Limit to 7 results
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleResultClick = (studentId: string) => {
    router.push(`/students/details/${studentId}`);
    setSearchQuery('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  }


  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background px-4 md:px-6">
       <div className="flex-1">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
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
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
            onFocus={() => searchQuery.length > 1 && setIsDropdownOpen(true)}
          />
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full max-w-md rounded-md border bg-card shadow-lg z-50">
              <ul>
                {searchResults.map(student => (
                  <li 
                    key={student.id} 
                    className="p-3 border-b last:border-b-0 hover:bg-accent cursor-pointer"
                    onMouseDown={() => handleResultClick(student.id)}
                  >
                     <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={student.photoUrl} alt={student.name} />
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.fatherName} (ID: {student.id}, Family: {student.familyId})
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
