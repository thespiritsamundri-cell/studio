
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
    // 1. Robust phone number formatting
    const numericTo = to.replace(/\D/g, ''); // Remove all non-digit characters
    const formattedTo = numericTo.startsWith('92') ? numericTo : `92${numericTo.substring(1)}`;

    // 2. Robust URL construction
    const baseUrl = whatsappApiUrl.replace(/\/$/, ''); // Remove any trailing slash
    const fullUrl = `${baseUrl}/messages/chat`;

    // 3. Manually construct the body to avoid any issues with URLSearchParams
    const body = `token=${encodeURIComponent(whatsappApiKey)}&to=${encodeURIComponent(formattedTo)}&body=${encodeURIComponent(message)}&priority=${encodeURIComponent(whatsappPriority || '10')}`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
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
  console.log("sendWithOfficialAPI called, but it's not implemented.");
  return Promise.resolve(false);
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

  if (settings.whatsappProvider === 'ultramsg') {
    return sendWithUltraMSG(to, message, settings);
  }
  
  if (settings.whatsappProvider === 'official') {
    return sendWithOfficialAPI(to, message, settings);
  }

  console.log('No active WhatsApp provider is configured. Skipping send.');
  return false;
}
