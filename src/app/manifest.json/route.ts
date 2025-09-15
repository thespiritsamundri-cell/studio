
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // This route is called by the browser to get the manifest file.
  // It should not access the database, as it's an unauthenticated request.
  // The dynamic title and favicon are handled on the client-side in app-client-layout.tsx.

  const manifest = {
    name: "EduCentral School Management",
    short_name: "EduCentral",
    description: "Management Portal for your School",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6a3fdc",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo192.png",
        type: "image/png",
        sizes: "192x192"
      },
      {
        src: "/logo512.png",
        type: "image/png",
        sizes: "512x512"
      }
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}
