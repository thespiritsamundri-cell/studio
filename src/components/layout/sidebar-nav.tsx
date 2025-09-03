
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
  CollapsibleSidebarMenuItem
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
  Grid3x3,
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

const examSystemItems = [
    { href: "/exams", icon: FileSignature, label: "Marksheets" },
    { href: "/result-cards", icon: FileBadge, label: "Result Cards" },
    { href: "/roll-number-slips", icon: Ticket, label: "Roll No. Slips" },
    { href: "/seating-plan", icon: Grid3x3, label: "Seating Plan" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [isExamSystemOpen, setIsExamSystemOpen] = useState(pathname.startsWith('/exams') || pathname.startsWith('/result-cards') || pathname.startsWith('/roll-number-slips') || pathname.startsWith('/seating-plan'));


  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 p-2 whitespace-nowrap overflow-hidden">
           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10 flex-shrink-0">
            {settings.schoolLogo && typeof settings.schoolLogo === 'string' && settings.schoolLogo.length > 0 ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={40} height={40} className="rounded-full object-cover"/>
            ) : (
              <School className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <div className="flex flex-col opacity-100 group-hover/sidebar:opacity-100 transition-opacity duration-200 group-[[data-sidebar-hidden=true]]:opacity-0">
            <span className="text-lg font-bold text-primary-foreground font-headline">{settings.schoolName}</span>
            <span className="text-xs text-primary-foreground/70">{settings.academicYear}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
                  <span className="truncate min-w-0">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
            <Collapsible asChild open={isExamSystemOpen} onOpenChange={setIsExamSystemOpen}>
              <CollapsibleSidebarMenuItem>
                 <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip='Exam System' className="justify-between w-full">
                      <div className="flex items-center gap-3">
                        <FileSignature />
                        <span className="truncate min-w-0">Exam System</span>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 transition-transform ml-auto', isExamSystemOpen && 'rotate-90')} />
                  </SidebarMenuButton>
                 </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <ul className="space-y-1 ml-4 pl-5 py-1 border-l border-sidebar-border/50">
                        {examSystemItems.map(item => (
                             <li key={item.label}>
                                <SidebarMenuButton
                                    asChild
                                    size="sm"
                                    isActive={pathname.startsWith(item.href)}
                                    tooltip={item.label}
                                >
                                    <Link href={item.href}>
                                    <item.icon />
                                    <span className="truncate min-w-0">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                             </li>
                        ))}
                    </ul>
                </CollapsibleContent>
              </CollapsibleSidebarMenuItem>
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
                  <span className="truncate min-w-0">Settings</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/">
                <LogOut />
                <span className="truncate min-w-0">Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
