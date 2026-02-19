
'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, Archive, Database } from 'lucide-react';
import Link from 'next/link';

export default function DataManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Database /> Data Management</h1>
        <p className="text-muted-foreground">
          Access and manage historical student data and other data-related tasks.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <Link href="/alumni" className="block group">
          <Card className="transition-all duration-300 group-hover:border-primary group-hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary">
                 <GraduationCap className="w-8 h-8 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Alumni Records</CardTitle>
                <CardDescription>View students who have graduated.</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/archived" className="block group">
          <Card className="transition-all duration-300 group-hover:border-primary group-hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary">
                    <Archive className="w-8 h-8 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                </div>
              <div>
                <CardTitle>Archived Records</CardTitle>
                <CardDescription>Manage archived students and families.</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
