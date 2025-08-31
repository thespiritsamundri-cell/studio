
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import type { Family } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function FamiliesPage() {
  const { families: allFamilies, addFamily } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFamilies, setFilteredFamilies] = useState<Family[]>(allFamilies);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFilteredFamilies(allFamilies);
  }, [allFamilies]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
        setFilteredFamilies(allFamilies);
        return;
    }
    const filtered = allFamilies.filter(
        (family) =>
            family.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            family.fatherName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFamilies(filtered);
  };
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setFilteredFamilies(allFamilies);
    }
  }

  const handleAddFamily = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const fatherName = formData.get('fatherName') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    if(!fatherName || !phone || !address) {
        toast({
            title: "Missing Information",
            description: "Please fill out all fields to add a new family.",
            variant: "destructive",
        });
        return;
    }
    
    const lastIdNumber = allFamilies.reduce((maxId, family) => {
        const currentId = parseInt(family.id);
        return isNaN(currentId) ? maxId : Math.max(maxId, currentId);
    }, 0);
    const newId = (lastIdNumber + 1).toString();

    const newFamily: Family = {
      id: newId,
      fatherName,
      phone,
      address,
    };

    addFamily(newFamily);
    toast({
        title: "Family Added",
        description: `Family #${newFamily.id} for ${newFamily.fatherName} has been successfully created.`,
    });
    setOpen(false);
    e.currentTarget.reset();
    setSearchQuery(''); 
  };
  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Families</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" /> Add New Family
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Family</DialogTitle>
              <DialogDescription>
                Enter the details for the new family. The Family ID will be generated automatically. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form id="add-family-form" onSubmit={handleAddFamily}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fatherName" className="text-right">Father's Name</Label>
                  <Input id="fatherName" name="fatherName" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" name="phone" type="tel" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">Address</Label>
                  <Input id="address" name="address" className="col-span-3" required />
                </div>
              </div>
               <DialogFooter>
                <Button type="submit" form="add-family-form">Save Family</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Families</CardTitle>
          <CardDescription>Search, view, and manage family records.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
            <Input 
              type="text" 
              placeholder="Search by Family ID or Name..." 
              className="max-w-sm" 
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family ID</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFamilies.map((family) => (
                <TableRow key={family.id}>
                  <TableCell className="font-medium">{family.id}</TableCell>
                  <TableCell>{family.fatherName}</TableCell>
                  <TableCell>{family.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">{family.address}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Students</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
