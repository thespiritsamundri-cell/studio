
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import type { Class, Teacher, TimetableData } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';

interface MasterTimetablePrintProps {
  settings: SchoolSettings;
  classes: Class[];
  teachers: Teacher[];
  masterTimetableData: Record<string, TimetableData>;
  timeSlots: string[];
  breakAfterPeriod: number;
  breakDuration: string;
  numPeriods: number;
}

export const MasterTimetablePrint = React.forwardRef<HTMLDivElement, MasterTimetablePrintProps>(
  ({ settings, classes, teachers, masterTimetableData, timeSlots, breakAfterPeriod, breakDuration, numPeriods }, ref) => {
    
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
                        <th style={{...headerStyle, width: '8%'}}>Class</th>
                        {Array.from({ length: numPeriods }).map((_, index) => {
                            if (index === breakAfterPeriod) {
                                return (
                                    <React.Fragment key={`break-header-${index}`}>
                                        <th style={{...headerStyle, width: '11%'}}>{`Period ${index+1}`}<br/>({timeSlots[index]})</th>
                                        <th style={{...headerStyle, backgroundColor: '#d1fae5', writingMode: 'vertical-rl', transform: 'rotate(180deg)', width: '3%' }} rowSpan={classes.length + 1}>
                                            BREAK ({breakDuration})
                                        </th>
                                    </React.Fragment>
                                )
                            }
                            const periodNumber = index < breakAfterPeriod ? index + 1 : index;
                            return <th key={`period-header-${index}`} style={{...headerStyle, width: '11%'}}>{`Period ${periodNumber}`}<br/>({timeSlots[index]})</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                     {classes.map((cls) => {
                        const timetable = masterTimetableData[cls.id];
                        return (
                             <tr key={cls.id}>
                                 <td style={{...cellStyle, fontWeight: 'bold'}}>{cls.name}</td>
                                 {Array.from({ length: numPeriods }).map((_, periodIndex) => {
                                     if (periodIndex === breakAfterPeriod) return null;
                                      const actualPeriodIndex = periodIndex < breakAfterPeriod ? periodIndex : periodIndex - 1;
                                      const cell = timetable?.[actualPeriodIndex];
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
                                 })}
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
