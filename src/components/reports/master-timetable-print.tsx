
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import type { Class, Teacher, TimetableData } from '@/lib/types';
import Image from 'next/image';

interface MasterTimetablePrintProps {
  settings: SchoolSettings;
  classes: Class[];
  teachers: Teacher[];
  masterTimetableData: Record<string, TimetableData>;
  timeSlots: string[];
  breakAfterPeriod: number;
}

export const MasterTimetablePrint = React.forwardRef<HTMLDivElement, MasterTimetablePrintProps>(
  ({ settings, classes, teachers, masterTimetableData, timeSlots, breakAfterPeriod }, ref) => {
    
    const numPeriods = 8;
    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '2px',
        height: '40px',
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
        ...cellStyle,
        backgroundColor: '#d1fae5', // green-200
    };
    

    const sortedClasses = [...classes].sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));


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
                 <colgroup>
                    <col style={{ width: '120px' }} />
                    {/* 8 periods */}
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    {/* Break */}
                    <col style={{ width: '40px' }} /> 
                    {/* 4 more periods */}
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                 </colgroup>
                <thead>
                    <tr>
                        <th style={{...headerStyle, width: '120px'}}>Class</th>
                         {Array.from({ length: numPeriods }).map((_, periodIndex) => (
                             <React.Fragment key={`header-frag-${periodIndex}`}>
                                {periodIndex === 4 && (
                                    <th key="break-header" style={breakStyle}></th>
                                )}
                                <th style={headerStyle}>
                                    {`P-${periodIndex + 1}`}<br/>({timeSlots[periodIndex] || 'N/A'})
                                </th>
                             </React.Fragment>
                         ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedClasses.map((cls) => (
                        <tr key={cls.id}>
                            <td style={{...cellStyle, fontWeight: 'bold'}}>{cls.name}</td>
                            {Array.from({ length: numPeriods }).map((_, periodIndex) => {
                                const cell = masterTimetableData[cls.id]?.[periodIndex];
                                const teacher = teachers.find(t => t.id === cell?.teacherId);
                                return (
                                    <React.Fragment key={`cell-frag-print-${cls.id}-${periodIndex}`}>
                                        {periodIndex === 4 && (
                                            <td key={`break-cell-print-${cls.id}`} style={breakStyle}></td>
                                        )}
                                        <td style={cellStyle}>
                                            {cell?.subject ? (
                                                <div>
                                                    <p className="font-bold">{teacher?.name || ''}</p>
                                                    <p>{cell.subject}</p>
                                                </div>
                                            ) : null}
                                        </td>
                                    </React.Fragment>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
      </div>
    );
  }
);
MasterTimetablePrint.displayName = 'MasterTimetablePrint';
