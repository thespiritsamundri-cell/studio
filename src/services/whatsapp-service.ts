
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/context/settings-context';
import { defaultSettings } from '@/context/settings-context';

async function sendWithUltraMSG(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
  const { whatsappApiUrl, whatsappInstanceId, whatsappApiKey, whatsappPriority } = settings;

  if (!whatsappApiUrl || !whatsappInstanceId || !whatsappApiKey) {
    console.error('UltraMSG API URL, Instance ID, or Token not provided in settings.');
    return false;
  }

  try {
    const formattedTo = to.replace(/^\+/, '').replace(/\s/g, '');
    
    // Correctly construct the URL, ensuring no double slashes or duplicated instance IDs.
    const baseUrl = whatsappApiUrl.replace(/\/$/, ''); // Remove trailing slash if it exists
    const fullUrl = `${baseUrl}/${whatsappInstanceId}/messages/chat`;

    const body = new URLSearchParams({
      token: whatsappApiKey,
      to: formattedTo,
      body: message,
      priority: whatsappPriority || '10',
    }).toString();

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.sent !== true) {
      console.error('UltraMSG API Error:', responseJson);
      return false;
    }

    console.log('UltraMSG API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('Error in sendWithUltraMSG:', error);
    if (error instanceof TypeError) {
      console.error("This might be a network error or CORS issue. Check server logs.");
    }
    return false;
  }
}

async function sendWithOfficialAPI(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
  // This function is a placeholder and not currently used.
  console.log("sendWithOfficialAPI called, but it's not implemented.");
  return false;
}


export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  let settings: SchoolSettings = defaultSettings;
  try {
    const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
    if (settingsDoc.exists()) {
      settings = { ...defaultSettings, ...settingsDoc.data() };
    }
  } catch (error) {
    console.error('Could not fetch settings. Using default settings.', error);
  }

  if (!settings.whatsappActive) {
    console.log('WhatsApp messaging is disabled in settings. Skipping send.');
    return false;
  }

  if (settings.whatsappProvider === 'ultramsg') {
    return sendWithUltraMSG(to, message, settings);
  }
  
  if (settings.whatsappProvider === 'official') {
    return sendWithOfficialAPI(to, message, settings);
  }

  console.error(`Unknown WhatsApp provider: ${settings.whatsappProvider}`);
  return false;
}
