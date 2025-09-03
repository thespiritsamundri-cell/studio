
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Wallet,
  CalendarCheck,
  FileText,
  Settings,
  School,
  LogOut,
  Home,
  TrendingUp,
  BookCopy,
  Briefcase,
  UserCheck2,
  Receipt,
  FileSignature,
  FileBadge,
  Ticket,
} from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/families', icon: Home, label: 'Families' },
  { href: '/admissions', icon: UserPlus, label: 'Admissions' },
  { href: '/students', icon: Users, label: 'Students' },
  { href: '/classes', icon: BookCopy, label: 'Classes' },
  { href: '/teachers', icon: Briefcase, label: 'Teachers' },
  { href: '/fees', icon: Wallet, label: 'Fee Collection' },
  { href: '/vouchers', icon: Receipt, label: 'Fee Vouchers' },
  { href: '/income', icon: TrendingUp, label: 'Income' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/teacher-attendance', icon: UserCheck2, label: 'Teacher Attendance' },
  { href: '/reports', icon: FileText, label: 'Reports' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [isExamSystemOpen, setIsExamSystemOpen] = useState(pathname.startsWith('/exams') || pathname.startsWith('/result-cards') || pathname.startsWith('/roll-number-slips'));


  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 p-2">
           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10">
            {settings.schoolLogo && typeof settings.schoolLogo === 'string' && settings.schoolLogo.length > 0 ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={40} height={40} className="rounded-full object-cover"/>
            ) : (
              <School className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary-foreground font-headline">{settings.schoolName}</span>
            <span className="text-xs text-primary-foreground/70">{settings.academicYear}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
            <Collapsible open={isExamSystemOpen} onOpenChange={setIsExamSystemOpen}>
              <SidebarMenuItem>
                 <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip='Exam System' className="justify-between">
                      <div className="flex items-center gap-2">
                        <FileSignature />
                        <span>Exam System</span>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 transition-transform', isExamSystemOpen && 'rotate-90')} />
                  </SidebarMenuButton>
                 </CollapsibleTrigger>
              </SidebarMenuItem>
              <CollapsibleContent asChild>
                 <ul className="space-y-1 ml-7 pl-2 border-l">
                    <li>
                      <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={pathname.startsWith('/exams')}
                        tooltip="Marksheets"
                      >
                        <Link href="/exams">
                          <span>Marksheets</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                    <li>
                      <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={pathname.startsWith('/result-cards')}
                        tooltip="Result Cards"
                      >
                        <Link href="/result-cards">
                          <FileBadge />
                          <span>Result Cards</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                     <li>
                      <SidebarMenuButton
                        asChild
                        size="sm"
                        isActive={pathname.startsWith('/roll-number-slips')}
                        tooltip="Roll Number Slips"
                      >
                        <Link href="/roll-number-slips">
                          <Ticket />
                          <span>Roll No. Slips</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                 </ul>
              </CollapsibleContent>
            </Collapsible>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/settings')}
                tooltip="Settings"
              >
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
