'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/context/settings-context';
import { defaultSettings } from '@/context/settings-context';

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
    
    let settings: SchoolSettings = defaultSettings;
    if (settingsDoc.exists()) {
      settings = { ...defaultSettings, ...settingsDoc.data() };
    } else {
      console.warn('School settings are not configured. Cannot send WhatsApp message.');
      return false;
    }

    if (!settings.whatsappActive) {
      console.log('WhatsApp messaging is disabled in settings. Skipping send.');
      return false;
    }
    
    // Dedicated function for UltraMSG
    const { whatsappApiUrl, whatsappInstanceId, whatsappApiKey, whatsappPriority } = settings;

    if (!whatsappApiUrl || !whatsappInstanceId || !whatsappApiKey) {
      console.error('UltraMSG API URL, Instance ID, or Token not provided in settings.');
      return false;
    }

    const formattedTo = to.replace(/^\+/, '').replace(/\s/g, '');
    const fullUrl = `${whatsappApiUrl}/${whatsappInstanceId}/messages/chat`;

    const body = new URLSearchParams({
      token: whatsappApiKey,
      to: formattedTo,
      body: message,
      priority: whatsappPriority || '10',
    });

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
    console.error('Fatal Error in sendWhatsAppMessage:', error);
    if (error instanceof TypeError) {
        console.error("This might be a network error or CORS issue. Check server logs.");
    }
    return false;
  }
}
