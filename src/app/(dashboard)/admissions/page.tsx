
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function AdmissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">New Student Admission</h1>
        <p className="text-muted-foreground">Follow the steps to enroll a new student in the school.</p>
      </div>

      <form className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Family Information</CardTitle>
            <CardDescription>
              Search for an existing family ID. If the family is new, first add them from the 'Families' page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 max-w-sm">
              <div className="flex-grow space-y-2">
                <Label htmlFor="family-id">Family Number</Label>
                <Input id="family-id" placeholder="Enter existing family number (e.g., 1)" />
              </div>
              <Button variant="outline" type="button">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Enter the personal details for the new student.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="Enter contact number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Student Photo</Label>
                <Input id="photo" type="file" className="file:text-primary file:font-medium" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" placeholder="Enter residential address" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Structure</CardTitle>
            <CardDescription>
              Define the fee structure for this student. The registration fee is a one-time charge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="registration-fee">Registration Fee (PKR)</Label>
                <Input id="registration-fee" type="number" placeholder="e.g., 5000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-fee">Monthly Tution Fee (PKR)</Label>
                <Input id="monthly-fee" type="number" placeholder="e.g., 2500" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual-charges">Annual Charges (PKR)</Label>
                <Input id="annual-charges" type="number" placeholder="e.g., 3000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summer-peak-fee">Summer Peak Fee (PKR)</Label>
                <Input id="summer-peak-fee" type="number" placeholder="e.g., 1500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg">Admit Student</Button>
        </div>
      </form>
    </div>
  );
}
