import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function FeesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Fee Collection</h1>
      <Card>
        <CardHeader>
          <CardTitle>Collect Fee</CardTitle>
          <CardDescription>Enter a family number to view outstanding dues and collect fees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="text" placeholder="Family Number" />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          {/* Fee details for the family will be displayed here */}
        </CardContent>
      </Card>
    </div>
  );
}
