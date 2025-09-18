
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useData } from '@/context/data-context';
import { PlusCircle, Edit, Save, Loader2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, PermissionSet } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const allPermissions: { key: keyof PermissionSet, label: string, group: string }[] = [
    { key: "dashboard", label: "Dashboard", group: "General"},
    { key: "families", label: "Families", group: "Admissions"},
    { key: "admissions", label: "Admissions", group: "Admissions"},
    { key: "students", label: "Students", group: "Admissions"},
    { key: "classes", label: "Classes", group: "Academics"},
    { key: "teachers", label: "Teachers", group: "Academics"},
    { key: "timetable", label: "Timetable", group: "Academics"},
    { key: "attendance", label: "Attendance", group: "Academics"},
    { key: "examSystem", label: "Exam System", group: "Academics"},
    { key: "feeCollection", label: "Fee Collection", group: "Finance"},
    { key: "feeVouchers", label: "Fee Vouchers", group: "Finance"},
    { key: "income", label: "Income", group: "Finance"},
    { key: "expenses", label: "Expenses", group: "Finance"},
    { key: "accounts", label: "Accounts", group: "Finance"},
    { key: "reports", label: "Reports", group: "General"},
    { key: "yearbook", label: "Yearbook", group: "General"},
    { key: "alumni", label: "Alumni", group: "Admissions"},
    { key: "archived", label: "Archived", group: "General"},
    { key: "settings", label: "Settings", group: "Admin"},
];

const permissionGroups = ["General", "Admissions", "Academics", "Finance", "Admin"];


const defaultPermissions: PermissionSet = allPermissions.reduce((acc, perm) => {
    acc[perm.key] = false;
    return acc;
}, {} as PermissionSet);


export function UserManagement() {
    const { users, updateUser, createUser } = useData();
    const { toast } = useToast();

    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    
    // State for create dialog
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserPermissions, setNewUserPermissions] = useState<PermissionSet>(defaultPermissions);
    const [isCreating, setIsCreating] = useState(false);


    const handleOpenEdit = (user: User) => {
        setUserToEdit(user);
        setOpenEditDialog(true);
    };
    
    const handlePermissionChange = (permission: keyof PermissionSet, value: boolean) => {
        if (!userToEdit) return;
        setUserToEdit(prev => {
            if (!prev) return null;
            const newPermissions = { ...prev.permissions, [permission]: value };
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSavePermissions = () => {
        if (!userToEdit) return;
        updateUser(userToEdit.id, { permissions: userToEdit.permissions });
        toast({ title: 'User Updated', description: `Permissions for ${userToEdit.name} have been updated.` });
        setOpenEditDialog(false);
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
            await createUser(newUserEmail, newUserPassword, newUserName, newUserPermissions);
            toast({ title: 'User Created', description: `${newUserName} has been added.`});
            setOpenCreateDialog(false);
            setNewUserEmail('');
            setNewUserName('');
            setNewUserPassword('');
            setNewUserPermissions(defaultPermissions);
        } catch (error: any) {
            toast({ title: 'Creation Failed', description: error.message, variant: 'destructive'});
        } finally {
            setIsCreating(false);
        }
    }
    

    const roleColors = {
        super_admin: 'bg-red-500 text-white',
        custom: 'bg-blue-500 text-white',
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage user permissions and access.</CardDescription>
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
                                            <Key className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Edit Permissions: {userToEdit?.name}</DialogTitle>
                        <DialogDescription>Select the modules this user can access.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] p-1">
                        <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {permissionGroups.map(group => (
                                <div key={group} className="space-y-3">
                                    <h3 className="font-semibold border-b pb-1">{group}</h3>
                                    <div className="space-y-2">
                                        {allPermissions.filter(p => p.group === group).map(perm => (
                                            <div key={perm.key} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`perm-${perm.key}`}
                                                    checked={userToEdit?.permissions?.[perm.key] || false}
                                                    onCheckedChange={(checked) => handlePermissionChange(perm.key, !!checked)}
                                                />
                                                <Label htmlFor={`perm-${perm.key}`} className="font-normal">{perm.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleSavePermissions}><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
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
                                This will create a new login for the application. Set their initial permissions below.
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
                                <Label>Initial Permissions</Label>
                                <p className="text-xs text-muted-foreground">Select a template to quickly assign permissions.</p>
                                <Select onValueChange={(role) => {
                                    if (role === 'coordinator') setNewUserPermissions({ ...defaultPermissions, dashboard: true, families: true, admissions: true, students: true, classes: true, teachers: true, timetable: true, attendance: true, examSystem: true, reports: true });
                                    else if (role === 'accountant') setNewUserPermissions({ ...defaultPermissions, dashboard: true, feeCollection: true, feeVouchers: true, income: true, expenses: true, accounts: true, reports: true });
                                    else setNewUserPermissions(defaultPermissions);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="coordinator">Coordinator</SelectItem>
                                        <SelectItem value="accountant">Accountant</SelectItem>
                                        <SelectItem value="none">None (Manual)</SelectItem>
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
