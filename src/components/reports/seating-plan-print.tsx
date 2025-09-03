
'use client';

import React from 'react';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface SeatingPlanPrintProps {
  settings: SchoolSettings;
  examName: string;
  className: string;
  seatingGrid: (Student | null)[][];
  instructions: string;
}

export const SeatingPlanPrint = React.forwardRef<HTMLDivElement, SeatingPlanPrintProps>(
  ({ settings, examName, className, seatingGrid, instructions }, ref) => {
    
    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '4px',
        textAlign: 'center',
        height: '80px',
        overflow: 'hidden'
    };
    
    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {settings.schoolLogo && (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{settings.schoolName}</h1>
              <p className="text-sm">{settings.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold">Seating Plan</h2>
            <p className="text-sm">Date: {format(new Date(), 'dd-MM-yyyy')}</p>
          </div>
        </header>

         <div className="text-center my-6">
            <h3 className="text-xl font-bold">{examName}</h3>
            <p className="text-lg font-semibold">Class: {className}</p>
        </div>

        <main className="mt-8">
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <tbody>
              {seatingGrid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((student, colIndex) => (
                    <td key={colIndex} style={cellStyle}>
                      {student ? (
                        <div className="flex flex-col h-full justify-center items-center">
                          <p className="text-sm font-bold">{student.name}</p>
                          <p className="text-xs text-gray-600">(ID: {student.id})</p>
                        </div>
                      ) : (
                        <div />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </main>
        
        <div className="mt-8 border-t-2 border-black pt-4">
            <h4 className="font-bold mb-2">Instructions:</h4>
            <div className="whitespace-pre-wrap text-sm border p-2 rounded-md font-urdu">{instructions}</div>
        </div>

         <footer className="mt-12 pt-4 flex justify-end">
            <div className="flex flex-col items-center">
                {settings.principalSignature ? (
                    <Image src={settings.principalSignature} alt="Principal's Signature" width={150} height={60} className="object-contain" />
                ) : (
                    <div className="h-[60px]"></div>
                )}
                <div className="border-t-2 border-gray-800 w-48 text-center pt-1">
                    <p className="font-bold">Principal's Signature</p>
                </div>
            </div>
        </footer>
      </div>
    );
  }
);

SeatingPlanPrint.displayName = 'SeatingPlanPrint';
