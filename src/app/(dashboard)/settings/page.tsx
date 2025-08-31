import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
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
            <Label htmlFor="school-name">School Name</Label>
            <Input id="school-name" defaultValue="EduCentral" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-address">School Address</Label>
            <Textarea id="school-address" defaultValue="123 Education Lane, Knowledge City, Pakistan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-phone">Phone Number</Label>
            <Input id="school-phone" defaultValue="+92 300 1234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school-logo">School Logo</Label>
            <Input id="school-logo" type="file" />
          </div>
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
