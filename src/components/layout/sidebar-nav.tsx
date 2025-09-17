

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


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'accountant', 'coordinator'] },
  { href: '/families', icon: Home, label: 'Families', roles: ['super_admin', 'coordinator'] },
  { href: '/admissions', icon: UserPlus, label: 'Admissions', roles: ['super_admin', 'coordinator'] },
  { href: '/students', icon: Users, label: 'Students', roles: ['super_admin', 'coordinator'] },
  { href: '/classes', icon: BookCopy, label: 'Classes', roles: ['super_admin', 'coordinator'] },
  { href: '/teachers', icon: Briefcase, label: 'Teachers', roles: ['super_admin', 'coordinator'] },
  { href: '/timetable', icon: CalendarClock, label: 'Timetable', roles: ['super_admin', 'coordinator'] },
  { href: '/fees', icon: Wallet, label: 'Fee Collection', roles: ['super_admin', 'accountant'] },
  { href: '/vouchers', icon: Receipt, label: 'Fee Vouchers', roles: ['super_admin', 'accountant'] },
  { href: '/income', icon: TrendingUp, label: 'Income', roles: ['super_admin', 'accountant'] },
  { href: '/expenses', icon: Landmark, label: 'Expenses', roles: ['super_admin', 'accountant'] },
  { href: '/accounts', icon: BookCheck, label: 'Accounts', roles: ['super_admin', 'accountant'] },
  { href: '/reports', icon: FileText, label: 'Reports', roles: ['super_admin', 'accountant', 'coordinator'] },
  { href: '/yearbook', icon: Archive, label: 'Yearbook', roles: ['super_admin'] },
];

const examSystemItems = [
    { href: "/exams", icon: FileSignature, label: "Marksheets", roles: ['super_admin', 'coordinator'] },
    { href: "/result-cards", icon: FileBadge, label: "Result Cards", roles: ['super_admin', 'coordinator'] },
    { href: "/roll-number-slips", icon: Ticket, label: "Roll No. Slips", roles: ['super_admin', 'coordinator'] },
    { href: "/seating-plan", icon: Grid3x3, label: "Seating Plan", roles: ['super_admin', 'coordinator'] },
];

const attendanceItems = [
    { href: "/attendance", icon: Users, label: "Student Attendance", roles: ['super_admin', 'coordinator'] },
    { href: "/teacher-attendance", icon: UserCheck2, label: "Teacher Attendance", roles: ['super_admin', 'coordinator'] },
];

const footerItems = [
   { href: '/alumni', icon: Medal, label: 'Alumni', roles: ['super_admin', 'coordinator'] },
   { href: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin'] },
   { href: '/archived', icon: Archive, label: 'Archived', roles: ['super_admin'] },
   { href: '/', icon: LogOut, label: 'Logout', roles: ['super_admin', 'accountant', 'coordinator'] },
];


export function SidebarNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { userRole } = useData();
  const [isExamSystemOpen, setIsExamSystemOpen] = useState(pathname.startsWith('/exams') || pathname.startsWith('/result-cards') || pathname.startsWith('/roll-number-slips') || pathname.startsWith('/seating-plan'));
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(pathname.startsWith('/attendance') || pathname.startsWith('/teacher-attendance'));
  const { isPinned, isMobile } = useSidebar();
  
  const hasAccess = (roles: string[]) => roles.includes(userRole);

  const filteredNavItems = useMemo(() => navItems.filter(item => hasAccess(item.roles)), [userRole]);
  const filteredExamSystemItems = useMemo(() => examSystemItems.filter(item => hasAccess(item.roles)), [userRole]);
  const filteredAttendanceItems = useMemo(() => attendanceItems.filter(item => hasAccess(item.roles)), [userRole]);
  const filteredFooterItems = useMemo(() => footerItems.filter(item => hasAccess(item.roles)), [userRole]);


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
          {hasAccess(['super_admin', 'coordinator']) && (
            <>
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
                        {filteredAttendanceItems.map(item => (
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
                        {filteredExamSystemItems.map(item => (
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
            </>
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
