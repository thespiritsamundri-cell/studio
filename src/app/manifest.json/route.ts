
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

    name: settings.schoolName || "The Spirit School Samundri",
    short_name: settings.schoolName ? settings.schoolName.split(' ').map(n => n[0]).join('') : "TSS",
    description: "Schoolup - A Unique Platform for Smart Schools",

    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6a3fdc", // same as meta theme-color
    icons: [
      {
        src: settings.schoolLogo || "https://i.postimg.cc/Xv35Y5XZ/The-Spirit.jpg",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: settings.schoolLogo || "https://i.postimg.cc/Xv35Y5XZ/The-Spirit.jpg",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
