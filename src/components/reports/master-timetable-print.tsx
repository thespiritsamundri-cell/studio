
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

    const breakStyle: React.CSSProperties = {
        ...headerStyle,
        backgroundColor: '#d1fae5', // green-200
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
    };
    
    const renderHeaders = () => {
        const headers = [];
        for (let i = 0; i < numPeriods; i++) {
            headers.push(
                <th key={`header-period-${i}`} style={headerStyle}>
                    {`Period ${i + 1}`}<br/>({timeSlots[i] || 'N/A'})
                </th>
            );
            if ((i + 1) === breakAfterPeriod) {
                headers.push(
                     <th key="break-header" style={breakStyle} rowSpan={classes.length + 1}>
                        BREAK ({breakDuration})
                    </th>
                );
            }
        }
        return headers;
    };
    
    const renderBody = () => {
      return classes.map((cls) => (
        <tr key={cls.id}>
            <td style={{...cellStyle, fontWeight: 'bold', width: '10%'}}>{cls.name}</td>
            {Array.from({ length: numPeriods }).map((_, periodIndex) => {
                const isBreakNext = (periodIndex + 1) === breakAfterPeriod;
                const cell = masterTimetableData[cls.id]?.[periodIndex];
                const teacher = teachers.find(t => t.id === cell?.teacherId);

                return (
                    <React.Fragment key={`cell-frag-${cls.id}-${periodIndex}`}>
                        <td style={cellStyle}>
                            {cell?.subject ? (
                                <div>
                                    <p className="font-bold">{teacher?.name || 'N/A'}</p>
                                    <p>{cell.subject}</p>
                                </div>
                            ) : null}
                        </td>
                        {isBreakNext && <td style={cellStyle} rowSpan={classes.length}></td> /* This should be empty but the break header will span over it */}
                    </React.Fragment>
                );
            })}
        </tr>
      ));
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
                        <th style={{...headerStyle, width: '10%'}}>Class</th>
                        {renderHeaders()}
                    </tr>
                </thead>
                <tbody>
                    {renderBody()}
                </tbody>
            </table>
        </main>
      </div>
    );
  }
);
MasterTimetablePrint.displayName = 'MasterTimetablePrint';
