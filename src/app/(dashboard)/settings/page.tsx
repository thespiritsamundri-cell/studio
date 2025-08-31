
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
import { Download, Upload, QrCode, KeyRound, Loader2, TestTubeDiagonal, MessageSquare, Send, Eye, Settings as SettingsIcon } from 'lucide-react';
import { useData } from '@/context/data-context';
import { useState } from 'react';
import { generateQrCode } from '@/ai/flows/generate-qr-code';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { students, families, fees, loadData } = useData();
  const { toast } = useToast();
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your school information has been updated.',
    });
  };

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
  
  const handleGenerateQr = async () => {
    setIsGeneratingQr(true);
    try {
        const result = await generateQrCode({ content: `https://wa.me/123456789?text=connect` });
        setQrCodeUri(result.qrCodeDataUri);
    } catch (error) {
        console.error("Failed to generate QR code", error);
        toast({
            title: 'QR Generation Failed',
            description: 'Could not generate a new QR code. Please try again.',
            variant: 'destructive'
        })
    } finally {
        setIsGeneratingQr(false);
    }
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><SettingsIcon className="w-8 h-8" />Settings</h1>
      
      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="school">School Settings</TabsTrigger>
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
                        <Input id="schoolLogo" type="file" accept="image/*" onChange={handleLogoChange} className="file:text-primary file:font-medium" />
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
        <TabsContent value="whatsapp" className="mt-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>Enter your WhatsApp API details to enable messaging features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="apiUrl">API URL</Label>
                            <Input id="apiUrl" placeholder="Enter WhatsApp API URL" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input id="apiKey" placeholder="Enter WhatsApp API Key" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="delay">Message Delay (seconds)</Label>
                            <Input id="delay" type="number" defaultValue="25" />
                        </div>
                        <div className="flex items-end space-x-2">
                            <div className="flex items-center space-x-2 h-10">
                                <Checkbox id="active" />
                                <Label htmlFor="active">Active</Label>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end items-center gap-2 pt-4">
                        <Button variant="default"><KeyRound className="mr-2"/>Save WhatsApp Settings</Button>
                        <Button variant="secondary" onClick={handleGenerateQr} disabled={isGeneratingQr}>
                            {isGeneratingQr ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generating...</> : <><QrCode className="mr-2" />Generate QR Code</>}
                        </Button>
                        <Button variant="outline"><TestTubeDiagonal className="mr-2"/>Test Connection</Button>
                    </div>
                    {qrCodeUri && (
                        <div className="flex flex-col items-center justify-center pt-4">
                            <p className="mb-2 text-sm text-muted-foreground">Scan this with your linked device.</p>
                             <Image src={qrCodeUri} alt="WhatsApp QR Code" width={200} height={200} className="rounded-md border p-2" data-ai-hint="qr code" />
                        </div>
                    )}
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
                                <RadioGroup defaultValue="all" className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="r1" /><Label htmlFor="r1">All Families</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="class" id="r2" /><Label htmlFor="r2">Specific Class</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="family" id="r3" /><Label htmlFor="r3">Specific Family</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="r4" /><Label htmlFor="r4">Custom Numbers</Label></div>
                                </RadioGroup>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="message">Message:</Label>
                                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={5} />
                                <p className="text-xs text-muted-foreground">Available variables: {'{student_name}, {father_name}, {class}, {family_number}, {school_name}'}</p>
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
                                <Button variant="secondary" className="bg-green-600 text-white hover:bg-green-700"><Send className="mr-2"/>Send Message</Button>
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
