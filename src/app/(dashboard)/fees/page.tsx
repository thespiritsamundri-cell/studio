
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, Loader2 } from 'lucide-react';
import { useData } from '@/context/data-context';
import type { Family, Student, Fee } from '@/lib/types';
import { FeeDetailsCard } from '@/components/fees/fee-details-card';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function FeesPage() {
  const { families, students, fees: allFees, updateFee, addFee, deleteFee, generateMonthlyFees } = useData();
  const { settings } = useSettings();
  const [familyId, setFamilyId] = useState('');
  const [searchedFamily, setSearchedFamily] = useState<Family | null>(null);
  const [familyStudents, setFamilyStudents] = useState<Student[]>([]);
  const [familyFees, setFamilyFees] = useState<Fee[]>([]);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFees = async () => {
    setIsGenerating(true);
    await generateMonthlyFees();
    setIsGenerating(false);
  }

  const handleSearch = () => {
    if (!familyId) {
      toast({
        title: 'Error',
        description: 'Please enter a Family ID to search.',
        variant: 'destructive',
      });
      return;
    }

    const family = families.find(f => f.id.toLowerCase() === familyId.toLowerCase());
    if (family) {
      setSearchedFamily(family);
      const s = students.filter(st => st.familyId === family.id && st.status !== 'Archived');
      setFamilyStudents(s);
      const f = allFees.filter(fe => fe.familyId === family.id);
      setFamilyFees(f);
    } else {
      toast({
        title: 'Not Found',
        description: `No family found with ID "${familyId}".`,
        variant: 'destructive',
      });
      setSearchedFamily(null);
      setFamilyStudents([]);
      setFamilyFees([]);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Fee Collection</h1>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/> Generate Monthly Fees</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Generate Monthly Fees?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will check all active families and generate any missing monthly fee challans up to the current date. This action cannot be undone. Are you sure you want to proceed?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerateFees} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Yes, Generate Fees
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collect Fee</CardTitle>
          <CardDescription>Enter a family number to view outstanding dues and collect fees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Family Number (e.g., 1)"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="submit" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchedFamily && (
        <FeeDetailsCard 
          family={searchedFamily}
          students={familyStudents}
          fees={familyFees}
          onUpdateFee={updateFee}
          onAddFee={addFee}
          onDeleteFee={deleteFee}
          settings={settings}
        />
      )}
    </div>
  );
}
