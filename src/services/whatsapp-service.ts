
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/lib/types';
import { defaultSettings } from '@/context/settings-context';

// Phone number normalize function
function normalizePhone(to: string): string {
  let numeric = to.replace(/\D/g, '');
  if (numeric.startsWith('92')) return numeric;
  if (numeric.startsWith('0')) return '92' + numeric.substring(1);
  return '92' + numeric;
}

async function sendWithUltraMSG(to: string, message: string, settings: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  const { whatsappApiUrl, whatsappInstanceId, whatsappApiKey, whatsappPriority } = settings;

  if (!whatsappApiUrl || !whatsappInstanceId || !whatsappApiKey) {
    const errorMsg = 'UltraMSG API URL, Instance ID, or Token missing.';
    console.error(`❌ ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    const formattedTo = normalizePhone(to);
    
    // Robust URL construction
    const baseUrl = whatsappApiUrl.replace(/\/instance\d+/, '').replace(/\/$/, '');
    const fullUrl = `${baseUrl}/${whatsappInstanceId}/messages/chat`;

    const body = `token=${encodeURIComponent(whatsappApiKey)}&to=${encodeURIComponent(formattedTo)}&body=${encodeURIComponent(message)}&priority=${encodeURIComponent(whatsappPriority || '10')}`;

    console.log("📤 UltraMSG REQUEST", { fullUrl, body });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const responseText = await response.text();
    console.log("📥 UltraMSG RAW RESPONSE:", responseText);

    let responseJson: any = {};
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      const errorMsg = `Response not JSON: ${responseText}`;
      console.error(`❌ ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    if (!response.ok || responseJson.sent !== 'true') {
      const errorMsg = `API Error: ${responseJson.error || responseText}`;
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
  let settings: SchoolSettings = defaultSettings;
  
  if (clientSettings) {
    settings = { ...defaultSettings, ...clientSettings };
  } else {
    try {
      const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
      if (settingsDoc.exists()) {
        settings = { ...defaultSettings, ...settingsDoc.data() };
      }
    } catch (error) {
      console.error('Could not fetch settings. Using default settings.', error);
    }
  }
  
  let result: { success: boolean; error?: string };

  if (settings.whatsappProvider === 'ultramsg') {
    result = await sendWithUltraMSG(to, message, settings);
  } else if (settings.whatsappProvider === 'official') {
    result = await sendWithOfficialAPI(to, message, settings);
  } else {
    result = { success: false, error: "No active WhatsApp provider is configured." };
  }

  if (!result.success) {
    return { success: false, error: result.error || "An unknown error occurred." };
  }

  return { success: true };
}
