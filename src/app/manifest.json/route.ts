
import { NextResponse } from 'next/server';
import { defaultSettings } from '@/context/settings-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/context/settings-context';


export async function GET(request: Request) {

  let schoolSettings = defaultSettings;
  try {
      const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
      if (settingsDoc.exists()) {
          schoolSettings = { ...defaultSettings, ...settingsDoc.data() } as SchoolSettings;
      }
  } catch (error) {
      console.error("Could not fetch settings for manifest, using defaults.", error);
  }

  const schoolName = schoolSettings.schoolName;
  const favicon = schoolSettings.favicon;
  
  // Cache-busting query parameter
  const { searchParams } = new URL(request.url);
  const version = searchParams.get('v') || '1';

  const manifest = {
    name: schoolName,
    short_name: schoolName,
    description: `Management Portal for ${schoolName}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6a3fdc', // This should ideally come from settings as well
    icons: [
      {
        src: `${favicon}?v=${version}`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${favicon}?v=${version}`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
