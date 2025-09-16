
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/context/settings-context';
import { defaultSettings } from '@/context/settings-context';

// Phone number normalize function
function normalizePhone(to: string): string {
  let numeric = to.replace(/\D/g, '');
  if (numeric.startsWith('92')) return numeric;
  if (numeric.startsWith('0')) return '92' + numeric.substring(1);
  return '92' + numeric;
}

async function sendWithUltraMSG(to: string, message: string, settings: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  const { whatsappApiUrl, whatsappApiKey } = settings;

  if (!whatsappApiUrl || !whatsappApiKey) {
    const errorMsg = 'UltraMSG API URL or Token missing.';
    console.error(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const formattedTo = normalizePhone(to);
    
    // Correct URL construction for UltraMSG
    const baseUrl = whatsappApiUrl.endsWith('/') ? whatsappApiUrl : `${whatsappApiUrl}/`;
    const fullUrl = `${baseUrl}messages/chat`;

    const params = new URLSearchParams();
    params.append('token', whatsappApiKey);
    params.append('to', formattedTo);
    params.append('body', message);
    params.append('priority', settings.whatsappPriority || '10');

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    let responseJson: any = {};
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      const errorMsg = `API responded with non-JSON text: ${responseText}`;
      console.error(`❌ ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    if (!response.ok || (responseJson.sent !== 'true' && !responseJson.id)) {
      const errorMsg = `API Error: ${responseJson.error?.message || responseJson.error || 'Unknown error'}`;
      console.error('❌ UltraMSG API Error:', responseJson);
      return { success: false, error: errorMsg };
    }

    console.log('✅ UltraMSG API Success:', responseJson);
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error in sendWithUltraMSG:', error);
    return { success: false, error: error.message };
  }
}


async function sendWithOfficialAPI(to: string, message: string, settings: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  console.log("sendWithOfficialAPI called, but it's not implemented.");
  return Promise.resolve({ success: false, error: "Official API not implemented." });
}


export async function sendWhatsAppMessage(to: string, message: string, clientSettings?: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  let settings: SchoolSettings;

  if (clientSettings) {
    settings = { ...defaultSettings, ...clientSettings };
  } else {
    try {
      const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
      if (settingsDoc.exists()) {
        settings = { ...defaultSettings, ...settingsDoc.data() };
      } else {
        settings = defaultSettings;
      }
    } catch (error) {
      console.error('Could not fetch settings from Firestore. Falling back to default settings.', error);
      settings = defaultSettings;
    }
  }
  
  if (!settings.whatsappProvider || settings.whatsappProvider === 'none') {
    return { success: false, error: "No Active WhatsApp Provider is Configured." };
  }
  
  let result: { success: boolean; error?: string };

  if (settings.whatsappProvider === 'ultramsg') {
    result = await sendWithUltraMSG(to, message, settings);
  } else if (settings.whatsappProvider === 'official') {
    result = await sendWithOfficialAPI(to, message, settings);
  } else {
    result = { success: false, error: "No Active WhatsApp Provider is Configured." };
  }

  if (!result.success) {
    return { success: false, error: result.error || "An unknown error occurred." };
  }

  return { success: true };
}
