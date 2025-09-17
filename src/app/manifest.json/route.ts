
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { defaultSettings } from '@/context/settings-context';
import type { SchoolSettings } from '@/context/settings-context';

export async function GET(request: Request) {
  let settings: SchoolSettings = defaultSettings;

  try {
    const settingsDocRef = doc(db, 'Settings', 'School Settings');
    const settingsDoc = await getDoc(settingsDocRef);
    if (settingsDoc.exists()) {
      settings = { ...defaultSettings, ...settingsDoc.data() as Partial<SchoolSettings> };
    }
  } catch (error) {
    console.error("Could not fetch settings for manifest, using defaults.", error);
  }

  const manifest = {
    name: settings.schoolName || "EduCentral",
    short_name: settings.schoolName || "EduCentral",
    description: "Management Portal for your School",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6a3fdc", // This should match the meta theme-color
    icons: [
      {
        src: settings.schoolLogo || "/logo192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: settings.schoolLogo || "/logo512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any maskable"
      }
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
