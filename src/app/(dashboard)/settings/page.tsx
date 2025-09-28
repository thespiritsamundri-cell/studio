

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSettings, defaultSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, KeyRound, Loader2, TestTubeDiagonal, MessageSquare, Send, Eye, EyeOff, Settings as SettingsIcon, Info, UserCog, Palette, Type, PenSquare, Trash2, PlusCircle, History, Database, ShieldAlert, Wifi, WifiOff, Bell, BellOff, Lock, AlertTriangle, PlayCircle, Image as ImageIcon, CheckCircle, RefreshCcw, Users, Globe } from 'lucide-react';

import { useData } from '@/context/data-context';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';
import type { Grade, MessageTemplate, SchoolSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Switch } from '@/components/ui/switch';
import { Preloader } from '@/components/ui/preloader';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/services/storage-service';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserManagement } from './user-management';


export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { students, families, fees, loadData, addActivityLog, activityLog, seedDatabase, clearActivityLog, classes: dataClasses, teachers, deleteAllData, hasPermission, userRole } = useData();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [sendTarget, setSendTarget] = useState('all_families');
  const [targetClass, setTargetClass] = useState('');
  const [targetFamilyId, setTargetFamilyId] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');
  const [customNumbers, setCustomNumbers] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [localPreloaderStyle, setLocalPreloaderStyle] = useState(settings.preloaderStyle);
  const [localPreloaderEnabled, setLocalPreloaderEnabled] = useState(settings.preloaderEnabled);

  const canEdit = hasPermission('settings');

  useEffect(() => {
    setLocalPreloaderStyle(settings.preloaderStyle);
    setLocalPreloaderEnabled(settings.preloaderEnabled);
  }, [settings.preloaderStyle, settings.preloaderEnabled]);

  const handleAppearanceSave = () => {
    setSettings(prev => ({
      ...prev,
      preloaderStyle: localPreloaderStyle,
      preloaderEnabled: localPreloaderEnabled,
    }));
    toast({ title: "Appearance settings saved!" });
  };

  const [email, setEmail] = useState('');
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.email) {
      setEmail(user.email);
    }
  }, []);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [clearHistoryPin, setClearHistoryPin] = useState('');
  const [openClearHistoryDialog, setOpenClearHistoryDialog] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [openFactoryResetDialog, setOpenFactoryResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPin, setResetPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const classes = useMemo(() => (dataClasses || []).map(c => c.name), [dataClasses]);
  
  const handleSave = () => {
    addActivityLog({ action: 'Update Settings', description: 'Updated school information settings.' });
    toast({ title: 'Settings Saved', description: 'Your school information has been updated.' });
  };
  
  const handleAccountSave = async () => {
    if (newPin && newPin !== confirmPin) { toast({ title: 'PINs do not match.', variant: 'destructive'}); return; }
    const user = auth.currentUser;
    if (!user || !user.email) { toast({ title: 'You must be logged in.', variant: 'destructive' }); return; }
    
    if (canEdit) {
        if (newPin && !newPassword) {
          setSettings(prev => ({...prev, historyClearPin: newPin}));
          await addActivityLog({ action: 'Update PIN', description: 'Updated security PIN.' });
          toast({ title: "Security PIN Updated" });
          setNewPin(''); setConfirmPin('');
          return;
        }
        if (!newPin && !newPassword) {
            setSettings(prev => ({...prev, autoLockEnabled: settings.autoLockEnabled, autoLockDuration: settings.autoLockDuration }));
            await addActivityLog({ action: 'Update Security', description: 'Updated auto-lock settings.' });
            toast({ title: "Security Settings Saved" });
            return;
        }
    }

    if (newPassword) {
        if (!currentPassword) { toast({ title: 'Current password is required.', variant: 'destructive'}); return; }
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            if (canEdit && newPin) setSettings(prev => ({ ...prev, historyClearPin: newPin }));
            await addActivityLog({ action: 'Update Credentials', description: 'Updated admin login credentials.' });
            toast({ title: "Account Settings Saved" });
            setCurrentPassword(''); setNewPassword(''); setNewPin(''); setConfirmPin('');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password') toast({ title: 'Authentication Failed', description: 'Incorrect password.', variant: 'destructive' });
            else toast({ title: 'An error occurred', description: error.message, variant: 'destructive' });
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    setSettings(prev => {
        const valueToSet = isCheckbox ? checked : value;
        const newSettings = {...prev, [id]: valueToSet};
        if (['whatsappApiUrl', 'whatsappApiKey', 'whatsappPhoneNumberId', 'whatsappAccessToken'].includes(id)) {
            newSettings.whatsappConnectionStatus = 'untested';
        }
        return newSettings;
    });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'schoolLogo' | 'principalSignature' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) setSettings(prev => ({ ...prev, [field]: event.target.result as string })); };
      reader.readAsDataURL(file);
      try {
        toast({ title: 'Uploading...', description: `Uploading ${field}.` });
        const downloadURL = await uploadFile(file, `branding/${field}/${file.name}`);
        const brandingRef = doc(db, "branding", "school-assets");
        await setDoc(brandingRef, { [field]: downloadURL }, { merge: true });
        setSettings(prev => ({ ...prev, [field]: downloadURL }));
        toast({ title: 'Upload Successful' });
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({ title: 'Upload Failed', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
      }
    }
  };

  const handleSelectChange = (id: keyof typeof settings) => (value: string) => setSettings(prev => ({ ...prev, [id]: value }));
  
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 2; i++) years.push(`${currentYear + i}-${currentYear + i + 1}`);
    return years;
  };

  const timezones = [
      'UTC', 'GMT', 'Europe/London', 'Europe/Paris', 'Africa/Cairo', 
      'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 
      'Asia/Bangkok', 'Asia/Hong_Kong', 'Asia/Tokyo', 'Australia/Sydney', 
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'
  ];
  
  const handleCreateBackup = () => {
    const backupData = { students, families, fees, settings, activityLog };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `educentral-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
     toast({ title: 'Backup Created' });
     addActivityLog({ action: 'Create Backup', description: 'Downloaded a backup of all application data.' });
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { toast({ title: 'No file selected', variant: 'destructive'}); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const restoredData = JSON.parse(result);
          if (restoredData.settings && restoredData.students && restoredData.families && restoredData.fees) {
             loadData(restoredData);
             setSettings(restoredData.settings);
             toast({ title: 'Restore Successful' });
          } else throw new Error("Invalid backup file structure.");
        }
      } catch (error) {
        toast({ title: 'Restore Failed', description: 'Invalid backup file.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };
  
  const handleTemplateClick = (template: string) => setMessage(template);
  
  const handleConfirmClearHistory = () => {
    if (!settings.historyClearPin) { toast({ title: "PIN Not Set", variant: 'destructive'}); return; }
    if (clearHistoryPin === settings.historyClearPin) {
        clearActivityLog();
        setOpenClearHistoryDialog(false);
        setClearHistoryPin('');
    } else {
        toast({ title: "Incorrect PIN", variant: 'destructive'});
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSendMessage = async () => {
    if (!message) { toast({ title: 'Message is empty', variant: 'destructive' }); return; }
    setIsSending(true);

    let recipients: { phone: string, context: Record<string, string> }[] = [];
    let targetDescription = '';
    let recipientCount = 0;

    switch (sendTarget) {
        case 'all_families':
            recipients = families.map(f => ({ phone: f.phone, context: { '{father_name}': f.fatherName, '{school_name}': settings.schoolName } }));
            targetDescription = `all ${recipients.length} families`; 
            recipientCount = recipients.length;
            break;
        case 'class':
            if (!targetClass) { toast({ title: 'No class selected', variant: 'destructive' }); setIsSending(false); return; }
            const studentsInClass = students.filter(s => s.class === targetClass);
            const familyIds = [...new Set(studentsInClass.map(s => s.familyId))];
            recipients = families.filter(f => familyIds.includes(f.id)).map(f => ({ phone: f.phone, context: { '{father_name}': f.fatherName, '{student_name}': students.find(s => s.familyId === f.id)?.name || '', '{class}': targetClass, '{school_name}': settings.schoolName } }));
            targetDescription = `families of class ${targetClass}`;
            recipientCount = recipients.length;
            break;
        case 'family':
             if (!targetFamilyId) { toast({ title: 'No family ID entered', variant: 'destructive' }); setIsSending(false); return; }
            const family = families.find(f => f.id === targetFamilyId);
            if (!family) { toast({ title: 'Family not found', variant: 'destructive' }); setIsSending(false); return; }
            recipients = [{ phone: family.phone, context: { '{father_name}': family.fatherName, '{student_name}': students.find(s => s.familyId === family.id)?.name || '', '{class}': students.find(s => s.familyId === family.id)?.class || '', '{school_name}': settings.schoolName } }];
            targetDescription = `family ${family.fatherName} (${family.id})`; 
            recipientCount = 1;
            break;
        case 'all_teachers':
            recipients = teachers.map(t => ({ phone: t.phone, context: { '{teacher_name}': t.name, '{school_name}': settings.schoolName } }));
            targetDescription = `all ${recipients.length} teachers`; 
            recipientCount = recipients.length;
            break;
        case 'teacher':
             if (!targetTeacherId) { toast({ title: 'No teacher selected', variant: 'destructive' }); setIsSending(false); return; }
            const teacher = teachers.find(t => t.id === targetTeacherId);
            if (!teacher) { toast({ title: 'Teacher not found', variant: 'destructive' }); setIsSending(false); return; }
            recipients = [{ phone: teacher.phone, context: { '{teacher_name}': teacher.name, '{school_name}': settings.schoolName } }];
            targetDescription = `teacher ${teacher.name}`; 
            recipientCount = 1;
            break;
        case 'custom':
            if (!customNumbers) { toast({ title: 'No numbers entered', variant: 'destructive' }); setIsSending(false); return; }
            recipients = customNumbers.split(',').map(num => ({ phone: num.trim(), context: {'{school_name}': settings.schoolName} }));
            targetDescription = 'custom numbers'; 
            recipientCount = recipients.length;
            break;
    }

    if (recipients.length === 0) { toast({ title: 'No Recipients', variant: 'destructive' }); setIsSending(false); return; }
    toast({ title: 'Sending Messages', description: `Sending to ${recipients.length} recipient(s).` });
    
    addActivityLog({ 
        action: 'Send WhatsApp Message', 
        description: `Sent custom message to ${targetDescription}.`, 
        recipientCount: recipientCount 
    });
    
    let successCount = 0;
    for (const recipient of recipients) {
        let personalizedMessage = message;
        for (const key in recipient.context) personalizedMessage = personalizedMessage.replace(new RegExp(key, 'g'), recipient.context[key]);
        try {
             const result = await sendWhatsAppMessage(recipient.phone, personalizedMessage, settings);
             if (result.success) successCount++;
             else toast({ title: 'Message Failed', description: `Failed to send to ${recipient.phone}: ${result.error}`, variant: 'destructive' });
            await sleep(Number(settings.messageDelay) * 1000 || 2000); 
        } catch (error) { console.error(`Failed to send to ${recipient.phone}`, error); }
    }
    
    toast({ title: 'Process Complete', description: `Sent to ${successCount} of ${recipients.length} recipients.` });
    setIsSending(false);
  };
  
    const handleTestConnection = async () => {
        setIsTesting(true);
        setSettings(prev => ({...prev, whatsappConnectionStatus: 'untested'}));
        if (!testPhoneNumber) { toast({ title: 'Test Failed', description: 'Enter a test phone number.', variant: 'destructive' }); setIsTesting(false); setSettings(prev => ({...prev, whatsappConnectionStatus: 'failed'})); return; }
        try {
            const result = await sendWhatsAppMessage(testPhoneNumber, `Test from ${settings.schoolName}.`, settings);
            if (result.success) { toast({ title: 'Test Successful' }); setSettings(prev => ({...prev, whatsappConnectionStatus: 'connected'}));
            } else { setSettings(prev => ({...prev, whatsappConnectionStatus: 'failed'})); throw new Error(result.error || "API returned failure."); }
        } catch (error: any) {
            toast({ title: 'Test Failed', description: error.message || 'Could not connect.', variant: 'destructive' });
            setSettings(prev => ({...prev, whatsappConnectionStatus: 'failed'}));
        } finally { setIsTesting(false); }
    };
    
    const handleGradeChange = (index: number, field: keyof Grade, value: string | number) => {
        const newGrades = [...(settings.gradingSystem || [])];
        newGrades[index] = { ...newGrades[index], [field]: value };
        setSettings(prev => ({...prev, gradingSystem: newGrades }));
    };

    const addGradeRow = () => {
        const newGrade: Grade = { name: '', minPercentage: 0 };
        setSettings(prev => ({...prev, gradingSystem: [...(prev.gradingSystem || []), newGrade]}));
    };

    const removeGradeRow = (index: number) => setSettings(prev => ({...prev, gradingSystem: (prev.gradingSystem || []).filter((_, i) => i !== index)}));

    const handleOpenTemplateDialog = (template: MessageTemplate | null) => {
        if (template) { setIsEditingTemplate(true); setSelectedTemplate(template); setTemplateName(template.name); setTemplateContent(template.content); } 
        else { setIsEditingTemplate(false); setSelectedTemplate(null); setTemplateName(''); setTemplateContent(''); }
        setOpenTemplateDialog(true);
    };

    const handleSaveTemplate = () => {
        if (!templateName.trim() || !templateContent.trim()) { toast({ title: "Cannot Save", variant: "destructive" }); return; }
        const currentTemplates = settings.messageTemplates || [];
        if (isEditingTemplate && selectedTemplate) {
            const updatedTemplates = currentTemplates.map(t => t.id === selectedTemplate.id ? { ...t, name: templateName, content: templateContent } : t);
            setSettings(prev => ({ ...prev, messageTemplates: updatedTemplates }));
            toast({ title: "Template Updated" });
        } else {
            const newTemplate: MessageTemplate = { id: `TPL-${Date.now()}`, name: templateName, content: templateContent };
            setSettings(prev => ({ ...prev, messageTemplates: [...currentTemplates, newTemplate] }));
            toast({ title: "Template Added" });
        }
        setOpenTemplateDialog(false);
    };
    
    const handleDeleteTemplate = () => {
        if (!selectedTemplate) return;
        const updatedTemplates = (settings.messageTemplates || []).filter(t => t.id !== selectedTemplate.id);
        setSettings(prev => ({ ...prev, messageTemplates: updatedTemplates }));
        toast({ title: "Template Deleted", variant: "destructive" });
        setOpenTemplateDialog(false);
    }

    const handleAutomatedMessageToggle = (key: keyof SchoolSettings['automatedMessages'], checked: boolean) => {
        setSettings(prev => {
            const auto = prev.automatedMessages || {};
            const setting = auto[key] || { enabled: false, templateId: '' };
            return { ...prev, automatedMessages: { ...auto, [key]: { ...setting, enabled: checked } } }
        });
    };
    
    const handleAutomatedMessageTemplateChange = (key: keyof SchoolSettings['automatedMessages'], templateId: string) => {
        setSettings(prev => {
            const auto = prev.automatedMessages || {};
            const setting = auto[key] || { enabled: false, templateId: '' };
            return { ...prev, automatedMessages: { ...auto, [key]: { ...setting, templateId: templateId } } }
        });
    }
    
    const handleFactoryResetStep1 = async () => {
      if (!settings.historyClearPin) { toast({ title: "PIN Not Set", variant: 'destructive' }); return; }
      if (resetPin !== settings.historyClearPin) { toast({ title: "Incorrect PIN", variant: 'destructive' }); return; }
      setResetStep(2);
    };

    const handleConfirmFinalDeletion = async () => {
      setIsResetting(true);
      try { await deleteAllData(); setResetStep(3); } 
      catch (error: any) { toast({ title: 'Deletion Failed', description: `Could not delete data. ${error.message}`, variant: 'destructive'}); } 
      finally { setIsResetting(false); }
    };
    
    const handleResetDialogClose = (open: boolean) => {
        if (!open) setTimeout(() => { setResetStep(1); setResetPin(''); }, 300);
        setOpenFactoryResetDialog(open);
    }

    const automatedMessages = useMemo(() => ({
        admission: settings.automatedMessages?.admission || { enabled: false, templateId: '' },
        absentee: settings.automatedMessages?.absentee || { enabled: false, templateId: '' },
        payment: settings.automatedMessages?.payment || { enabled: false, templateId: '' },
        studentDeactivation: settings.automatedMessages?.studentDeactivation || { enabled: false, templateId: '' },
        teacherDeactivation: settings.automatedMessages?.teacherDeactivation || { enabled: false, templateId: '' },
    }), [settings.automatedMessages]);

  const tabs = [
    { value: 'school', label: 'School', icon: SettingsIcon, permission: 'settings' },
    { value: 'users', label: 'Users', icon: Users, permission: 'settings' },
    { value: 'appearance', label: 'Appearance', icon: Palette, permission: 'settings' },
    { value: 'grading', label: 'Grading', icon: Type, permission: 'settings' },
    { value: 'security', label: 'My Profile', icon: ShieldAlert, permission: 'any_primary_role' },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, permission: 'settings' },
    { value: 'history', label: 'History', icon: History, permission: 'settings' },
    { value: 'backup', label: 'Backup', icon: Database, permission: 'settings' },
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><SettingsIcon className="w-8 h-8" />Settings</h1>
        {!canEdit && (
            <Alert variant="default" className="border-primary/30 bg-primary/5 text-primary-foreground">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Read-Only Mode</AlertTitle>
                <AlertDescription>
                   You are viewing this page in read-only mode. You can view your profile, but cannot change school-wide settings.
                </AlertDescription>
            </Alert>
        )}
      </div>
      
      <Tabs defaultValue={canEdit ? "school" : "security"} className="w-full">
        <TabsList className={cn("grid w-full h-auto", canEdit ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8' : 'grid-cols-1')}>
            {tabs.filter(tab => {
                if (tab.permission === 'any_primary_role') return true;
                return hasPermission(tab.permission);
            }).map(tab => <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm">{tab.label}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="school" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>Update your school's details. This information will appear on receipts and reports.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"> <Label htmlFor="schoolName">School Name</Label> <Input id="schoolName" value={settings.schoolName} onChange={handleInputChange} disabled={!canEdit}/> </div>
                    <div className="space-y-2"> <Label htmlFor="academicYear">Academic Year</Label> <Select value={settings.academicYear} onValueChange={handleSelectChange('academicYear')} disabled={!canEdit}> <SelectTrigger id="academicYear"> <SelectValue placeholder="Select Year" /> </SelectTrigger> <SelectContent> {generateAcademicYears().map(year => ( <SelectItem key={year} value={year}>{year}</SelectItem> ))} </SelectContent> </Select> </div>
                </div>
                <div className="space-y-2"> <Label htmlFor="schoolAddress">School Address</Label> <Textarea id="schoolAddress" value={settings.schoolAddress} onChange={handleInputChange} disabled={!canEdit}/> </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"> <Label htmlFor="schoolPhone">Phone Number</Label> <Input id="schoolPhone" value={settings.schoolPhone} onChange={handleInputChange} disabled={!canEdit}/> </div>
                    <div className="space-y-2"> <Label htmlFor="schoolEmail">School Email</Label> <Input id="schoolEmail" type="email" value={settings.schoolEmail} onChange={handleInputChange} disabled={!canEdit}/> </div>
                    <div className="space-y-2"> <Label htmlFor="timezone">Timezone</Label> 
                        <Select value={settings.timezone} onValueChange={handleSelectChange('timezone')} disabled={!canEdit}>
                            <SelectTrigger id="timezone"><Globe className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue/></SelectTrigger>
                            <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
                        </Select>
                     </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                    <div className="space-y-2"> <Label htmlFor="schoolLogo">School Logo</Label> <Input id="schoolLogoInput" name="schoolLogo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'schoolLogo')} disabled={!canEdit}/> </div>
                    <div className="space-y-2"> <Label htmlFor="principalSignature">Principal's Signature</Label> <Input id="principalSignatureInput" name="principalSignature" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'principalSignature')} disabled={!canEdit}/> </div>
                    <div className="space-y-2"> <Label htmlFor="favicon">Favicon</Label> <Input id="faviconInput" name="favicon" type="file" accept="image/x-icon,image/png,image/svg+xml" onChange={(e) => handleFileChange(e, 'favicon')} disabled={!canEdit}/> </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6">
                    {settings.schoolLogo && <div className="space-y-2"> <Label>Logo Preview</Label> <div className="flex items-center gap-4 p-4 border rounded-md"> <Image src={settings.schoolLogo} alt="School Logo Preview" width={60} height={60} /> <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, schoolLogo: ''}))} disabled={!canEdit}>Remove</Button> </div> </div>}
                    {settings.principalSignature && <div className="space-y-2"> <Label>Signature Preview</Label> <div className="flex items-center gap-4 p-4 border rounded-md bg-white"> <Image src={settings.principalSignature} alt="Principal Signature Preview" width={100} height={60} /> <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, principalSignature: ''}))} disabled={!canEdit}>Remove</Button> </div> </div>}
                    {settings.favicon && <div className="space-y-2"> <Label>Favicon Preview</Label> <div className="flex items-center gap-4 p-4 border rounded-md"> <Image src={settings.favicon} alt="Favicon Preview" width={32} height={32} /> <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, favicon: ''}))} disabled={!canEdit}>Remove</Button> </div> </div>}
                </div>
                {canEdit && <div className="flex justify-end"> <Button onClick={handleSave}>Save Changes</Button> </div>}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6"> <UserManagement /> </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline"><Palette/> Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
               <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium flex items-center gap-2 font-headline"><PlayCircle /> Preloader Animation</h3>
                    <Switch checked={localPreloaderEnabled} onCheckedChange={setLocalPreloaderEnabled} disabled={!canEdit}/>
                  </div>
                  <p className="text-sm text-muted-foreground">Choose the loading animation that displays while data is being fetched.</p>
                  <RadioGroup value={localPreloaderStyle} onValueChange={setLocalPreloaderStyle} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" disabled={!localPreloaderEnabled || !canEdit}>
                    {Array.from({length: 8}, (_, i) => `style${i+1}`).map(style => (
                        <div key={style}>
                            <RadioGroupItem value={style} id={style} className="sr-only peer" />
                            <Label htmlFor={style} className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4", !localPreloaderEnabled && "opacity-50", !canEdit && "cursor-not-allowed")}>
                                <div className="w-16 h-16 flex items-center justify-center"> <Preloader style={style} /> </div>
                                {localPreloaderStyle === style && <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5"> <CheckCircle className="w-4 h-4" /> </div>}
                            </Label>
                        </div>
                    ))}
                  </RadioGroup>
               </div>
                {canEdit && <div className="flex justify-end border-t pt-6"> <Button onClick={handleAppearanceSave}>Save Appearance</Button> </div>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="grading" className="mt-6">
            <Card>
                <CardHeader><CardTitle>Grading System</CardTitle><CardDescription>Define grades and their percentage ranges.</CardDescription></CardHeader>
                <CardContent>
                    <div className="border rounded-lg w-full overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Grade Name</TableHead><TableHead>Minimum Percentage (%)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {(settings.gradingSystem || []).map((grade, index) => (
                                    <TableRow key={index}>
                                        <TableCell> <Input value={grade.name} onChange={(e) => handleGradeChange(index, 'name', e.target.value)} disabled={!canEdit}/> </TableCell>
                                        <TableCell> <Input type="number" value={grade.minPercentage} onChange={(e) => handleGradeChange(index, 'minPercentage', Number(e.target.value))} disabled={!canEdit}/> </TableCell>
                                        <TableCell className="text-right"> <Button variant="ghost" size="icon" onClick={() => removeGradeRow(index)} disabled={!canEdit}> <Trash2 className="h-4 w-4 text-destructive" /> </Button> </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {canEdit && <div className="flex justify-between items-center mt-4">
                        <Button variant="outline" onClick={addGradeRow}><PlusCircle className="mr-2 h-4 w-4" /> Add Grade</Button>
                        <Button onClick={() => { addActivityLog({ action: 'Update Grading System', description: 'Modified the grading system.' }); handleSave(); }}>Save Grading</Button>
                    </div>}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="security" className="mt-6">
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert />My Profile &amp; Security</CardTitle><CardDescription>Manage your credentials and security settings.</CardDescription></CardHeader>
                <CardContent className="space-y-6 max-w-2xl">
                     <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">Login Credentials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"> <Label htmlFor="email">Login Email</Label> <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled /> </div>
                            <div className="space-y-2"> <Label htmlFor="newPassword">New Password</Label> <div className="relative"> <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /> <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(p => !p)}> {showNewPassword ? <EyeOff/> : <Eye/>} </Button> </div> </div>
                        </div>
                    </div>
                    {canEdit && (
                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-medium text-lg">Security Features</h3>
                            <div className="space-y-2">
                                <h4 className="font-semibold">Security PIN</h4>
                                <p className="text-sm text-muted-foreground">Set a 4-digit PIN for history deletion and app unlock.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-sm">
                                    <div className="space-y-2"> <Label htmlFor="newPin">New PIN</Label> <Input id="newPin" type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value)} /> </div>
                                    <div className="space-y-2"> <Label htmlFor="confirmPin">Confirm PIN</Label> <Input id="confirmPin" type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} /> </div>
                                </div>
                            </div>
                            <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between items-center"> <h4 className="font-semibold">Auto-Lock</h4> <Switch id="autoLockEnabled" checked={settings.autoLockEnabled} onCheckedChange={(c) => setSettings(p => ({...p, autoLockEnabled: c }))} /> </div>
                                <p className="text-sm text-muted-foreground">Automatically lock after inactivity.</p>
                                <div className="space-y-2"> <Label htmlFor="autoLockDuration">Inactivity Duration (sec)</Label> <Input id="autoLockDuration" type="number" value={settings.autoLockDuration} onChange={(e) => setSettings(p => ({...p, autoLockDuration: Number(e.target.value)}))} disabled={!settings.autoLockEnabled} className="max-w-xs"/> </div>
                            </div>
                        </div>
                    )}
                    <div className="border-t pt-6 space-y-4">
                         <div className="space-y-2 max-w-sm">
                            <Label htmlFor="currentPasswordForSecurity">Current Password</Label>
                             <p className="text-xs text-muted-foreground">Required to change password.</p>
                            <div className="relative"> <Input id="currentPasswordForSecurity" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /> <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(p => !p)}> {showCurrentPassword ? <EyeOff/> : <Eye/>} </Button> </div>
                        </div>
                        <div className="flex justify-end"> <Button onClick={handleAccountSave}>Save Account &amp; Security</Button> </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="whatsapp" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <CardTitle>API Configuration</CardTitle>
                         {settings.whatsappConnectionStatus === 'connected' && <Badge className="bg-green-500 text-white"><Wifi/>Connected</Badge>}
                         {settings.whatsappConnectionStatus === 'failed' && <Badge variant="destructive"><WifiOff/>Failed</Badge>}
                         {settings.whatsappConnectionStatus === 'untested' && <Badge variant="secondary">Untested</Badge>}
                    </div>
                    <CardDescription>Select provider and enter API details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup value={settings.whatsappProvider} onValueChange={(v) => setSettings(p => ({...p, whatsappProvider: v as any, whatsappConnectionStatus: 'untested'}))} className="grid grid-cols-1 md:grid-cols-3 gap-4" disabled={!canEdit}>
                        <Label htmlFor="provider-none" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4", canEdit && "cursor-pointer")}> <RadioGroupItem value="none" id="provider-none" className="sr-only" /> <WifiOff className="mb-3 h-6 w-6" /> None (Disabled) </Label>
                        <Label htmlFor="provider-ultramsg" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4", canEdit && "cursor-pointer")}> <RadioGroupItem value="ultramsg" id="provider-ultramsg" className="sr-only" /> <img src="https://ultramsg.com/assets/img/logo-dark.svg" alt="UltraMSG" className="w-24 h-6 mb-3"/> UltraMSG API </Label>
                        <Label htmlFor="provider-official" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4", canEdit && "cursor-pointer")}> <RadioGroupItem value="official" id="provider-official" className="sr-only" /> <div className="flex items-center gap-2 mb-3 h-6"> <img src="https://static.whatsapp.net/rsrc.php/v3/yI/r/r3d2Qj1f4vA.png" alt="WhatsApp" className="h-6 w-6"/> <span className="font-bold">WhatsApp</span> </div> Official API </Label>
                    </RadioGroup>
                    {settings.whatsappProvider === 'ultramsg' && <div className="p-4 border rounded-lg mt-4 space-y-4"> <h3 className="font-semibold">UltraMSG Credentials</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"> <Label htmlFor="whatsappApiUrl">API URL</Label> <Input id="whatsappApiUrl" value={settings.whatsappApiUrl} onChange={handleInputChange} disabled={!canEdit}/> </div> <div className="space-y-2"> <Label htmlFor="whatsappApiKey">Token</Label> <Input id="whatsappApiKey" value={settings.whatsappApiKey} onChange={handleInputChange} disabled={!canEdit}/> </div> </div> </div>}
                    {settings.whatsappProvider === 'official' && <div className="p-4 border rounded-lg mt-4 space-y-4"> <h3 className="font-semibold">Official API Credentials</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="space-y-2"> <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label> <Input id="whatsappPhoneNumberId" value={settings.whatsappPhoneNumberId || ''} onChange={handleInputChange} disabled={!canEdit}/> </div> <div className="space-y-2"> <Label htmlFor="whatsappAccessToken">Access Token</Label> <Input id="whatsappAccessToken" value={settings.whatsappAccessToken || ''} onChange={handleInputChange} disabled={!canEdit}/> </div> </div> </div>}
                    {canEdit && <div className="border-t pt-4 mt-4 space-y-4"> <div className="flex flex-col md:flex-row md:items-end gap-4"> <div className="space-y-2 flex-grow"> <Label htmlFor="testPhoneNumber">Test Phone Number</Label> <Input id="testPhoneNumber" value={testPhoneNumber} onChange={(e) => setTestPhoneNumber(e.target.value)} /> </div> <div className="flex gap-2"> <Button onClick={handleSave}><KeyRound className="mr-2"/>Save</Button> <Button variant="outline" onClick={handleTestConnection} disabled={isTesting || settings.whatsappProvider === 'none'}> {isTesting ? <Loader2 className="mr-2 animate-spin"/> : <TestTubeDiagonal className="mr-2"/>} {isTesting ? 'Testing...' : 'Test'} </Button> </div> </div> </div>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Automated Notifications</CardTitle><CardDescription>Enable/disable automated messages for specific events.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg space-y-4"> <div className="flex items-center justify-between"> <div><Label htmlFor="admission-toggle" className="font-semibold">Admission Confirmation</Label><p className="text-xs text-muted-foreground">Sent on new admission.</p></div> <Switch id="admission-toggle" checked={automatedMessages.admission.enabled} onCheckedChange={(c) => handleAutomatedMessageToggle('admission', c)} disabled={!canEdit}/> </div> <Select value={automatedMessages.admission.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('admission', id)} disabled={!automatedMessages.admission.enabled || !canEdit}> <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger> <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent> </Select> </div>
                    <div className="p-4 border rounded-lg space-y-4"> <div className="flex items-center justify-between"> <div><Label htmlFor="absentee-toggle" className="font-semibold">Absentee Notice</Label><p className="text-xs text-muted-foreground">Sent on notifying absentees.</p></div> <Switch id="absentee-toggle" checked={automatedMessages.absentee.enabled} onCheckedChange={(c) => handleAutomatedMessageToggle('absentee', c)} disabled={!canEdit}/> </div> <Select value={automatedMessages.absentee.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('absentee', id)} disabled={!automatedMessages.absentee.enabled || !canEdit}> <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger> <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent> </Select> </div>
                    <div className="p-4 border rounded-lg space-y-4"> <div className="flex items-center justify-between"> <div><Label htmlFor="payment-toggle" className="font-semibold">Fee Payment Receipt</Label><p className="text-xs text-muted-foreground">Sent on fee collection.</p></div> <Switch id="payment-toggle" checked={automatedMessages.payment.enabled} onCheckedChange={(c) => handleAutomatedMessageToggle('payment', c)} disabled={!canEdit}/> </div> <Select value={automatedMessages.payment.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('payment', id)} disabled={!automatedMessages.payment.enabled || !canEdit}> <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger> <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent> </Select> </div>
                    <div className="p-4 border rounded-lg space-y-4"> <div className="flex items-center justify-between"> <div><Label htmlFor="student-deactivation-toggle" className="font-semibold">Student Deactivation</Label><p className="text-xs text-muted-foreground">Sent on auto-deactivation.</p></div> <Switch id="student-deactivation-toggle" checked={automatedMessages.studentDeactivation.enabled} onCheckedChange={(c) => handleAutomatedMessageToggle('studentDeactivation', c)} disabled={!canEdit}/> </div> <Select value={automatedMessages.studentDeactivation.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('studentDeactivation', id)} disabled={!automatedMessages.studentDeactivation.enabled || !canEdit}> <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger> <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent> </Select> </div>
                    <div className="p-4 border rounded-lg space-y-4"> <div className="flex items-center justify-between"> <div><Label htmlFor="teacher-deactivation-toggle" className="font-semibold">Teacher Deactivation</Label><p className="text-xs text-muted-foreground">Sent on auto-deactivation.</p></div> <Switch id="teacher-deactivation-toggle" checked={automatedMessages.teacherDeactivation.enabled} onCheckedChange={(c) => handleAutomatedMessageToggle('teacherDeactivation', c)} disabled={!canEdit}/> </div> <Select value={automatedMessages.teacherDeactivation.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('teacherDeactivation', id)} disabled={!automatedMessages.teacherDeactivation.enabled || !canEdit}> <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger> <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent> </Select> </div>
                </CardContent>
            </Card>
            <Card className="bg-green-500/5">
                <CardHeader> <CardTitle className="flex items-center gap-2"><MessageSquare className="text-green-700"/>Custom Messaging</CardTitle> </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="p-4 bg-background/70 rounded-lg space-y-4">
                            <div className="space-y-2"> <Label>Send To:</Label> <RadioGroup value={sendTarget} onValueChange={setSendTarget} className="flex flex-wrap gap-x-4 gap-y-2" disabled={!canEdit}> <div className="flex items-center space-x-2"><RadioGroupItem value="all_families" id="r1" /><Label htmlFor="r1">All Families</Label></div> <div className="flex items-center space-x-2"><RadioGroupItem value="class" id="r2" /><Label htmlFor="r2">Specific Class</Label></div> <div className="flex items-center space-x-2"><RadioGroupItem value="family" id="r3" /><Label htmlFor="r3">Specific Family</Label></div> <div className="flex items-center space-x-2"><RadioGroupItem value="all_teachers" id="r5" /><Label htmlFor="r5">All Teachers</Label></div> <div className="flex items-center space-x-2"><RadioGroupItem value="teacher" id="r6" /><Label htmlFor="r6">Specific Teacher</Label></div> <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="r4" /><Label htmlFor="r4">Custom Numbers</Label></div> </RadioGroup> </div>
                            {sendTarget === 'class' && <div className="space-y-2"> <Label htmlFor="target-class">Select Class</Label> <Select value={targetClass} onValueChange={setTargetClass} disabled={!canEdit}> <SelectTrigger id="target-class"><SelectValue placeholder="Select a class" /></SelectTrigger> <SelectContent> {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)} </SelectContent> </Select> </div>}
                            {sendTarget === 'family' && <div className="space-y-2"> <Label htmlFor="target-family">Family ID</Label> <Input id="target-family" value={targetFamilyId} onChange={e => setTargetFamilyId(e.target.value)} disabled={!canEdit}/> </div>}
                            {sendTarget === 'teacher' && <div className="space-y-2"> <Label htmlFor="target-teacher">Select Teacher</Label> <Select value={targetTeacherId} onValueChange={setTargetTeacherId} disabled={!canEdit}> <SelectTrigger id="target-teacher"><SelectValue placeholder="Select a teacher" /></SelectTrigger> <SelectContent> {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)} </SelectContent> </Select> </div>}
                            {sendTarget === 'custom' && <div className="space-y-2"> <Label htmlFor="custom-numbers">Custom Numbers</Label> <Textarea id="custom-numbers" value={customNumbers} onChange={e => setCustomNumbers(e.target.value)} disabled={!canEdit}/> </div>}
                            <div className="space-y-2"> <Label htmlFor="message">Message:</Label> <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} disabled={!canEdit}/> <p className="text-xs text-muted-foreground">Variables: {'{student_name}, {father_name}, {teacher_name}, {class}, {school_name}'}</p> </div>
                            <div className="space-y-2"> <Label>Quick Templates</Label> <div className="flex flex-wrap gap-2"> {(settings.messageTemplates || []).map(template => ( <Button key={template.id} size="sm" variant="outline" onClick={() => handleTemplateClick(template.content)} disabled={!canEdit}> {template.name} </Button> ))} </div> </div>
                            {canEdit && <div className="flex justify-end items-center gap-2 pt-4"> <Button variant="secondary" className="bg-green-600 text-white hover:bg-green-700" onClick={handleSendMessage} disabled={isSending}> {isSending ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2"/>} {isSending ? 'Sending...' : 'Send'} </Button> </div>}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader> <div className="flex justify-between items-center"> <CardTitle>Message Templates</CardTitle> {canEdit && <Button onClick={() => handleOpenTemplateDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/> New Template</Button>} </div> <CardDescription>Create/edit message templates.</CardDescription> </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Content</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {settings.messageTemplates?.map(template => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell className="text-muted-foreground truncate max-w-sm">{template.content}</TableCell>
                                        <TableCell className="text-right"> {canEdit && <Button variant="ghost" size="icon" onClick={() => handleOpenTemplateDialog(template)}> <PenSquare className="h-4 w-4" /> </Button>} </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-start">
                <div> <CardTitle>Activity History</CardTitle> <CardDescription>Log of important system activities.</CardDescription> </div>
                {canEdit && (
                    <AlertDialog open={openClearHistoryDialog} onOpenChange={setOpenClearHistoryDialog}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Clear History</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader> <AlertDialogTitle>Enter PIN</AlertDialogTitle> <AlertDialogDescription> This action is irreversible. Enter your 4-digit PIN to confirm. </AlertDialogDescription> </AlertDialogHeader>
                            <div className="flex justify-center py-4"> <Input type="password" maxLength={4} className="w-48 text-center text-2xl tracking-[1rem]" value={clearHistoryPin} onChange={(e) => setClearHistoryPin(e.target.value)} /> </div>
                            <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleConfirmClearHistory}>Confirm &amp; Delete</AlertDialogAction> </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                    <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {activityLog.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'PPP p')}</TableCell>
                            <TableCell>{log.user}</TableCell>
                            <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                            <TableCell>{log.description}</TableCell>
                        </TableRow>
                        ))}
                        {activityLog.length === 0 && <TableRow><TableCell colSpan={4} className="text-center h-24">No activity recorded.</TableCell></TableRow>}
                    </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="backup" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Backup &amp; Restore</CardTitle><CardDescription>Manage application data backups.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2"> <h3 className="font-medium">Create Backup</h3> <p className="text-sm text-muted-foreground">Download a complete backup as a JSON file.</p> <Button variant="outline" onClick={handleCreateBackup} disabled={!canEdit}><Download className="mr-2"/>Download</Button> </div>
                    <div className="space-y-2"> <h3 className="font-medium">Restore from Backup</h3> <p className="text-sm text-muted-foreground">Upload a JSON backup file to restore data.</p> <div className="flex items-center gap-2"> <Label htmlFor="backup-file" className="sr-only">Restore</Label> <Input id="backup-file" type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} /> <Button onClick={() => document.getElementById('backup-file')?.click()} disabled={!canEdit}><Upload className="mr-2"/>Restore</Button> </div> </div>
                </div>
                 <div className="border-t pt-6 space-y-2"> <h3 className="font-medium">Seed Database</h3> <p className="text-sm text-muted-foreground">Populate with sample data. Overwrites existing data.</p> <Button variant="destructive" onClick={seedDatabase} disabled={!canEdit}><Database className="mr-2"/>Seed Sample Data</Button> </div>
                <div className="border-t border-destructive pt-6 space-y-2">
                    <h3 className="font-medium text-destructive flex items-center gap-2"><AlertTriangle /> Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">Permanently delete all data.</p>
                    <AlertDialog open={openFactoryResetDialog} onOpenChange={handleResetDialogClose}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!canEdit}>Factory Reset</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          {resetStep === 1 && <> <AlertDialogHeader> <AlertDialogTitle>Factory Reset: Step 1 of 2</AlertDialogTitle> <AlertDialogDescription> Enter your security PIN. </AlertDialogDescription> </AlertDialogHeader> <div className="py-4 space-y-2"> <Label htmlFor="reset-pin">Security PIN</Label> <Input id="reset-pin" type="password" maxLength={4} value={resetPin} onChange={(e) => setResetPin(e.target.value)} /> </div> <AlertDialogFooter> <AlertDialogCancel>Cancel</AlertDialogCancel> <AlertDialogAction onClick={handleFactoryResetStep1} disabled={isResetting}> Verify PIN </AlertDialogAction> </AlertDialogFooter> </>}
                          {resetStep === 2 && <> <AlertDialogHeader> <AlertDialogTitle className="text-destructive">Final Confirmation</AlertDialogTitle> <AlertDialogDescription> This will <strong className="text-destructive">PERMANENTLY DELETE ALL DATA</strong>. </AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <Button variant="ghost" onClick={() => setResetStep(1)}>Back</Button> <AlertDialogAction onClick={handleConfirmFinalDeletion} disabled={isResetting} className="bg-destructive hover:bg-destructive/90"> {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Yes, Delete </AlertDialogAction> </AlertDialogFooter> </>}
                          {resetStep === 3 && <> <AlertDialogHeader> <AlertDialogTitle className="text-destructive">Reset Complete</AlertDialogTitle> <AlertDialogDescription> All data has been deleted. Reloading...</AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <Button onClick={() => window.location.reload()}>Reload</Button> </AlertDialogFooter> </>}
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
       <Dialog open={openTemplateDialog} onOpenChange={setOpenTemplateDialog}>
        <DialogContent>
            <DialogHeader><DialogTitle>{isEditingTemplate ? 'Edit' : 'Add'} Template</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2"> <Label htmlFor="template-name">Name</Label> <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} /> </div>
                <div className="space-y-2"> <Label htmlFor="template-content">Content</Label> <Textarea id="template-content" value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} rows={5} /> <p className="text-xs text-muted-foreground">Variables: {'{student_name}, {father_name}, {class}, {school_name}, {paid_amount}, {remaining_dues}'}</p> </div>
            </div>
            <DialogFooter className="justify-between">
                <div> {isEditingTemplate && <Button variant="destructive" onClick={handleDeleteTemplate}>Delete</Button>} </div>
                <div className="flex gap-2"> <Button variant="ghost" onClick={() => setOpenTemplateDialog(false)}>Cancel</Button> <Button onClick={handleSaveTemplate}>Save</Button> </div>
            </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}
