
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();

  const handleSave = () => {
    // The settings are already updated on change thanks to the binding.
    // This button just provides user feedback.
    toast({
      title: 'Settings Saved',
      description: 'Your school information has been updated.',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({...prev, [id]: value}));
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
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input id="schoolName" value={settings.schoolName} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolAddress">School Address</Label>
            <Textarea id="schoolAddress" value={settings.schoolAddress} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolPhone">Phone Number</Label>
            <Input id="schoolPhone" value={settings.schoolPhone} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolLogo">School Logo URL</Label>
            <Input id="schoolLogo" type="text" placeholder="https://example.com/logo.png" value={settings.schoolLogo} onChange={handleInputChange}/>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
