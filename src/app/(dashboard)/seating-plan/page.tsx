
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Printer, Loader2, Grid3x3, Shuffle } from 'lucide-react';
import { SeatingPlanPrint } from '@/components/reports/seating-plan-print';
import { useSettings } from '@/context/settings-context';
import { renderToString } from 'react-dom/server';
import type { Student } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';


export default function SeatingPlanPage() {
  const { classes, students: allStudents } = useData();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [columns, setColumns] = useState(5);
  const [rows, setRows] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [examName, setExamName] = useState('Final Term Examination');
  const [instructions, setInstructions] = useState('1. Mobile phones are strictly prohibited.\n2. Do not use unfair means during the exam.\n3. Bring your own stationery.');

  const classStudents = useMemo(() => {
    return selectedClass ? allStudents.filter(s => s.class === selectedClass) : [];
  }, [selectedClass, allStudents]);

  const handlePrint = () => {
    if (!selectedClass) {
      toast({ title: 'Please select a class.', variant: 'destructive' });
      return;
    }
    if (columns <= 0 || rows <= 0) {
      toast({ title: 'Invalid layout.', description: 'Rows and columns must be greater than zero.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    toast({ title: "Generating Seating Plan..." });
    
    // Shuffle students
    const shuffledStudents = [...classStudents].sort(() => Math.random() - 0.5);
    
    // Create seating grid
    const seatingGrid: (Student | null)[][] = Array.from({ length: rows }, () => Array(columns).fill(null));
    let studentIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        if (studentIndex < shuffledStudents.length) {
          seatingGrid[r][c] = shuffledStudents[studentIndex];
          studentIndex++;
        }
      }
    }


    setTimeout(() => {
      const printContent = renderToString(
        <SeatingPlanPrint 
          settings={settings}
          examName={examName}
          className={selectedClass}
          seatingGrid={seatingGrid}
          instructions={instructions}
        />
      );

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Seating Plan - ${selectedClass}</title>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
      }
      setIsLoading(false);
    }, 500);
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Grid3x3 /> Seating Plan Generator</CardTitle>
          <CardDescription>Create a randomized seating plan for exams.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>1. Select Class</Label>
              <Select onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="examName">2. Exam Name</Label>
                <Input id="examName" value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g., Mid-Term Exam" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="columns">3. Columns (Seats per row)</Label>
                <Input id="columns" type="number" value={columns} onChange={e => setColumns(Number(e.target.value))} min="1" />
            </div>

             <div className="space-y-2">
                <Label htmlFor="rows">4. Rows</Label>
                <Input id="rows" type="number" value={rows} onChange={e => setRows(Number(e.target.value))} min="1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">5. Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Enter exam instructions here..."
              rows={4}
            />
          </div>
          
           <div className="flex justify-end items-center gap-4 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Total seats: {columns * rows} | Students in class: {classStudents.length}
              </div>
              <Button size="lg" onClick={handlePrint} disabled={isLoading || !selectedClass}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Shuffle className="mr-2 h-4 w-4"/>}
                Generate & Print
              </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
