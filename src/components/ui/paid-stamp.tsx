
'use client';

import { format } from 'date-fns';

interface PaidStampProps {
    schoolName: string;
    schoolPhone: string;
    paymentDate: Date;
}

export function PaidStamp({ schoolName, schoolPhone, paymentDate }: PaidStampProps) {
    const formattedDate = format(paymentDate, 'dd-MM-yyyy');

    return (
        <div className="w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Define the circle path for the top text */}
                <defs>
                    <path id="topCircle" d="M 10,50 A 40,40 0 1 1 90,50" />
                </defs>
                {/* Define the circle path for the bottom text */}
                <defs>
                    <path id="bottomCircle" d="M 90,50 A 40,40 0 1 1 10,50" />
                </defs>

                {/* Outer circle border */}
                <circle cx="50" cy="50" r="48" fill="none" stroke="#D32F2F" strokeWidth="2" />
                {/* Inner circle border */}
                <circle cx="50" cy="50" r="36" fill="none" stroke="#D32F2F" strokeWidth="1" />

                {/* School Name */}
                <text fill="#D32F2F" fontSize="7" fontWeight="bold" letterSpacing="0.1">
                    <textPath href="#topCircle" startOffset="50%" textAnchor="middle">
                        {schoolName.toUpperCase()}
                    </textPath>
                </text>

                {/* School Phone */}
                <text fill="#D32F2F" fontSize="7" fontWeight="bold" letterSpacing="0.1">
                    <textPath href="#bottomCircle" startOffset="50%" textAnchor="middle">
                       {schoolPhone}
                    </textPath>
                </text>

                {/* PAID text */}
                <text x="50" y="48" textAnchor="middle" fill="#D32F2F" fontSize="20" fontWeight="bold">
                    PAID
                </text>
                
                {/* Date text */}
                <text x="50" y="60" textAnchor="middle" fill="#D32F2F" fontSize="6" fontWeight="medium">
                   {formattedDate}
                </text>

                 {/* Stars */}
                <text x="20" y="52" textAnchor="middle" fill="#D32F2F" fontSize="10">★</text>
                <text x="80" y="52" textAnchor="middle" fill="#D32F2F" fontSize="10">★</text>
            </svg>
        </div>
    );
}
