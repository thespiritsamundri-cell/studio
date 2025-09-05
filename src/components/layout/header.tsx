
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
import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useData } from '@/context/data-context';
import type { Student, Family } from '@/lib/types';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface SearchResult extends Student {
  fatherName: string;
}

export function Header() {
  const pathname = usePathname();
  const { students, families } = useData();
  const pageTitle = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setCurrentDate(format(new Date(), 'd MMMM yyyy'));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const familyMap = useMemo(() => {
    return new Map(families.map(f => [f.id, f]));
  }, [families]);

  useEffect(() => {
    if (searchQuery.length > 1) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const filteredStudents = students
            .map(student => {
                const family = familyMap.get(student.familyId);
                return { ...student, fatherName: family?.fatherName || 'N/A' };
            })
            .filter(student =>
                student.name.toLowerCase().includes(lowerCaseQuery) ||
                student.id.toLowerCase().includes(lowerCaseQuery) ||
                student.familyId.toLowerCase().includes(lowerCaseQuery) ||
                student.fatherName.toLowerCase().includes(lowerCaseQuery)
            );
        setSearchResults(filteredStudents.slice(0, 10)); // Limit results
    } else {
        setSearchResults([]);
    }
  }, [searchQuery, students, familyMap]);
  
  const handleResultClick = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 px-4 md:px-6">
      <div className="header-container flex-1">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click
                />
                {isSearchFocused && searchResults.length > 0 && (
                    <div className="absolute top-full mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md z-50">
                        <ul className="p-1">
                            {searchResults.map(student => (
                                <li key={student.id}>
                                    <Link href={`/students/details/${student.id}`} passHref>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start h-auto py-2 px-2"
                                            onClick={handleResultClick}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={student.photoUrl} alt={student.name} />
                                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-sm">{student.name}</p>
                                                    <p className="text-xs text-muted-foreground">Father: {student.fatherName}</p>
                                                </div>
                                            </div>
                                        </Button>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm font-medium">
                <div className="p-px bg-gradient-to-br from-chart-1 to-chart-2 rounded-[7px]">
                    <div className="bg-muted px-3 py-1.5 rounded-[6px]">
                        {currentDate}
                    </div>
                </div>
                <div className="p-px bg-gradient-to-br from-chart-2 to-chart-3 rounded-[7px]">
                    <div className="bg-muted px-3 py-1.5 rounded-[6px] w-32 text-center">
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
      </div>
    </header>
  );
}
