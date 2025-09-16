
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
  const { whatsappApiUrl, whatsappApiKey, whatsappPriority } = settings;

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

    // Use URLSearchParams for robust body encoding
    const params = new URLSearchParams();
    params.append('token', whatsappApiKey);
    params.append('to', formattedTo);
    params.append('body', message);
    params.append('priority', whatsappPriority || '10');

    console.log("📤 UltraMSG REQUEST", { fullUrl, body: params.toString() });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log("📥 UltraMSG RAW RESPONSE:", responseText);

    let responseJson: any = {};
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      // If the response is not JSON, it might be a simple error string from a proxy or firewall
      const errorMsg = `Response not JSON: ${responseText}`;
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

  // If settings are passed from the client (like from the Settings test page), use them.
  // Otherwise, fetch the latest from the database.
  if (clientSettings) {
    settings = clientSettings;
  } else {
    try {
      const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
      if (settingsDoc.exists()) {
        // Merge fetched settings with defaults to ensure all keys are present
        settings = { ...defaultSettings, ...settingsDoc.data() };
      } else {
        // If no settings in DB, use the defaults (and this will likely fail if not configured)
        settings = defaultSettings;
      }
    } catch (error) {
      console.error('Could not fetch settings from Firestore. Falling back to default settings.', error);
      settings = defaultSettings;
    }
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
