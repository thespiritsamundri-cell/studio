import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import type { SchoolSettings } from '@/context/settings-context';

export async function GET() {
  let settings: Partial<SchoolSettings> = {};

  try {
    const settingsRef = doc(db, 'settings', 'school-settings');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      settings = docSnap.data();
    }
  } catch (error) {
    console.error("Could not fetch settings for manifest.json:", error);
  }

  const schoolName = settings.schoolName || 'EduCentral';
  // Add a cache-busting query parameter
  const faviconUrl = `${settings.favicon || '/logo.png'}?v=${new Date().getTime()}`;

  const manifest = {
    name: schoolName,
    short_name: schoolName,
    description: `Management software for ${schoolName}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6a3fdc', // Default theme color
    icons: [
      {
        src: faviconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: faviconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
