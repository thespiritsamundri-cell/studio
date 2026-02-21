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

    name: "THE SPIRIT SCHOOL SAMUNDRI",
    short_name: "TSS",
    description: "Schoolup - A Unique Platform for Smart Schools",

    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6a3fdc", // same as meta theme-color
    icons: [
      {
        src: "https://postimg.cc/Q9bj8VGK",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "https://postimg.cc/ZBcJb0tb",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "https://i.postimg.cc/zbjqz3Zv/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
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
