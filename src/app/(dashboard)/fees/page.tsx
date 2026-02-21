
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useData } from '@/context/data-context';
import type { Family, Student, Fee } from '@/lib/types';
import { FeeDetailsCard } from '@/components/fees/fee-details-card';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function FeesPage() {
  const { families, students, fees: allFees, updateFee, addFee, deleteFee } = useData();
  const { settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedFamily, setSearchedFamily] = useState<Family | null>(null);
  const [familyStudents, setFamilyStudents] = useState<Student[]>([]);
  const [familyFees, setFamilyFees] = useState<Fee[]>([]);
  const { toast } = useToast();

  const [studentSearchResults, setStudentSearchResults] = useState<Student[]>([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  const processFamilySearch = (family: Family) => {
      setSearchedFamily(family);
      const s = students.filter(st => st.familyId === family.id && st.status !== 'Archived');
      setFamilyStudents(s);
      const f = allFees.filter(fe => fe.familyId === family.id);
      setFamilyFees(f);
  }

  const handleSearch = () => {
    if (!searchQuery) {
      toast({
        title: 'Error',
        description: "Please enter a Family ID, Student Name, or Father's Name to search.",
        variant: 'destructive',
      });
      return;
    }
    
    setSearchedFamily(null);
    setStudentSearchResults([]);

    const lowercasedQuery = searchQuery.toLowerCase();

    // Try searching by family ID first
    const familyById = families.find(f => f.id.toLowerCase() === lowercasedQuery);
    if (familyById) {
        processFamilySearch(familyById);
        return;
    }

    // If not found, search by student name OR father's name
    const matchingStudentsByName = students.filter(s => s.name.toLowerCase().includes(lowercasedQuery));

    const matchingFamiliesByFatherName = families.filter(f => f.fatherName.toLowerCase().includes(lowercasedQuery));
    const studentsFromMatchingFamilies = students.filter(s => matchingFamiliesByFatherName.some(f => f.id === s.familyId));

    const allMatchingStudents = Array.from(new Map([...matchingStudentsByName, ...studentsFromMatchingFamilies].map(item => [item.id, item])).values());


    if (allMatchingStudents.length === 0) {
        toast({ title: 'Not Found', description: `No family, student, or father found for "${searchQuery}".`, variant: 'destructive' });
    } else if (allMatchingStudents.length === 1) {
        const student = allMatchingStudents[0];
        const family = families.find(f => f.id === student.familyId);
        if (family) {
            processFamilySearch(family);
            setSearchQuery(family.id); // Update search bar to show the ID
        } else {
            toast({ title: 'Family Not Found', description: `Could not find the family for student ${student.name}.`, variant: 'destructive' });
        }
    } else {
        setStudentSearchResults(allMatchingStudents);
        setShowSelectionDialog(true);
    }
  };

  const handleStudentSelect = (student: Student) => {
    const family = families.find(f => f.id === student.familyId);
    if (family) {
        setSearchQuery(family.id);
        processFamilySearch(family);
    }
    setShowSelectionDialog(false);
  }
  
  const handleClear = () => {
      setSearchQuery('');
      setSearchedFamily(null);
      setFamilyStudents([]);
      setFamilyFees([]);
      setStudentSearchResults([]);
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Fee Collection</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collect Fee</CardTitle>
          <CardDescription>Enter a family number or student name to view outstanding dues and collect fees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-md items-center space-x-2">
            <Input
              type="text"
              placeholder="Family #, Student, or Father's Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="submit" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClear} aria-label="Clear search">
                <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Multiple Results Found</DialogTitle>
                <DialogDescription>Select the correct student to view their family's fees.</DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Father's Name</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {studentSearchResults.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.fatherName}</TableCell>
                                <TableCell>{student.class}</TableCell>
                                <TableCell>
                                    <Button size="sm" onClick={() => handleStudentSelect(student)}>Select</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </DialogContent>
      </Dialog>

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
