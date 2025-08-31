
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
import { Download, Upload, KeyRound, Loader2, TestTubeDiagonal, MessageSquare, Send, Eye, EyeOff, Settings as SettingsIcon, Info, UserCog, Palette, Type } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { students, families, fees, loadData } = useData();
  const { toast } = useToast();
  
  // Custom Messaging State
  const [message, setMessage] = useState('');
  const [sendTarget, setSendTarget] = useState('all');
  const [targetClass, setTargetClass] = useState('');
  const [targetFamilyId, setTargetFamilyId] = useState('');
  const [customNumbers, setCustomNumbers] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Account settings state
  const [email, setEmail] = useState('admin@example.com');
  const [currentPassword, setCurrentPassword] = useState('password');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);


  const classes = useMemo(() => [...Array.from(new Set(students.map(s => s.class)))], [students]);

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your school information has been updated.',
    });
  };
  
  const handleAccountSave = () => {
    toast({
        title: "Account Settings Saved",
        description: "Your login credentials have been updated.",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({...prev, [id]: value}));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings(prev => ({...prev, schoolLogo: reader.result as string}));
        };
        reader.readAsDataURL(file);
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
        settings
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

  const templates = {
    absence: `Dear {father_name},\nWe noticed that your child {student_name} of class {class} was absent today. Please let us know the reason.`,
    fee: `Dear {father_name},\nThis is a friendly reminder that the fee for the month is due. Kindly clear the dues at your earliest convenience to avoid any late charges.`,
    general: `Dear Parents,\nThis is to inform you that...`,
    exam: `Dear Parents,\nThe final examinations will commence from next week. Please ensure your child is well-prepared.`,
    holiday: `Dear Parents,\nThe school will remain closed on account of...`
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSendMessage = async () => {
    if (!message) {
      toast({ title: 'Message is empty', description: 'Please write a message to send.', variant: 'destructive' });
      return;
    }
    setIsSending(true);

    let recipients: { phone: string, context: Record<string, string> }[] = [];

    switch (sendTarget) {
        case 'all':
            recipients = families.map(f => ({ phone: f.phone, context: { '{father_name}': f.fatherName, '{school_name}': settings.schoolName } }));
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
            break;
        case 'custom':
            if (!customNumbers) {
                 toast({ title: 'No numbers entered', description: 'Please enter phone numbers.', variant: 'destructive' });
                 setIsSending(false);
                 return;
            }
            recipients = customNumbers.split(',').map(num => ({ phone: num.trim(), context: {'{school_name}': settings.schoolName} }));
            break;
    }

    if (recipients.length === 0) {
      toast({ title: 'No Recipients', description: 'No recipients found for the selected criteria.', variant: 'destructive' });
      setIsSending(false);
      return;
    }

    toast({ title: 'Sending Messages', description: `Preparing to send messages to ${recipients.length} recipient(s).` });
    
    let successCount = 0;
    for (const recipient of recipients) {
        let personalizedMessage = message;
        for (const key in recipient.context) {
            personalizedMessage = personalizedMessage.replace(new RegExp(key, 'g'), recipient.context[key]);
        }
        
        try {
            // Using academic year as placeholder for delay, which is not ideal but was in original code
            await sendWhatsAppMessage(recipient.phone, personalizedMessage);
            successCount++;
            await sleep(Number(settings.messageDelay) * 1000 || 2000); 
        } catch (error) {
            console.error(`Failed to send message to ${recipient.phone}`, error);
        }
    }

    toast({ title: 'Process Complete', description: `Successfully sent messages to ${successCount} out of ${recipients.length} recipients.` });
    setIsSending(false);
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


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><SettingsIcon className="w-8 h-8" />Settings</h1>
      
      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="school">School</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
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
                        <Label htmlFor="schoolLogo">School Logo</Label>
                        <Input id="schoolLogoInput" name="schoolLogo" type="file" accept="image/*" onChange={handleLogoChange} className="file:text-primary file:font-medium" />
                    </div>
                </div>
                 {settings.schoolLogo && (
                    <div className="space-y-2">
                        <Label>Logo Preview</Label>
                        <div className="flex items-center gap-4 p-4 border rounded-md">
                            <Image src={settings.schoolLogo} alt="School Logo Preview" width={60} height={60} className="object-contain rounded-md" />
                            <Button variant="ghost" size="sm" onClick={() => setSettings(prev => ({...prev, schoolLogo: ''}))}>Remove</Button>
                        </div>
                    </div>
                )}
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
                        <Button onClick={() => toast({ title: "Theme Saved", description: "Your new colors have been applied."})}>Save Theme</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="account" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserCog />Account Settings</CardTitle>
                    <CardDescription>Manage your login credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="email">Login Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                            <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(prev => !prev)}>
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                            <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(prev => !prev)}>
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <Button onClick={handleAccountSave}>Update Credentials</Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="whatsapp" className="mt-6 space-y-6">
             <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Connecting to WhatsApp</AlertTitle>
              <AlertDescription>
                To send messages, you need to connect to a WhatsApp API provider (e.g., UltraMSG, Twilio). 
                Log in to your provider's dashboard, get your API credentials (URL and Key/Token), and enter them below.
                This is a mock integration and will not send real messages.
              </AlertDescription>
            </Alert>
            <Card>
                <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>Enter your WhatsApp API details to enable messaging features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="whatsappApiUrl">API URL</Label>
                            <Input id="whatsappApiUrl" value={settings.whatsappApiUrl} onChange={handleInputChange} placeholder="Enter WhatsApp API URL" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsappApiKey">API Key / Token</Label>
                            <Input id="whatsappApiKey" value={settings.whatsappApiKey} onChange={handleInputChange} placeholder="Enter WhatsApp API Key or Token" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="messageDelay">Message Delay (seconds)</Label>
                            <Input id="messageDelay" type="number" value={settings.messageDelay} onChange={handleInputChange} />
                        </div>
                        <div className="flex items-end space-x-2">
                            <div className="flex items-center space-x-2 h-10">
                                <Checkbox id="whatsappActive" checked={settings.whatsappActive} onCheckedChange={(checked) => setSettings(prev => ({...prev, whatsappActive: !!checked}))} />
                                <Label htmlFor="whatsappActive">Active</Label>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end items-center gap-2 pt-4">
                        <Button onClick={handleSave}><KeyRound className="mr-2"/>Save WhatsApp Settings</Button>
                        <Button variant="outline"><TestTubeDiagonal className="mr-2"/>Test Connection</Button>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-green-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="text-green-700"/>Custom Messaging</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-primary mb-2">Automatic Messages</h3>
                        <div className="p-4 bg-background/70 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="auto-attendance">Send attendance notifications automatically</Label>
                                <Checkbox id="auto-attendance" />
                            </div>
                             <div className="flex items-center justify-between">
                                <Label htmlFor="auto-fee">Send fee payment confirmations automatically</Label>
                                <Checkbox id="auto-fee" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-primary mb-2">Send Custom Message</h3>
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
                                    <Button size="sm" variant="outline" onClick={() => handleTemplateClick(templates.absence)}>Absence Notice</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleTemplateClick(templates.fee)}>Fee Reminder</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleTemplateClick(templates.general)}>General Notice</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleTemplateClick(templates.exam)}>Exam Notice</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleTemplateClick(templates.holiday)}>Holiday Notice</Button>
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-2 pt-4">
                                <Button variant="secondary" className="bg-green-600 text-white hover:bg-green-700" onClick={handleSendMessage} disabled={isSending}>
                                  {isSending ? <Loader2 className="mr-2 animate-spin"/> : <Send className="mr-2"/>}
                                  {isSending ? 'Sending...' : 'Send Message'}
                                </Button>
                                <Button variant="ghost"><Eye className="mr-2"/>Preview</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="backup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Manage your application data backups.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
