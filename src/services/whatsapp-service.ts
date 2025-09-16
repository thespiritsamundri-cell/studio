
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
    
    // The API URL from settings should already contain the instance ID.
    // e.g., https://api.ultramsg.com/instance12345/
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
       // If parsing fails, it might be a plain text error (like "Not Found")
       if (!response.ok) {
           const errorMsg = `API responded with non-JSON text: ${responseText}`;
           console.error(`❌ ${errorMsg}`);
           return { success: false, error: errorMsg };
       }
       // If response is OK but not JSON, it could be a simple success message
       console.log('✅ UltraMSG API Success (non-JSON):', responseText);
       return { success: true };
    }

    if (!response.ok || (responseJson.sent !== 'true' && !responseJson.id)) {
      const errorMsg = `API Error: ${responseJson.error?.message || responseJson.error || 'Unknown API error'}`;
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


export async function sendWhatsAppMessage(to: string, message: string, liveSettings?: SchoolSettings): Promise<{ success: boolean; error?: string }> {
  let effectiveSettings: SchoolSettings;

  if (liveSettings) {
    // If settings are passed directly (e.g., from the test button), use them.
    // This ensures the test button always uses the live data from the settings page.
    effectiveSettings = { ...defaultSettings, ...liveSettings };
  } else {
    // For all other cases (automated, custom messages), fetch the latest from DB.
    // This ensures consistency and uses the saved configuration.
    try {
      const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
      if (settingsDoc.exists()) {
        effectiveSettings = { ...defaultSettings, ...(settingsDoc.data() as Partial<SchoolSettings>) };
      } else {
        // This case should ideally not happen if settings are saved upon setup.
        console.error('Settings document not found in Firestore. Falling back to default settings.');
        effectiveSettings = defaultSettings;
      }
    } catch (error) {
      console.error('Could not fetch settings from Firestore. Falling back to default settings.', error);
      effectiveSettings = defaultSettings;
    }
  }
  
  if (!effectiveSettings.whatsappProvider || effectiveSettings.whatsappProvider === 'none') {
    return { success: false, error: "No Active WhatsApp Provider is Configured." };
  }
  
  let result: { success: boolean; error?: string };

  if (effectiveSettings.whatsappProvider === 'ultramsg') {
    result = await sendWithUltraMSG(to, message, effectiveSettings);
  } else if (effectiveSettings.whatsappProvider === 'official') {
    result = await sendWithOfficialAPI(to, message, effectiveSettings);
  } else {
    result = { success: false, error: "No Active WhatsApp Provider is Configured." };
  }

  if (!result.success) {
    return { success: false, error: result.error || "An unknown error occurred." };
  }

  return { success: true };
}
