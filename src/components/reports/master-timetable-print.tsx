
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import type { Class, Teacher, Timetable } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';

interface MasterTimetablePrintProps {
  settings: SchoolSettings;
  classes: Class[];
  teachers: Teacher[];
  masterTimetableData: Record<string, Timetable>;
  timeSlots: string[];
  breakAfterPeriod: number;
  breakDuration: string;
}

export const MasterTimetablePrint = React.forwardRef<HTMLDivElement, MasterTimetablePrintProps>(
  ({ settings, classes, teachers, masterTimetableData, timeSlots, breakAfterPeriod, breakDuration }, ref) => {
    
    const periodHeaders = Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`);

    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '2px',
        height: '50px',
        textAlign: 'center',
        fontSize: '9px',
        wordBreak: 'break-word',
    };
    
    const headerStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        height: 'auto',
        backgroundColor: '#e5e7eb' // gray-200
    };

    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="object-contain" />}
            <div>
              <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
              <p className="text-xs">{settings.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">MASTER TIMETABLE</h2>
            <p className="text-xs">{settings.academicYear}</p>
          </div>
        </header>

        <main className="mt-4">
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>Class</th>
                        {periodHeaders.map((header, index) => {
                             if (index + 1 === breakAfterPeriod) {
                                return (
                                    <React.Fragment key={header}>
                                        <th style={headerStyle}>{header}<br/>({timeSlots[index]})</th>
                                        <th style={{...headerStyle, backgroundColor: '#d1fae5', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} rowSpan={classes.length + 1}>
                                            BREAK ({breakDuration})
                                        </th>
                                    </React.Fragment>
                                )
                            }
                             if (index + 1 > breakAfterPeriod) {
                               return <th key={header} style={headerStyle}>{`Period ${index}`}<br/>({timeSlots[index-1]})</th>
                            }
                            return <th key={header} style={headerStyle}>{header}<br/>({timeSlots[index]})</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                     {classes.map((cls) => {
                        const timetable = masterTimetableData[cls.id];
                        return (
                             <tr key={cls.id}>
                                 <td style={{...cellStyle, fontWeight: 'bold'}}>{cls.name}</td>
                                 {Array.from({ length: 8 }).map((_, periodIndex) => {
                                      const cell = timetable?.data[periodIndex];
                                      const teacher = teachers.find(t => t.id === cell?.teacherId);
                                      return (
                                        <td key={periodIndex} style={cellStyle}>
                                            {cell ? (
                                                <div>
                                                    <p className="font-bold">{teacher?.name || 'N/A'}</p>
                                                    <p>{cell.subject}</p>
                                                </div>
                                            ) : null}
                                        </td>
                                      )
                                 }).filter((_, i) => i !== breakAfterPeriod)}
                             </tr>
                        )
                     })}
                </tbody>
            </table>
        </main>
      </div>
    );
  }
);
MasterTimetablePrint.displayName = 'MasterTimetablePrint';
