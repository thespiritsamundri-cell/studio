
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
} from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/families', icon: Home, label: 'Families' },
  { href: '/admissions', icon: UserPlus, label: 'Admissions' },
  { href: '/students', icon: Users, label: 'Students' },
  { href: '/classes', icon: BookCopy, label: 'Classes' },
  { href: '/fees', icon: Wallet, label: 'Fee Collection' },
  { href: '/income', icon: TrendingUp, label: 'Income' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/reports', icon: FileText, label: 'Reports' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { settings } = useSettings();

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 p-2">
           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/10">
            {settings.schoolLogo ? (
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
