
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, MoreHorizontal, Trash2, Users, Upload, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const professions = [
    'Doctor', 'Engineer', 'Teacher', 'Businessman', 'Government Employee', 
    'Farmer', 'Lawyer', 'Laborer', 'Driver', 'Other'
];

export default function FamiliesPage() {
  const { families: allFamilies, students: allStudents, addFamily, updateFamily, deleteFamily, addActivityLog } = useData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFamilies, setFilteredFamilies] = useState<Family[]>(allFamilies);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const { toast } = useToast();
  
  // State for select dropdowns
  const [newProfession, setNewProfession] = useState('');
  const [editProfession, setEditProfession] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredFamilies(allFamilies);
  }, [allFamilies]);
  
   useEffect(() => {
    if (selectedFamily) {
      setEditProfession(selectedFamily.profession || '');
    }
  }, [selectedFamily]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
        setFilteredFamilies(allFamilies);
        return;
    }
    const filtered = allFamilies.filter(
        (family) =>
            family.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            family.fatherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            family.cnic?.toLowerCase().includes(searchQuery.toLowerCase())
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
    const cnic = formData.get('cnic') as string;

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
      cnic,
      profession: newProfession,
    };

    addFamily(newFamily);
    toast({
        title: "Family Added",
        description: `Family #${newFamily.id} for ${newFamily.fatherName} has been successfully created.`,
    });
    setOpenAddDialog(false);
    e.currentTarget.reset();
    setNewProfession('');
    setSearchQuery(''); 
  };
  
  const handleEditFamily = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFamily) return;

    const formData = new FormData(e.currentTarget);
    const updatedFamily: Family = {
      ...selectedFamily,
      fatherName: formData.get('editFatherName') as string,
      phone: formData.get('editPhone') as string,
      address: formData.get('editAddress') as string,
      cnic: formData.get('editCnic') as string,
      profession: editProfession,
    };

    updateFamily(selectedFamily.id, updatedFamily);
    toast({
      title: "Family Updated",
      description: `Family #${selectedFamily.id} has been successfully updated.`,
    });
    setOpenEditDialog(false);
    setSelectedFamily(null);
  };

  const handleEditClick = (family: Family) => {
    setSelectedFamily(family);
    setOpenEditDialog(true);
  };

  const handleDeleteClick = (family: Family) => {
    setSelectedFamily(family);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedFamily) return;
    deleteFamily(selectedFamily.id);
    toast({
        title: "Family Deleted",
        description: `Family #${selectedFamily.id} (${selectedFamily.fatherName}) and all associated students have been deleted.`,
        variant: "destructive"
    });
    setOpenDeleteDialog(false);
    setSelectedFamily(null);
  }

  const handleViewStudents = (familyId: string) => {
    router.push(`/students?familyId=${familyId}`);
  };

  const getStudentCountForFamily = (familyId: string) => {
    return allStudents.filter(student => student.familyId === familyId).length;
  };
  
  const handleExportCsv = () => {
    const headers = ['id', 'fatherName', 'profession', 'cnic', 'phone', 'address'];
    const csvContent = [
      headers.join(','),
      ...allFamilies.map((family) =>
        [
          family.id,
          `"${family.fatherName}"`,
          `"${family.profession || ''}"`,
          `"${family.cnic || ''}"`,
          `"${family.phone}"`,
          `"${family.address.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'families_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: 'Export Successful', description: 'Families data has been exported as families_template.csv.' });
  };
  
  const handleImportCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: 'No file selected', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').slice(1); // Skip header row
        
        let lastIdNumber = allFamilies.reduce((maxId, family) => {
            const currentId = parseInt(family.id);
            return isNaN(currentId) ? maxId : Math.max(maxId, currentId);
        }, 0);
        
        let importedCount = 0;
        lines.forEach((line) => {
            if (line.trim() === '') return;
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const [id, fatherName, profession, cnic, phone, address] = values;

            if (fatherName && phone && address) {
              const newId = (++lastIdNumber).toString();
              const newFamily: Family = { id: newId, fatherName, profession, cnic, phone, address };
              addFamily(newFamily);
              importedCount++;
            }
        });

        if (importedCount > 0) {
            toast({
                title: 'Import Successful',
                description: `${importedCount} new families have been imported.`,
            });
            addActivityLog({ user: 'Admin', action: 'Import Families', description: `Imported ${importedCount} families from CSV file.`});
        } else {
            toast({ title: 'Import Failed', description: 'No valid families were found in the file to import.', variant: 'destructive' });
        }

      } catch (error) {
        toast({ title: 'Import Failed', description: 'Could not read or parse the CSV file. Please check the format.', variant: 'destructive' });
        console.error('Error importing CSV:', error);
      } finally {
        if(importInputRef.current) {
            importInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Families</h1>
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={importInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleImportCsv}
            />
            <Button variant="outline" onClick={() => importInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" /> Import</Button>
            <Button variant="outline" onClick={handleExportCsv}><Download className="w-4 h-4 mr-2" /> Export</Button>
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
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
                    <Label htmlFor="profession" className="text-right">Profession</Label>
                    <Select name="profession" onValueChange={setNewProfession} value={newProfession}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select profession" />
                        </SelectTrigger>
                        <SelectContent>
                            {professions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cnic" className="text-right">Father's CNIC</Label>
                    <Input id="cnic" name="cnic" className="col-span-3" />
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
              placeholder="Search by Family ID, Name, or CNIC..." 
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
                <TableHead>Students</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden md:table-cell">Profession</TableHead>
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
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{getStudentCountForFamily(family.id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{family.phone}</TableCell>
                  <TableCell className="hidden md:table-cell">{family.profession}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEditClick(family)}>Edit Family</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewStudents(family.id)}>View Students</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(family)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Family
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {filteredFamilies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No families found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Edit Family Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Family: {selectedFamily?.id}</DialogTitle>
            <DialogDescription>
              Update the details for this family. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form id="edit-family-form" onSubmit={handleEditFamily}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFatherName" className="text-right">Father's Name</Label>
                <Input id="editFatherName" name="editFatherName" className="col-span-3" defaultValue={selectedFamily?.fatherName} required />
              </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editProfession" className="text-right">Profession</Label>
                  <Select name="editProfession" onValueChange={setEditProfession} value={editProfession}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select profession" />
                    </SelectTrigger>
                    <SelectContent>
                        {professions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editCnic" className="text-right">Father's CNIC</Label>
                <Input id="editCnic" name="editCnic" className="col-span-3" defaultValue={selectedFamily?.cnic} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editPhone" className="text-right">Phone</Label>
                <Input id="editPhone" name="editPhone" type="tel" className="col-span-3" defaultValue={selectedFamily?.phone} required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editAddress" className="text-right">Address</Label>
                <Input id="editAddress" name="editAddress" className="col-span-3" defaultValue={selectedFamily?.address} required />
              </div>
            </div>
             <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
              <Button type="submit" form="edit-family-form">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the family record for <strong>{selectedFamily?.fatherName}</strong> and all associated student records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFamily(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete family
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
