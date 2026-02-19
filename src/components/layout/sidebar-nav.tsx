
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
  Database,
} from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { useData } from '@/context/data-context';
import type { PermissionSet } from '@/lib/types';


type NavLink = {
  type: 'link';
  href: string;
  icon: React.ElementType;
  label: string;
  permission: keyof PermissionSet | 'any_primary_role';
};

type NavGroup = {
  type: 'group';
  label: string;
  icon: React.ElementType;
  permission: keyof PermissionSet | 'any_primary_role';
  items: Omit<NavLink, 'type'>[];
  pathPrefixes: string[];
};

type NavElement = NavLink | NavGroup;

const attendanceItems: Omit<NavLink, 'type'>[] = [
    { href: "/attendance", icon: Users, label: "Student Attendance", permission: "attendance" },
    { href: "/teacher-attendance", icon: UserCheck2, label: "Teacher Attendance", permission: "attendance" },
];

const examSystemItems: Omit<NavLink, 'type'>[] = [
    { href: "/exams", icon: FileSignature, label: "Exams", permission: "examSystem" },
    { href: "/result-cards", icon: FileBadge, label: "Result Cards", permission: "examSystem" },
    { href: "/roll-number-slips", icon: Ticket, label: "Roll No. Slips", permission: "examSystem" },
    { href: "/seating-plan", icon: Grid3x3, label: "Seating Plan", permission: "examSystem" },
];

const dataManagementItems: Omit<NavLink, 'type'>[] = [
    { href: "/alumni", icon: Medal, label: "Alumni Records", permission: "alumni" },
    { href: "/archived", icon: Archive, label: "Archived Records", permission: "archived" },
];

const mainNavStructure: NavElement[] = [
  { type: 'link', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
  { type: 'link', href: '/families', icon: Home, label: 'Families', permission: 'families' },
  { type: 'link', href: '/admissions', icon: UserPlus, label: 'Admissions', permission: 'admissions' },
  { type: 'link', href: '/students', icon: Users, label: 'Students', permission: 'students' },
  { type: 'link', href: '/classes', icon: BookCopy, label: 'Classes', permission: 'classes' },
  { type: 'link', href: '/teachers', icon: Briefcase, label: 'Teachers', permission: 'teachers' },
  { type: 'link', href: '/timetable', icon: CalendarClock, label: 'Timetable', permission: 'timetable' },
  { 
    type: 'group',
    label: 'Attendance', 
    icon: CalendarCheck,
    permission: 'attendance',
    items: attendanceItems,
    pathPrefixes: ['/attendance', '/teacher-attendance']
  },
  { 
    type: 'group',
    label: 'Exam System',
    icon: FileSignature,
    permission: 'examSystem',
    items: examSystemItems,
    pathPrefixes: ['/exams', '/result-cards', '/roll-number-slips', '/seating-plan']
  },
  { type: 'link', href: '/vouchers', icon: Receipt, label: 'Fee Vouchers', permission: 'feeVouchers' },
  { type: 'link', href: '/fees', icon: Wallet, label: 'Fee Collection', permission: 'feeCollection' },
  { type: 'link', href: '/income', icon: TrendingUp, label: 'Income', permission: 'income' },
  { type: 'link', href: '/expenses', icon: Landmark, label: 'Expenses', permission: 'expenses' },
  { type: 'link', href: '/accounts', icon: BookCheck, label: 'Accounts', permission: 'accounts' },
  { type: 'link', href: '/reports', icon: FileText, label: 'Reports', permission: 'reports' },
  { type: 'link', href: '/yearbook', icon: Archive, label: 'Yearbook', permission: 'yearbook' },
  { 
    type: 'group',
    label: 'Data Management',
    icon: Database,
    permission: 'dashboard', // Placeholder permission, actual logic is handled below
    items: dataManagementItems,
    pathPrefixes: ['/alumni', '/archived']
  },
];


const footerItems: NavLink[] = [
   { type: 'link', href: '/settings', icon: Settings, label: 'Settings', permission: 'any_primary_role' },
   { type: 'link', href: '/', icon: LogOut, label: 'Logout', permission: 'dashboard' }, // Anyone with dashboard access can logout
];


export function SidebarNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { hasPermission, userRole } = useData();
  const { isPinned, isMobile } = useSidebar();
  
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const activeGroups: Record<string, boolean> = {};
    mainNavStructure.forEach(item => {
      if (item.type === 'group' && item.pathPrefixes.some(prefix => pathname.startsWith(prefix))) {
        activeGroups[item.label] = true;
      }
    });
    setOpenCollapsibles(activeGroups);
  }, [pathname]);

  const handleOpenChange = (label: string, open: boolean) => {
    setOpenCollapsibles(prev => ({ ...prev, [label]: open }));
  };

  const checkGeneralPermission = (permission: keyof PermissionSet | 'any_primary_role') => {
      if (permission === 'any_primary_role') {
          return userRole === 'super_admin' || userRole === 'accountant' || userRole === 'coordinator';
      }
      return hasPermission(permission);
  }

  const filteredFooterItems = useMemo(() => footerItems.filter(item => checkGeneralPermission(item.permission)), [hasPermission, userRole]);


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
          {mainNavStructure.map((item) => {
            let hasAccess = false;
            // Special check for Data Management group to ensure it shows if user has *any* of its sub-item permissions
            if (item.type === 'group' && item.label === 'Data Management') {
                hasAccess = item.items.some(subItem => checkGeneralPermission(subItem.permission));
            } else {
                hasAccess = checkGeneralPermission(item.permission);
            }
            
            if (!hasAccess) return null;

            if (item.type === 'link') {
              return (
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
              );
            }

            if (item.type === 'group') {
                return (
                    <Collapsible
                        key={item.label}
                        asChild
                        open={openCollapsibles[item.label] || false}
                        onOpenChange={(open) => handleOpenChange(item.label, open)}
                    >
                        <CollapsibleSidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton tooltip={item.label} className="justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <item.icon />
                                    <span className={cn("truncate min-w-0 transition-opacity duration-200", (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100")}>{item.label}</span>
                                </div>
                                <ChevronRight className={cn('h-4 w-4 transition-all duration-200 ml-auto', (isPinned || isMobile) ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100", (openCollapsibles[item.label] || false) && 'rotate-90')} />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent asChild>
                                <ul className={cn("space-y-1 ml-4 pl-5 py-1 border-l border-sidebar-border/50 transition-all", (isPinned || isMobile) ? "block" : "hidden group-hover/sidebar:block")}>
                                    {item.items.filter(subItem => checkGeneralPermission(subItem.permission)).map(subItem => (
                                        <li key={subItem.label}>
                                            <SidebarMenuButton asChild size="sm" isActive={pathname.startsWith(subItem.href)} tooltip={subItem.label}>
                                                <Link href={subItem.href}>
                                                <subItem.icon />
                                                <span className="truncate min-w-0">{subItem.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </li>
                                    ))}
                                </ul>
                            </CollapsibleContent>
                        </CollapsibleSidebarMenuItem>
                    </Collapsible>
                );
            }
            return null;
          })}
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
