import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdmissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">New Admission</h1>
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Fill out the form to admit a new student.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="student-name">Student Name</Label>
              <Input id="student-name" placeholder="Enter full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father-name">Father's Name</Label>
              <Input id="father-name" placeholder="Enter father's name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class to Admit</Label>
              <Select>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(10)].map((_, i) => (
                    <SelectItem key={i + 1} value={`${i + 1}th`}>{`${i + 1}th Class`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="family-id">Family Number</Label>
              <Input id="family-id" placeholder="Enter existing or new family number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="Enter contact number" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Enter residential address" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">Student Photo</Label>
              <Input id="photo" type="file" />
            </div>
            <div className="flex justify-end md:col-span-2">
              <Button>Admit Student</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
