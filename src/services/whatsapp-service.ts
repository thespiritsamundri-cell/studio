
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/context/settings-context';

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
    if (!settingsDoc.exists()) {
      console.warn('School settings are not configured in the database. Cannot send WhatsApp message.');
      return false;
    }
    const settings = settingsDoc.data() as SchoolSettings;

    if (!settings.whatsappActive) {
      console.log('WhatsApp messaging is disabled in settings. Skipping send.');
      return false;
    }

    if (settings.whatsappProvider === 'ultramsg') {
      return sendWithUltraMSG(to, message, settings);
    } else if (settings.whatsappProvider === 'official') {
      return sendWithOfficialAPI(to, message, settings);
    } else {
      console.warn(`WhatsApp provider "${settings.whatsappProvider}" is not supported or configured.`);
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
    const fullUrl = `${whatsappApiUrl}/${whatsappInstanceId}/messages/chat`;
    
    const params = new URLSearchParams();
    params.append('token', whatsappApiKey);
    params.append('to', to);
    params.append('body', message);
    params.append('priority', whatsappPriority || '10');

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: params,
    });

    const responseJson = await response.json();

    if (!response.ok || responseJson.sent !== true) {
      console.error('UltraMSG API Error:', responseJson?.error || `API Error: ${response.status}`, responseJson);
      return false;
    }
    console.log('UltraMSG API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('Error in sendWithUltraMSG:', error.message);
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
