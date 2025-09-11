

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, KeyRound, Loader2, TestTubeDiagonal, MessageSquare, Send, Eye, EyeOff, Settings as SettingsIcon, Info, UserCog, Palette, Type, PenSquare, Trash2, PlusCircle, History, Database, ShieldAlert, Wifi, WifiOff, Bell, BellOff, Lock, AlertTriangle, PlayCircle, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';
import type { Grade, MessageTemplate } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { auth } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Switch } from '@/components/ui/switch';
import { Preloader } from '@/components/ui/preloader';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/services/storage-service';


export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { students, families, fees, loadData, addActivityLog, activityLog, seedDatabase, clearActivityLog, classes: dataClasses, deleteAllData } = useData();
  const { toast } = useToast();
  
  // Custom Messaging State
  const [message, setMessage] = useState('');
  const [sendTarget, setSendTarget] = useState('all');
  const [targetClass, setTargetClass] = useState('');
  const [targetFamilyId, setTargetFamilyId] = useState('');
  const [customNumbers, setCustomNumbers] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');


  // Account settings state
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

  // Template Editor State
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  
  // Factory Reset State
  const [openFactoryResetDialog, setOpenFactoryResetDialog] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPin, setResetPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  

  const classes = useMemo(() => (dataClasses || []).map(c => c.name), [dataClasses]);
  
  const handleSave = () => {
    addActivityLog({ user: 'Admin', action: 'Update Settings', description: 'Updated school information settings.' });
    toast({
      title: 'Settings Saved',
      description: 'Your school information has been updated.',
    });
  };
  
  const handleAccountSave = async () => {
    if (newPassword && !currentPassword) {
      toast({ title: 'Current password is required to set a new one.', variant: 'destructive'});
      return;
    }
    
    if (newPin && newPin !== confirmPin) {
        toast({ title: 'PINs do not match.', variant: 'destructive'});
        return;
    }
    
    const user = auth.currentUser;
    if (!user || !user.email) {
        toast({ title: 'You must be logged in to change settings.', variant: 'destructive' });
        return;
    }
    if (!currentPassword) {
        toast({ title: 'Please enter your current password to save changes.', variant: 'destructive' });
        return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    let changesMade = false;

    try {
        await reauthenticateWithCredential(user, credential);
        // User re-authenticated. Now we can change things.
        
        if (newPassword) {
            await updatePassword(user, newPassword);
            changesMade = true;
        }
        
        if (newPin) {
            setSettings(prev => ({ ...prev, historyClearPin: newPin }));
            changesMade = true;
        }
        
        if(settings.autoLockEnabled) {
            changesMade = true;
        }

        setSettings(prev => ({ ...prev, historyClearPin: newPin || prev.historyClearPin }));

        if (changesMade) {
             addActivityLog({ user: 'Admin', action: 'Update Credentials', description: 'Updated admin login credentials or PIN.' });
             toast({
                title: "Account Settings Saved",
                description: "Your changes have been saved successfully.",
             });
        } else {
             toast({
                title: "No Changes",
                description: "No new information was provided to save.",
             });
        }
        
        // Clear password fields after operation
        setCurrentPassword('');
        setNewPassword('');
        setNewPin('');
        setConfirmPin('');

    } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/wrong-password') {
             toast({ title: 'Authentication Failed', description: 'The password you entered is incorrect.', variant: 'destructive' });
        } else {
             toast({ title: 'An error occurred', description: error.message, variant: 'destructive' });
        }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setSettings(prev => {
        const valueToSet = isCheckbox ? checked : value;
        const newSettings = {...prev, [id]: valueToSet};
        if (['whatsappApiUrl', 'whatsappApiKey', 'whatsappInstanceId'].includes(id)) {
            newSettings.whatsappConnectionStatus = 'untested';
        }
        return newSettings;
    });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'schoolLogo' | 'principalSignature' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
        setIsUploading(field);
        try {
            const downloadURL = await uploadFile(file, `images/${field}`);
            setSettings(prev => ({...prev, [field]: downloadURL}));
            toast({ title: 'Upload Successful', description: `Your ${field.replace('school', '')} has been updated.` });
        } catch (error) {
            console.error(`Error uploading ${field}:`, error);
            toast({ title: 'Upload Failed', description: `Could not upload the ${field}.`, variant: 'destructive' });
        } finally {
            setIsUploading(null);
        }
    }
  };

  const handleSelectChange = (id: keyof typeof settings) => (value: string) => {
    setSettings(prev => ({ ...prev, [id]: value }));
  };
  
  const generateAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 2; i++) {
        const startYear = currentYear + i;
        years.push(`${startYear}-${startYear + 1}`);
    }
    return years;
  };
  
  const handleCreateBackup = () => {
    const backupData = {
        students,
        families,
        fees,
        settings,
        activityLog
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `educentral-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
     toast({
      title: 'Backup Created',
      description: 'Your data has been successfully downloaded.',
    });
     addActivityLog({ user: 'Admin', action: 'Create Backup', description: 'Downloaded a backup of all application data.' });
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: 'No file selected', variant: 'destructive'});
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const restoredData = JSON.parse(result);
          
          if (restoredData.settings && restoredData.students && restoredData.families && restoredData.fees) {
             loadData(restoredData);
             setSettings(restoredData.settings);
             toast({
                title: 'Restore Successful',
                description: 'Data has been restored from the backup file.',
             });
          } else {
             throw new Error("Invalid backup file structure.");
          }
        }
      } catch (error) {
        toast({
          title: 'Restore Failed',
          description: 'The selected file is not a valid backup file.',
          variant: 'destructive',
        });
        console.error('Error parsing backup file:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };
  
  const handleTemplateClick = (template: string) => {
    setMessage(template);
  };
  
  const handleConfirmClearHistory = () => {
    if (!settings.historyClearPin) {
        toast({ title: "PIN Not Set", description: "Please set a history deletion PIN in the Account tab first.", variant: 'destructive'});
        return;
    }
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
    if (!message) {
      toast({ title: 'Message is empty', description: 'Please write a message to send.', variant: 'destructive' });
      return;
    }
    setIsSending(true);

    let recipients: { phone: string, context: Record<string, string> }[] = [];
    let targetDescription = '';

    switch (sendTarget) {
        case 'all':
            recipients = families.map(f => ({ phone: f.phone, context: { '{father_name}': f.fatherName, '{school_name}': settings.schoolName } }));
            targetDescription = `all ${recipients.length} families`;
            break;
        case 'class':
            if (!targetClass) {
                 toast({ title: 'No class selected', description: 'Please select a class to send messages to.', variant: 'destructive' });
                 setIsSending(false);
                 return;
            }
            const studentsInClass = students.filter(s => s.class === targetClass);
            const familyIds = [...new Set(studentsInClass.map(s => s.familyId))];
            recipients = families
                .filter(f => familyIds.includes(f.id))
                .map(f => ({ 
                    phone: f.phone, 
                    context: { 
                        '{father_name}': f.fatherName, 
                        '{student_name}': students.find(s => s.familyId === f.id)?.name || '',
                        '{class}': targetClass,
                        '{school_name}': settings.schoolName
                    } 
                }));
            targetDescription = `families of class ${targetClass}`;
            break;
        case 'family':
             if (!targetFamilyId) {
                 toast({ title: 'No family ID entered', description: 'Please enter a family ID.', variant: 'destructive' });
                 setIsSending(false);
                 return;
            }
            const family = families.find(f => f.id === targetFamilyId);
            if (!family) {
                 toast({ title: 'Family not found', description: `Family with ID ${targetFamilyId} does not exist.`, variant: 'destructive' });
                 setIsSending(false);
                 return;
            }
            recipients = [{ 
                phone: family.phone, 
                context: { 
                    '{father_name}': family.fatherName, 
                    '{student_name}': students.find(s => s.familyId === family.id)?.name || '',
                    '{class}': students.find(s => s.familyId === family.id)?.class || '',
                    '{school_name}': settings.schoolName
                } 
            }];
            targetDescription = `family ${family.fatherName} (${family.id})`;
            break;
        case 'custom':
            if (!customNumbers) {
                 toast({ title: 'No numbers entered', description: 'Please enter phone numbers.', variant: 'destructive' });
                 setIsSending(false);
                 return;
            }
            recipients = customNumbers.split(',').map(num => ({ phone: num.trim(), context: {'{school_name}': settings.schoolName} }));
            targetDescription = 'custom numbers';
            break;
    }

    if (recipients.length === 0) {
      toast({ title: 'No Recipients', description: 'No recipients found for the selected criteria.', variant: 'destructive' });
      setIsSending(false);
      return;
    }

    toast({ title: 'Sending Messages', description: `Preparing to send messages to ${recipients.length} recipient(s).` });
    
    addActivityLog({ user: 'Admin', action: 'Send WhatsApp Message', description: `Sent custom message to ${recipients.length} recipients in ${targetDescription}.`, recipientCount: recipients.length });
    
    let successCount = 0;
    for (const recipient of recipients) {
        let personalizedMessage = message;
        for (const key in recipient.context) {
            personalizedMessage = personalizedMessage.replace(new RegExp(key, 'g'), recipient.context[key]);
        }
        
        try {
             const success = await sendWhatsAppMessage(recipient.phone, personalizedMessage, settings.whatsappApiUrl, settings.whatsappApiKey, settings.whatsappInstanceId, settings.whatsappPriority);
             if (success) {
                successCount++;
             }
            await sleep(Number(settings.messageDelay) * 1000 || 2000); 
        } catch (error) {
            console.error(`Failed to send message to ${recipient.phone}`, error);
        }
    }
    
    toast({ title: 'Process Complete', description: `Successfully sent messages to ${successCount} out of ${recipients.length} recipients.` });
    setIsSending(false);
  };
  
    const handleTestConnection = async () => {
        setIsTesting(true);
        setSettings(prev => ({...prev, whatsappConnectionStatus: 'untested'}));
        if (!testPhoneNumber) {
            toast({ title: 'Test Failed', description: 'Please enter a phone number to send the test message to.', variant: 'destructive' });
            setIsTesting(false);
            setSettings(prev => ({...prev, whatsappConnectionStatus: 'failed'}));
            return;
        }
        try {
            const success = await sendWhatsAppMessage(
                testPhoneNumber,
                `This is a test message from ${settings.schoolName}.`, 
                settings.whatsappApiUrl, 
                settings.whatsappApiKey, 
                settings.whatsappInstanceId, 
                settings.whatsappPriority
            );
            if (success) {
                toast({ title: 'Test Successful', description: 'Your WhatsApp API settings appear to be correct.' });
                setSettings(prev => ({...prev, whatsappConnectionStatus: 'connected'}));
            } else {
                setSettings(prev => ({...prev, whatsappConnectionStatus: 'failed'}));
                throw new Error("API returned failure. Check console for details.");
            }
        } catch (error: any) {
            toast({ title: 'Test Failed', description: error.message || 'Could not connect using the provided API settings.', variant: 'destructive' });
            setSettings(prev => ({...prev, whatsappConnectionStatus: 'failed'}));
        } finally {
            setIsTesting(false);
        }
    };
    
    const handleThemeColorChange = (variableName: string, value: string) => {
        document.documentElement.style.setProperty(variableName, value);
        // Also save it to settings so it persists
        setSettings(prev => ({
            ...prev,
            themeColors: {
                ...prev.themeColors,
                [variableName.replace('--', '')]: value
            }
        }));
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

    const removeGradeRow = (index: number) => {
        setSettings(prev => ({...prev, gradingSystem: (prev.gradingSystem || []).filter((_, i) => i !== index)}));
    };

    const handleOpenTemplateDialog = (template: MessageTemplate | null) => {
        if (template) {
            setIsEditingTemplate(true);
            setSelectedTemplate(template);
            setTemplateName(template.name);
            setTemplateContent(template.content);
        } else {
            setIsEditingTemplate(false);
            setSelectedTemplate(null);
            setTemplateName('');
            setTemplateContent('');
        }
        setOpenTemplateDialog(true);
    };

    const handleSaveTemplate = () => {
        if (!templateName.trim() || !templateContent.trim()) {
            toast({ title: "Cannot Save", description: "Template name and content cannot be empty.", variant: "destructive" });
            return;
        }

        const currentTemplates = settings.messageTemplates || [];
        
        if (isEditingTemplate && selectedTemplate) {
            // Update existing template
            const updatedTemplates = currentTemplates.map(t =>
                t.id === selectedTemplate.id ? { ...t, name: templateName, content: templateContent } : t
            );
            setSettings(prev => ({ ...prev, messageTemplates: updatedTemplates }));
            toast({ title: "Template Updated", description: `The "${templateName}" template has been saved.` });
        } else {
            // Add new template
            const newTemplate: MessageTemplate = {
                id: `TPL-${Date.now()}`,
                name: templateName,
                content: templateContent
            };
            setSettings(prev => ({ ...prev, messageTemplates: [...currentTemplates, newTemplate] }));
            toast({ title: "Template Added", description: `The "${templateName}" template has been added.` });
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
            const currentAutomatedMessages = prev.automatedMessages || {};
            const setting = currentAutomatedMessages[key] || { enabled: false, templateId: '' };
            return {
                ...prev,
                automatedMessages: {
                    ...currentAutomatedMessages,
                    [key]: {
                        ...setting,
                        enabled: checked
                    }
                }
            }
        });
    };
    
    const handleAutomatedMessageTemplateChange = (key: keyof SchoolSettings['automatedMessages'], templateId: string) => {
        setSettings(prev => {
            const currentAutomatedMessages = prev.automatedMessages || {};
             const setting = currentAutomatedMessages[key] || { enabled: false, templateId: '' };
            return {
                ...prev,
                automatedMessages: {
                    ...currentAutomatedMessages,
                    [key]: {
                        ...setting,
                        templateId: templateId
                    }
                }
            }
        });
    }
    
    const handleFactoryResetStep1 = async () => {
      if (!settings.historyClearPin) {
        toast({ title: "PIN Not Set", description: "Please set a security PIN in the Account tab first.", variant: 'destructive' });
        return;
      }
      if (resetPin !== settings.historyClearPin) {
        toast({ title: "Incorrect PIN", variant: 'destructive' });
        return;
      }
      setResetStep(2);
    };

    const handleConfirmFinalDeletion = async () => {
      setIsResetting(true);
      try {
        await deleteAllData();
        setResetStep(3);
      } catch (error: any) {
        toast({
          title: 'Deletion Failed',
          description: `Could not delete data. ${error.message}`,
          variant: 'destructive',
        });
      } finally {
        setIsResetting(false);
      }
    };
    
    const handleResetDialogClose = (open: boolean) => {
        if (!open) {
            setTimeout(() => {
                setResetStep(1);
                setResetPin('');
            }, 300);
        }
        setOpenFactoryResetDialog(open);
    }

    const automatedMessages = useMemo(() => ({
        admission: settings.automatedMessages?.admission || { enabled: false, templateId: '' },
        absentee: settings.automatedMessages?.absentee || { enabled: false, templateId: '' },
        payment: settings.automatedMessages?.payment || { enabled: false, templateId: '' },
        studentDeactivation: settings.automatedMessages?.studentDeactivation || { enabled: false, templateId: '' },
        teacherDeactivation: settings.automatedMessages?.teacherDeactivation || { enabled: false, templateId: '' },
    }), [settings.automatedMessages]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><SettingsIcon className="w-8 h-8" />Settings</h1>
      
      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-8 max-w-6xl">
          <TabsTrigger value="school">School</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="preloader">Preloader</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="security">Account &amp; Security</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>
        <TabsContent value="school" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>School Information</CardTitle>
                <CardDescription>Update your school's details. This information will appear on receipts and reports.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" value={settings.schoolName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select value={settings.academicYear} onValueChange={handleSelectChange('academicYear')}>
                        <SelectTrigger id="academicYear">
                        <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                        {generateAcademicYears().map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="schoolAddress">School Address</Label>
                    <Textarea id="schoolAddress" value={settings.schoolAddress} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="schoolPhone">Phone Number</Label>
                        <Input id="schoolPhone" value={settings.schoolPhone} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="schoolEmail">School Email (for OTP)</Label>
                        <Input id="schoolEmail" type="email" value={settings.schoolEmail} onChange={handleInputChange} placeholder="Enter a valid email address" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schoolLogo">School Logo</Label>
                        <Input id="schoolLogoInput" name="schoolLogo" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'schoolLogo')} className="file:text-primary file:font-medium" disabled={isUploading === 'schoolLogo'}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="principalSignature">Principal's Signature</Label>
                        <Input id="principalSignatureInput" name="principalSignature" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'principalSignature')} className="file:text-primary file:font-medium" disabled={isUploading === 'principalSignature'}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="favicon">Favicon (Browser Tab Icon)</Label>
                        <Input id="faviconInput" name="favicon" type="file" accept="image/x-icon,image/png,image/svg+xml" onChange={(e) => handleFileChange(e, 'favicon')} className="file:text-primary file:font-medium" disabled={isUploading === 'favicon'}/>
                    </div>
                </div>
                 <div className="flex gap-6">
                    {settings.schoolLogo && (
                        <div className="space-y-2">
                            <Label>Logo Preview</Label>
                            <div className="relative flex items-center gap-4 p-4 border rounded-md">
                                {isUploading === 'schoolLogo' && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                                <Image src={settings.schoolLogo} alt="School Logo Preview" width={60} height={60} className="object-contain rounded-md" />
                                <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, schoolLogo: ''}))}>Remove</Button>
                            </div>
                        </div>
                    )}
                    {settings.principalSignature && (
                        <div className="space-y-2">
                            <Label>Signature Preview</Label>
                            <div className="relative flex items-center gap-4 p-4 border rounded-md bg-white">
                                {isUploading === 'principalSignature' && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                                <Image src={settings.principalSignature} alt="Principal Signature Preview" width={100} height={60} className="object-contain" />
                                <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, principalSignature: ''}))}>Remove</Button>
                            </div>
                        </div>
                    )}
                    {settings.favicon && (
                        <div className="space-y-2">
                            <Label>Favicon Preview</Label>
                            <div className="relative flex items-center gap-4 p-4 border rounded-md">
                                 {isUploading === 'favicon' && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                                <Image src={settings.favicon} alt="Favicon Preview" width={32} height={32} className="object-contain" />
                                <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, favicon: ''}))}>Remove</Button>
                            </div>
                        </div>
                    )}
                 </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="theme" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette />Theme Customization</CardTitle>
                    <CardDescription>Customize the look and feel of the application to match your school's branding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">Fonts</h3>
                         <div className="space-y-2">
                            <Label htmlFor="font">Application Font</Label>
                            <Select value={settings.font} onValueChange={handleSelectChange('font')}>
                                <SelectTrigger id="font">
                                <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inter">Inter (Default)</SelectItem>
                                    <SelectItem value="roboto">Roboto</SelectItem>
                                    <SelectItem value="open-sans">Open Sans</SelectItem>
                                    <SelectItem value="lato">Lato</SelectItem>
                                    <SelectItem value="montserrat">Montserrat</SelectItem>
                                    <SelectItem value="poppins">Poppins</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">Main Theme</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="primary-color">Primary Color</Label>
                                <Input id="primary-color" type="color" value={settings.themeColors?.primary || '#6a3fdc'} onChange={e => handleThemeColorChange('--primary', e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="background-color">Background Color</Label>
                                <Input id="background-color" type="color" value={settings.themeColors?.background || '#f0f2f5'} onChange={e => handleThemeColorChange('--background', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accent-color">Accent Color</Label>
                                <Input id="accent-color" type="color" value={settings.themeColors?.accent || '#e9e1ff'} onChange={e => handleThemeColorChange('--accent', e.target.value)} />
                            </div>
                        </div>
                    </div>
                     <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">Sidebar Theme</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="sidebar-background-color">Background</Label>
                                <Input id="sidebar-background-color" type="color" value={settings.themeColors?.['sidebar-background'] || '#2c2a4a'} onChange={e => handleThemeColorChange('--sidebar-background', e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                <Label htmlFor="sidebar-foreground-color">Text</Label>
                                <Input id="sidebar-foreground-color" type="color" value={settings.themeColors?.['sidebar-foreground'] || '#f8f9fa'} onChange={e => handleThemeColorChange('--sidebar-foreground', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sidebar-accent-color">Accent</Label>
                                <Input id="sidebar-accent-color" type="color" value={settings.themeColors?.['sidebar-accent'] || '#403d6d'} onChange={e => handleThemeColorChange('--sidebar-accent', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="sidebar-accent-foreground-color">Accent Text</Label>
                                <Input id="sidebar-accent-foreground-color" type="color" value={settings.themeColors?.['sidebar-accent-foreground'] || '#ffffff'} onChange={e => handleThemeColorChange('--sidebar-accent-foreground', e.target.value)} />
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button onClick={() => {
                            addActivityLog({ user: 'Admin', action: 'Update Theme', description: 'Customized the application theme colors and fonts.' });
                            toast({ title: "Theme Saved", description: "Your new colors have been applied."});
                        }}>Save Theme</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="preloader" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Preloader Settings</CardTitle>
                    <CardDescription>Customize the loading animation shown when the application is busy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Switch id="preloaderEnabled" checked={settings.preloaderEnabled} onCheckedChange={(checked) => setSettings(prev => ({...prev, preloaderEnabled: checked}))}/>
                        <Label htmlFor="preloaderEnabled">Show Preloader</Label>
                    </div>
                    
                    <div>
                        <Label>Preloader Style</Label>
                        <RadioGroup 
                            value={settings.preloaderStyle}
                            onValueChange={(value) => setSettings(prev => ({...prev, preloaderStyle: value}))}
                            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2"
                        >
                            {Array.from({length: 8}, (_, i) => `style${i+1}`).map(styleName => (
                                <div key={styleName} className="relative">
                                    <RadioGroupItem value={styleName} id={styleName} className="sr-only peer" />
                                    <Label 
                                        htmlFor={styleName}
                                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                       <div className="flex items-center justify-center h-16 w-16">
                                          <Preloader style={styleName} />
                                       </div>
                                    </Label>
                                    <div className="absolute top-2 right-2 hidden peer-data-[state=checked]:block">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={() => toast({ title: "Preloader settings saved!"})}>
                            Save Preloader Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="grading" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Grading System</CardTitle>
                    <CardDescription>Define the grades and their corresponding percentage ranges. These will be used on result cards.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Grade Name (e.g., A+)</TableHead>
                                    <TableHead>Minimum Percentage (%)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(settings.gradingSystem || []).map((grade, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Input 
                                                value={grade.name} 
                                                onChange={(e) => handleGradeChange(index, 'name', e.target.value)}
                                                placeholder="e.g., A+"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                value={grade.minPercentage} 
                                                onChange={(e) => handleGradeChange(index, 'minPercentage', Number(e.target.value))}
                                                placeholder="e.g., 90"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => removeGradeRow(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <Button variant="outline" onClick={addGradeRow}><PlusCircle className="mr-2 h-4 w-4" /> Add Grade</Button>
                        <Button onClick={() => {
                             addActivityLog({ user: 'Admin', action: 'Update Grading System', description: 'Modified the grading system percentages.' });
                             handleSave();
                        }}>Save Grading System</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="security" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert />Account &amp; Security</CardTitle>
                    <CardDescription>Manage your login credentials and application security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-w-2xl">
                     <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">Login Credentials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Login Email</Label>
                                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(prev => !prev)}>
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-medium text-lg">Security Features</h3>
                         <div className="space-y-2">
                            <h4 className="font-semibold">Security PIN</h4>
                            <p className="text-sm text-muted-foreground">Set a 4-digit PIN for an extra layer of security when clearing history or unlocking the app.</p>
                             <div className="grid grid-cols-2 gap-4 max-w-sm">
                                <div className="space-y-2">
                                    <Label htmlFor="newPin">New PIN</Label>
                                    <Input id="newPin" type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value)} placeholder="4-digit PIN" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                                    <Input id="confirmPin" type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} placeholder="Confirm PIN" />
                                </div>
                             </div>
                        </div>
                        <div className="border-t pt-4 space-y-2">
                           <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Auto-Lock</h4>
                                <Switch id="autoLockEnabled" checked={settings.autoLockEnabled} onCheckedChange={(checked) => setSettings(prev => ({...prev, autoLockEnabled: checked }))} />
                            </div>
                            <p className="text-sm text-muted-foreground">Automatically lock the application after a period of inactivity.</p>
                            <div className="space-y-2">
                                <Label htmlFor="autoLockDuration">Inactivity Duration (seconds)</Label>
                                <Input id="autoLockDuration" type="number" value={settings.autoLockDuration} onChange={(e) => setSettings(prev => ({...prev, autoLockDuration: Number(e.target.value)}))} disabled={!settings.autoLockEnabled} className="max-w-xs"/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t pt-6 space-y-4">
                         <div className="space-y-2 max-w-sm">
                            <Label htmlFor="currentPasswordForSecurity">Current Password</Label>
                             <p className="text-xs text-muted-foreground">To save any changes on this page, please enter your current password.</p>
                            <div className="relative">
                                <Input id="currentPasswordForSecurity" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(prev => !prev)}>
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAccountSave}>Save Account &amp; Security</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <CardTitle>API Configuration</CardTitle>
                         {settings.whatsappConnectionStatus === 'connected' && <Badge className="bg-green-500 text-white"><Wifi className="mr-2 h-4 w-4"/>Connected</Badge>}
                         {settings.whatsappConnectionStatus === 'failed' && <Badge variant="destructive"><WifiOff className="mr-2 h-4 w-4"/>Failed</Badge>}
                         {settings.whatsappConnectionStatus === 'untested' && <Badge variant="secondary">Untested</Badge>}
                    </div>
                    <CardDescription>Enter your API details to enable messaging features.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={settings.whatsappProvider || 'ultramsg'} onValueChange={(value) => setSettings(prev => ({...prev, whatsappProvider: value as 'ultramsg' | 'official'}))}>
                        <TabsList>
                            <TabsTrigger value="ultramsg">UltraMSG API</TabsTrigger>
                            <TabsTrigger value="official">Official API</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ultramsg" className="mt-4 space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappApiUrl">API URL / Gateway</Label>
                                    <Input id="whatsappApiUrl" value={settings.whatsappApiUrl} onChange={handleInputChange} placeholder="e.g. https://api.ultramsg.com/instance12345" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappApiKey">Token (API Key)</Label>
                                    <Input id="whatsappApiKey" value={settings.whatsappApiKey} onChange={handleInputChange} placeholder="Enter UltraMSG Token" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappInstanceId">Instance ID</Label>
                                    <Input id="whatsappInstanceId" value={settings.whatsappInstanceId} onChange={handleInputChange} placeholder="e.g. instance12345" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappPriority">Priority</Label>
                                    <Input id="whatsappPriority" value={settings.whatsappPriority} onChange={handleInputChange} placeholder="e.g. 10" />
                                </div>
                            </div>
                        </TabsContent>
                         <TabsContent value="official" className="mt-4 space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
                                    <Input id="whatsappPhoneNumberId" placeholder="e.g., 10..." disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="whatsappAccessToken">Permanent Access Token</Label>
                                    <Input id="whatsappAccessToken" placeholder="e.g., EAA..." disabled />
                                </div>
                            </div>
                             <Alert variant="default">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Under Development</AlertTitle>
                                <AlertDescription>
                                    Direct integration with the Official WhatsApp Business API is under development. The fields above are placeholders.
                                </AlertDescription>
                            </Alert>
                         </TabsContent>
                    </Tabs>
                    <div className="flex items-center gap-4 pt-4 border-t mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="messageDelay">Message Delay (seconds)</Label>
                            <Input id="messageDelay" type="number" value={settings.messageDelay} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="border-t pt-4 mt-4 space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="testPhoneNumber">Test Phone Number</Label>
                            <Input id="testPhoneNumber" value={testPhoneNumber} onChange={(e) => setTestPhoneNumber(e.target.value)} placeholder="Enter a number with country code (e.g. 92300...)" />
                        </div>
                         <div className="flex justify-end items-center gap-2">
                            <Button onClick={handleSave}><KeyRound className="mr-2"/>Save WhatsApp Settings</Button>
                            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting || !settings.whatsappApiUrl || !settings.whatsappApiKey}>
                                {isTesting ? <Loader2 className="mr-2 animate-spin"/> : <TestTubeDiagonal className="mr-2"/>}
                                {isTesting ? 'Testing...' : 'Test Connection'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Automated Notifications</CardTitle>
                    <CardDescription>Enable or disable automated messages for specific events. These will be sent using your selected and configured API provider.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="admission-toggle" className="font-semibold">Admission Confirmation</Label>
                                <p className="text-xs text-muted-foreground">Sent when a new student is admitted.</p>
                            </div>
                            <Switch id="admission-toggle" checked={automatedMessages.admission.enabled} onCheckedChange={(checked) => handleAutomatedMessageToggle('admission', checked)} />
                        </div>
                        <Select value={automatedMessages.admission.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('admission', id)} disabled={!automatedMessages.admission.enabled}>
                            <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                            <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="absentee-toggle" className="font-semibold">Absentee Notice</Label>
                                <p className="text-xs text-muted-foreground">Sent when you notify absentees from the attendance page.</p>
                            </div>
                            <Switch id="absentee-toggle" checked={automatedMessages.absentee.enabled} onCheckedChange={(checked) => handleAutomatedMessageToggle('absentee', checked)} />
                        </div>
                        <Select value={automatedMessages.absentee.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('absentee', id)} disabled={!automatedMessages.absentee.enabled}>
                            <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                            <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="payment-toggle" className="font-semibold">Fee Payment Receipt</Label>
                                <p className="text-xs text-muted-foreground">Sent when a fee payment is collected.</p>
                            </div>
                            <Switch id="payment-toggle" checked={automatedMessages.payment.enabled} onCheckedChange={(checked) => handleAutomatedMessageToggle('payment', checked)} />
                        </div>
                        <Select value={automatedMessages.payment.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('payment', id)} disabled={!automatedMessages.payment.enabled}>
                            <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                            <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="student-deactivation-toggle" className="font-semibold">Student Deactivation Notice</Label>
                                <p className="text-xs text-muted-foreground">Sent when a student is auto-deactivated for too many absences.</p>
                            </div>
                            <Switch id="student-deactivation-toggle" checked={automatedMessages.studentDeactivation.enabled} onCheckedChange={(checked) => handleAutomatedMessageToggle('studentDeactivation', checked)} />
                        </div>
                        <Select value={automatedMessages.studentDeactivation.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('studentDeactivation', id)} disabled={!automatedMessages.studentDeactivation.enabled}>
                            <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                            <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="teacher-deactivation-toggle" className="font-semibold">Teacher Deactivation Notice</Label>
                                <p className="text-xs text-muted-foreground">Sent when a teacher is auto-deactivated for lates/absences.</p>
                            </div>
                            <Switch id="teacher-deactivation-toggle" checked={automatedMessages.teacherDeactivation.enabled} onCheckedChange={(checked) => handleAutomatedMessageToggle('teacherDeactivation', checked)} />
                        </div>
                         <Select value={automatedMessages.teacherDeactivation.templateId} onValueChange={(id) => handleAutomatedMessageTemplateChange('teacherDeactivation', id)} disabled={!automatedMessages.teacherDeactivation.enabled}>
                            <SelectTrigger><SelectValue placeholder="Select template..." /></SelectTrigger>
                            <SelectContent>{(settings.messageTemplates || []).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-green-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="text-green-700"/>Custom Messaging</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <div className="p-4 bg-background/70 rounded-lg space-y-4">
                            <div className="space-y-2">
                                <Label>Send To:</Label>
                                <RadioGroup value={sendTarget} onValueChange={setSendTarget} className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="r1" /><Label htmlFor="r1">All Families</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="class" id="r2" /><Label htmlFor="r2">Specific Class</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="family" id="r3" /><Label htmlFor="r3">Specific Family</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="r4" /><Label htmlFor="r4">Custom Numbers</Label></div>
                                </RadioGroup>
                            </div>

                            {sendTarget === 'class' && (
                                <div className="space-y-2">
                                    <Label htmlFor="target-class">Select Class</Label>
                                    <Select value={targetClass} onValueChange={setTargetClass}>
                                        <SelectTrigger id="target-class">
                                            <SelectValue placeholder="Select a class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map(c => <SelectItem key={c} value={c}>{c} Class</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                             {sendTarget === 'family' && (
                                <div className="space-y-2">
                                    <Label htmlFor="target-family">Family ID</Label>
                                    <Input id="target-family" value={targetFamilyId} onChange={e => setTargetFamilyId(e.target.value)} placeholder="Enter Family ID" />
                                </div>
                            )}

                            {sendTarget === 'custom' && (
                                <div className="space-y-2">
                                    <Label htmlFor="custom-numbers">Custom Numbers</Label>
                                    <Textarea id="custom-numbers" value={customNumbers} onChange={e => setCustomNumbers(e.target.value)} placeholder="Enter comma-separated phone numbers" />
                                </div>
                            )}

                             <div className="space-y-2">
                                <Label htmlFor="message">Message:</Label>
                                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={5} />
                                <p className="text-xs text-muted-foreground">Available variables: {'{student_name}, {father_name}, {class}, {school_name}'}</p>
                            </div>
                             <div className="space-y-2">
                                <Label>Quick Templates</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(settings.messageTemplates || []).map(template => (
                                        <Button key={template.id} size="sm" variant="outline" onClick={() => handleTemplateClick(template.content)}>
                                            {template.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-2 pt-4">
                                <Button variant="secondary" className="bg-green-600 text-white hover:bg-green-700" onClick={handleSendMessage} disabled={isSending}>
                                  {isSending ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2"/>}
                                  {isSending ? 'Sending...' : 'Send Message'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Message Templates</CardTitle>
                        <Button onClick={() => handleOpenTemplateDialog(null)}><PlusCircle className="mr-2 h-4 w-4"/> New Template</Button>
                    </div>
                    <CardDescription>Create, edit, or delete your WhatsApp message templates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Template Name</TableHead>
                                    <TableHead>Content</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {settings.messageTemplates?.map(template => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell className="text-muted-foreground truncate max-w-sm">{template.content}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenTemplateDialog(template)}>
                                                <PenSquare className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
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
              <div>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>A log of all important activities performed in the system.</CardDescription>
              </div>
               <AlertDialog open={openClearHistoryDialog} onOpenChange={setOpenClearHistoryDialog}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Clear All History</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enter PIN to Clear History</AlertDialogTitle>
                        <AlertDialogDescription>
                           This action is irreversible and will permanently delete all activity logs. Please enter your 4-digit security PIN to confirm.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-center py-4">
                        <Input 
                            type="password"
                            maxLength={4}
                            className="w-48 text-center text-2xl tracking-[1rem]"
                            value={clearHistoryPin}
                            onChange={(e) => setClearHistoryPin(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmClearHistory}>Confirm &amp; Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
               </AlertDialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'PPP p')}</TableCell>
                      <TableCell>{log.user}</TableCell>
                      <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                      <TableCell>{log.description}</TableCell>
                    </TableRow>
                  ))}
                  {activityLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No activity recorded yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="backup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup &amp; Restore</CardTitle>
              <CardDescription>Manage your application data backups.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-2">
                        <h3 className="font-medium">Create Backup</h3>
                        <p className="text-sm text-muted-foreground">Download a complete backup of your school data (students, fees, etc.) as a JSON file.</p>
                        <Button variant="outline" onClick={handleCreateBackup}><Download className="mr-2"/>Download Backup</Button>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-medium">Restore from Backup</h3>
                        <p className="text-sm text-muted-foreground">Upload a JSON backup file to restore your school data. This will overwrite existing data.</p>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="backup-file" className="sr-only">Restore</Label>
                            <Input id="backup-file" type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
                            <Button onClick={() => document.getElementById('backup-file')?.click()}><Upload className="mr-2"/>Restore Data</Button>
                        </div>
                    </div>
                </div>
                 <div className="border-t pt-6 space-y-2">
                    <h3 className="font-medium">Seed Database</h3>
                    <p className="text-sm text-muted-foreground">Populate the database with initial sample data. This is useful for first-time setup or for testing purposes. This will overwrite any existing data with the same IDs.</p>
                    <Button variant="destructive" onClick={seedDatabase}><Database className="mr-2"/>Seed Sample Data</Button>
                </div>
                <div className="border-t border-destructive pt-6 space-y-2">
                    <h3 className="font-medium text-destructive flex items-center gap-2"><AlertTriangle /> Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">This action is irreversible. It will permanently delete all students, families, fees, expenses, and other records from the database.</p>
                    <AlertDialog open={openFactoryResetDialog} onOpenChange={handleResetDialogClose}>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive">Factory Reset Application</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          {resetStep === 1 && (
                              <>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Factory Reset: Step 1 of 2</AlertDialogTitle>
                                      <AlertDialogDescription>
                                         This is a highly destructive action. To proceed, please enter your security PIN.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="py-4 space-y-2">
                                      <Label htmlFor="reset-pin">Security PIN</Label>
                                      <Input
                                          id="reset-pin"
                                          type="password"
                                          maxLength={4}
                                          value={resetPin}
                                          onChange={(e) => setResetPin(e.target.value)}
                                      />
                                  </div>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleFactoryResetStep1} disabled={isResetting}>
                                          Verify PIN
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </>
                          )}
                           {resetStep === 2 && (
                              <>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle className="text-destructive">Factory Reset: Final Confirmation</AlertDialogTitle>
                                      <AlertDialogDescription>
                                         You have successfully verified your PIN. Clicking the button below will <strong className="text-destructive">PERMANENTLY DELETE ALL DATA</strong>. This action cannot be undone.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <Button variant="ghost" onClick={() => setResetStep(1)}>Back</Button>
                                      <AlertDialogAction onClick={handleConfirmFinalDeletion} disabled={isResetting} className="bg-destructive hover:bg-destructive/90">
                                          {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                          Yes, Delete All Data
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                              </>
                          )}
                          {resetStep === 3 && (
                              <>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle className="text-destructive">Factory Reset Complete</AlertDialogTitle>
                                      <AlertDialogDescription>
                                         All application data has been permanently deleted. The application will now reload.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                     <Button onClick={() => window.location.reload()}>Reload Application</Button>
                                  </AlertDialogFooter>
                              </>
                          )}
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
       <Dialog open={openTemplateDialog} onOpenChange={setOpenTemplateDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isEditingTemplate ? 'Edit Template' : 'Add New Template'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Absence Notice" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="template-content">Template Content</Label>
                    <Textarea id="template-content" value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} rows={5} />
                    <p className="text-xs text-muted-foreground">Variables: {'{student_name}, {father_name}, {class}, {school_name}, {paid_amount}, {remaining_dues}'}</p>
                </div>
            </div>
            <DialogFooter className="justify-between">
                <div>
                  {isEditingTemplate && (
                     <Button variant="destructive" onClick={handleDeleteTemplate}>Delete</Button>
                  )}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setOpenTemplateDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveTemplate}>Save Template</Button>
                </div>
            </DialogFooter>
        </DialogContent>
       </Dialog>
       
    </div>
  );
}
