
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
    // 1. Proper phone number formatting
    let numericTo = to.replace(/\D/g, '');
    if (numericTo.startsWith('0')) {
      numericTo = numericTo.substring(1);
    }
    const formattedTo = numericTo.startsWith('92') ? numericTo : `92${numericTo}`;

    // 2. Correct API URL
    const baseUrl = whatsappApiUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}/${whatsappInstanceId}/messages/chat`;

    // 3. Body encode
    const body = `token=${encodeURIComponent(whatsappApiKey)}&to=${encodeURIComponent(formattedTo)}&body=${encodeURIComponent(message)}&priority=${encodeURIComponent(whatsappPriority || '10')}`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const responseJson = await response.json();

    // 4. Fix response check (string not boolean)
    if (!response.ok || responseJson.sent !== 'true') {
      console.error('UltraMSG API Error:', responseJson);
      return false;
    }

    console.log('UltraMSG API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('Error in sendWithUltraMSG:', error);
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

