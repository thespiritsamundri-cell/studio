
import { NextResponse } from 'next/server';
import { defaultSettings } from '@/context/settings-context';

// This is a dynamic route that generates the manifest.json file.
// Because it's a route handler, we cannot use the useSettings() hook directly.
// In a real-world, more complex app, we might fetch these settings from a database
// using the request object for authentication, but for this context, we will
// assume we are serving a manifest for the default settings or a single tenant.
// For the purpose of this prototype, using the default settings is sufficient to
// demonstrate the dynamic nature of the manifest.

export async function GET(request: Request) {
  // In a multi-tenant app, you'd determine the tenant from the request (e.g., subdomain or user session)
  // and fetch the appropriate settings from Firestore.
  const schoolName = defaultSettings.schoolName;
  const favicon = defaultSettings.favicon;
  
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
