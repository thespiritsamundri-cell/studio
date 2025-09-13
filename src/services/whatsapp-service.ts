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
      // Merge with defaults to ensure all fields are present
      settings = { ...defaultSettings, ...settingsDoc.data() };
    } else {
      console.warn('School settings are not configured in the database. Cannot send WhatsApp message.');
      return false;
    }

    if (!settings.whatsappActive) {
      console.log('WhatsApp messaging is disabled in settings. Skipping send.');
      return false;
    }

    if (settings.whatsappProvider === 'ultramsg') {
      return sendWithUltraMSG(to, message, settings);
    } else if (settings.whatsappProvider === 'official') {
       return sendWithOfficialAPI(to, message, settings);
    } else {
       console.warn(`Unknown or unsupported WhatsApp provider: "${settings.whatsappProvider}".`);
       return false;
    }
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error.message);
    return false;
  }
}

async function sendWithUltraMSG(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
  const { whatsappApiUrl, whatsappInstanceId, whatsappApiKey, whatsappPriority } = settings;

  if (!whatsappApiUrl || !whatsappInstanceId || !whatsappApiKey) {
    console.error('UltraMSG API URL, Instance ID, or Token not provided in settings.');
    return false;
  }

  try {
    const formattedTo = to.replace(/^\+/, '').replace(/\s/g, ''); // Remove leading + and any spaces
    const fullUrl = `${whatsappApiUrl}/${whatsappInstanceId}/messages/chat`;

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
      // This will log the exact error from the API to the server console
      console.error('UltraMSG API Error:', responseJson);
      return false;
    }

    console.log('UltraMSG API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('Fatal Error in sendWithUltraMSG:', error);
    if (error instanceof TypeError) {
        console.error("This might be a network error or CORS issue. Check server logs.");
    }
    return false;
  }
}


async function sendWithOfficialAPI(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
  const { whatsappPhoneNumberId, whatsappAccessToken } = settings;

  if (!whatsappPhoneNumberId || !whatsappAccessToken) {
    console.error('Official WhatsApp API Phone Number ID or Access Token not provided in settings.');
    return false;
  }

  try {
    const fullUrl = `https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}/messages`;
    const body = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: body,
    });

    const responseJson = await response.json();

    if (!response.ok) {
      console.error('Official WhatsApp API Error:', responseJson?.error?.message || `API Error: ${response.status}`, responseJson);
      return false;
    }
    console.log('Official WhatsApp API Success:', responseJson);
    return true;
  } catch (error: any) {
    console.error('Error in sendWithOfficialAPI:', error.message);
    return false;
  }
}
