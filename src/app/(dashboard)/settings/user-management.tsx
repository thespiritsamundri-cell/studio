

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export function UserManagement() {
    const { users, updateUser, createUser } = useData();
    const { toast } = useToast();

    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isEditDialog, setIsEditDialog] = useState(false);
    
    // State for create dialog
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'accountant' | 'coordinator'>('coordinator');
    const [isCreating, setIsCreating] = useState(false);


    const handleOpenEdit = (user: User) => {
        setUserToEdit(user);
        setIsEditDialog(true);
    };

    const handleSaveRole = () => {
        if (!userToEdit) return;
        updateUser(userToEdit.id, { role: userToEdit.role });
        toast({ title: 'User Updated', description: `Role for ${userToEdit.name} has been updated to ${userToEdit.role}.` });
        setIsEditDialog(false);
        setUserToEdit(null);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserEmail || !newUserPassword || !newUserName) {
            toast({ title: 'Missing Fields', description: 'Please fill out all fields to create a new user.', variant: 'destructive'});
            return;
        }
        setIsCreating(true);
        try {
            await createUser(newUserEmail, newUserPassword, newUserName, newUserRole);
            toast({ title: 'User Created', description: `${newUserName} has been added with the role of ${newUserRole}.`});
            setOpenCreateDialog(false);
            setNewUserEmail('');
            setNewUserName('');
            setNewUserPassword('');
            setNewUserRole('coordinator');
        } catch (error: any) {
            toast({ title: 'Creation Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsCreating(false);
        }
    }
    

    const roleColors = {
        super_admin: 'bg-red-500 text-white',
        accountant: 'bg-blue-500 text-white',
        coordinator: 'bg-green-500 text-white',
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage user roles and access permissions.</CardDescription>
                        </div>
                        <Button onClick={() => setOpenCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge className={cn(roleColors[user.role])}>{user.role.replace('_', ' ').toUpperCase()}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} disabled={user.role === 'super_admin'}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialog} onOpenChange={setIsEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {userToEdit?.name}</DialogTitle>
                        <DialogDescription>Change the role for this user.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={userToEdit?.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role-select">Role</Label>
                            <Select
                                value={userToEdit?.role}
                                onValueChange={(value) => setUserToEdit(prev => prev ? { ...prev, role: value as User['role'] } : null)}
                            >
                                <SelectTrigger id="role-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="accountant">Accountant</SelectItem>
                                    <SelectItem value="coordinator">Coordinator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleSaveRole}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             {/* Create Dialog */}
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                <DialogContent>
                    <form onSubmit={handleCreateUser}>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                This will create a new login for the application. You can set their role here.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="new-user-name">Full Name</Label>
                                <Input id="new-user-name" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-user-email">Email</Label>
                                <Input id="new-user-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-user-password">Password</Label>
                                <Input id="new-user-password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-user-role">Role</Label>
                                <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as any)}>
                                    <SelectTrigger id="new-user-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="coordinator">Coordinator</SelectItem>
                                        <SelectItem value="accountant">Accountant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" type="button" onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Create User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
