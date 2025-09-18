
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
  Landmark,
  BookCheck,
  CalendarClock,
  Archive,
  Medal,
} from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { useData } from '@/context/data-context';
import type { PermissionSet } from '@/lib/types';


type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  permission: keyof PermissionSet;
};

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
  { href: '/families', icon: Home, label: 'Families', permission: 'families' },
  { href: '/admissions', icon: UserPlus, label: 'Admissions', permission: 'admissions' },
  { href: '/students', icon: Users, label: 'Students', permission: 'students' },
  { href: '/classes', icon: BookCopy, label: 'Classes', permission: 'classes' },
  { href: '/teachers', icon: Briefcase, label: 'Teachers', permission: 'teachers' },
  { href: '/timetable', icon: CalendarClock, label: 'Timetable', permission: 'timetable' },
  { href: '/fees', icon: Wallet, label: 'Fee Collection', permission: 'feeCollection' },
  { href: '/vouchers', icon: Receipt, label: 'Fee Vouchers', permission: 'feeVouchers' },
  { href: '/income', icon: TrendingUp, label: 'Income', permission: 'income' },
  { href: '/expenses', icon: Landmark, label: 'Expenses', permission: 'expenses' },
  { href: '/accounts', icon: BookCheck, label: 'Accounts', permission: 'accounts' },
  { href: '/reports', icon: FileText, label: 'Reports', permission: 'reports' },
  { href: '/yearbook', icon: Archive, label: 'Yearbook', permission: 'yearbook' },
];

const examSystemItems: NavItem[] = [
    { href: "/exams", icon: FileSignature, label: "Marksheets", permission: "examSystem" },
    { href: "/result-cards", icon: FileBadge, label: "Result Cards", permission: "examSystem" },
    { href: "/roll-number-slips", icon: Ticket, label: "Roll No. Slips", permission: "examSystem" },
    { href: "/seating-plan", icon: Grid3x3, label: "Seating Plan", permission: "examSystem" },
];

const attendanceItems: NavItem[] = [
    { href: "/attendance", icon: Users, label: "Student Attendance", permission: "attendance" },
    { href: "/teacher-attendance", icon: UserCheck2, label: "Teacher Attendance", permission: "attendance" },
];

const footerItems: NavItem[] = [
   { href: '/alumni', icon: Medal, label: 'Alumni', permission: 'alumni' },
   { href: '/settings', icon: Settings, label: 'Settings', permission: 'settings' },
   { href: '/archived', icon: Archive, label: 'Archived', permission: 'archived' },
   { href: '/', icon: LogOut, label: 'Logout', permission: 'dashboard' }, // Anyone with dashboard access can logout
];


export function SidebarNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { hasPermission } = useData();
  const [isExamSystemOpen, setIsExamSystemOpen] = useState(pathname.startsWith('/exam') || pathname.startsWith('/result-cards') || pathname.startsWith('/roll-number-slips') || pathname.startsWith('/seating-plan'));
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(pathname.startsWith('/attendance') || pathname.startsWith('/teacher-attendance'));
  const { isPinned, isMobile } = useSidebar();
  
  const filteredNavItems = useMemo(() => navItems.filter(item => hasPermission(item.permission)), [hasPermission]);
  const showExamSystem = useMemo(() => hasPermission('examSystem'), [hasPermission]);
  const showAttendance = useMemo(() => hasPermission('attendance'), [hasPermission]);
  const filteredFooterItems = useMemo(() => footerItems.filter(item => hasPermission(item.permission)), [hasPermission]);


  return (
    <>
      <SidebarHeader>
        <div className="flex flex-col items-center justify-center p-2 h-24">
           <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-foreground/10 flex-shrink-0">
            {settings.schoolLogo && typeof settings.schoolLogo === 'string' && settings.schoolLogo.length > 0 ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={48} height={48} className="rounded-full object-cover"/>
            ) : (
              <School className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <span className={cn("text-xs text-sidebar-foreground/80 mt-2 min-w-0 transition-opacity duration-200", (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100")}>{settings.academicYear}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className={cn("truncate min-w-0 transition-opacity duration-200", (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100")}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {showAttendance && (
            <Collapsible asChild open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
              <CollapsibleSidebarMenuItem>
                 <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip='Attendance' className="justify-between w-full">
                      <div className="flex items-center gap-3">
                        <CalendarCheck />
                        <span className={cn("truncate min-w-0 transition-opacity duration-200", (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100")}>Attendance</span>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 transition-all duration-200 ml-auto', (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100", isAttendanceOpen && 'rotate-90')} />
                  </SidebarMenuButton>
                 </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <ul className={cn("space-y-1 ml-4 pl-5 py-1 border-l border-sidebar-border/50 transition-all", (isPinned || isMobile) ? "block" : "hidden group-hover/sidebar:block")}>
                        {attendanceItems.map(item => (
                             <li key={item.label}>
                                <SidebarMenuButton asChild size="sm" isActive={pathname.startsWith(item.href)} tooltip={item.label}>
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
          )}
          {showExamSystem && (
            <Collapsible asChild open={isExamSystemOpen} onOpenChange={setIsExamSystemOpen}>
              <CollapsibleSidebarMenuItem>
                 <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip='Exam System' className="justify-between w-full">
                      <div className="flex items-center gap-3">
                        <FileSignature />
                        <span className={cn("truncate min-w-0 transition-opacity duration-200", (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100")}>Exam System</span>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 transition-all duration-200 ml-auto', (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100", isExamSystemOpen && 'rotate-90')} />
                  </SidebarMenuButton>
                 </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <ul className={cn("space-y-1 ml-4 pl-5 py-1 border-l border-sidebar-border/50 transition-all", (isPinned || isMobile) ? "block" : "hidden group-hover/sidebar:block")}>
                        {examSystemItems.map(item => (
                             <li key={item.label}>
                                <SidebarMenuButton asChild size="sm" isActive={pathname.startsWith(item.href)} tooltip={item.label}>
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
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {filteredFooterItems.map((item) => (
             <SidebarMenuItem key={item.label}>
             <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && item.href !== '/'}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span className={cn("truncate min-w-0 transition-opacity duration-200", (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100")}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
