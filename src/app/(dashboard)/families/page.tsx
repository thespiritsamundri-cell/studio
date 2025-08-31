import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function FamiliesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Families</h1>
      <Card>
        <CardHeader>
          <CardTitle>Search Family</CardTitle>
          <CardDescription>Enter a family number to see student details and fee status.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="text" placeholder="Family Number" />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          {/* Results will be displayed here once search is implemented */}
        </CardContent>
      </Card>
    </div>
  );
}
