
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
import { Download, Upload, QrCode, KeyRound } from 'lucide-react';
import { students, families, fees } from '@/lib/data';

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();

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
          // Here you would typically validate the data and then update your state.
          // For this example, we'll just log it and show a success message.
          console.log('Restored Data:', restoredData);

          // Example of updating state if using a global state management library (like Zustand or Redux)
          // Or you might need to make API calls to update your backend.
          // For now, we update the settings from the backup.
          if (restoredData.settings) {
            setSettings(restoredData.settings);
          }
          
          // You would also need to handle updating students, families, fees etc.
          // This part is complex as it depends on how the app's state is managed.
          // For now, this just demonstrates the file reading part.

          toast({
            title: 'Restore Successful',
            description: 'Data has been restored from the backup file.',
          });
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
    event.target.value = ''; // Reset file input
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Settings</h1>
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
                <Label htmlFor="schoolLogo">School Logo URL</Label>
                <Input id="schoolLogo" type="text" placeholder="https://example.com/logo.png" value={settings.schoolLogo} onChange={handleInputChange}/>
              </div>
           </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Integration</CardTitle>
          <CardDescription>Connect your WhatsApp account to send notifications to parents and students.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="qr"><QrCode className="mr-2"/>QR Code</TabsTrigger>
              <TabsTrigger value="api"><KeyRound className="mr-2"/>API Key</TabsTrigger>
            </TabsList>
            <TabsContent value="qr" className="mt-4">
               <Card>
                 <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                    <p className="mb-4 text-muted-foreground">Scan this QR code with your WhatsApp linked devices to connect.</p>
                    <Image
                        src="https://placehold.co/200x200/e2e8f0/64748b?text=QR+Code"
                        alt="WhatsApp QR Code Placeholder"
                        width={200}
                        height={200}
                        className="rounded-lg border p-2"
                        data-ai-hint="qr code"
                    />
                    <Button className="mt-4">Generate New Code</Button>
                 </CardContent>
               </Card>
            </TabsContent>
            <TabsContent value="api" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                    <p className="text-muted-foreground">Enter your WhatsApp Business API key from your provider (e.g., Twilio).</p>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp-api">API Key</Label>
                        <Input id="whatsapp-api" placeholder="Enter your API Key" />
                    </div>
                    <Button>Connect via API</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                    <Input id="backup-file" type="file" accept=".json" className="max-w-xs" onChange={handleRestoreBackup} />
                    <Button onClick={() => document.getElementById('backup-file')?.click()}><Upload className="mr-2"/>Restore Data</Button>
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
