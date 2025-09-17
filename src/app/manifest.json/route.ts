
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
    name: settings.schoolName || "The Spirit School Samundri", // <-- updated name
    short_name: settings.schoolName || "TSS",       // <-- updated short name
    description: "Schoolup - A Unique Platform for Smart Schools",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6a3fdc", // same as meta theme-color
    icons: [
      {
        src: settings.schoolLogo || "https://i.postimg.cc/3wBs967C/android-launchericon-192-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: settings.schoolLogo || "https://i.postimg.cc/Y9CJP3Cc/android-launchericon-512-512.png",
        sizes: "512x512",
        type: "image/png",
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
