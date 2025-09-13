
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

async function sendWithUltraMSG(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
  const { whatsappApiUrl, whatsappInstanceId, whatsappApiKey, whatsappPriority } = settings;

  if (!whatsappApiUrl || !whatsappInstanceId || !whatsappApiKey) {
    console.error('❌ UltraMSG API URL, Instance ID, or Token missing.');
    return false;
  }

  try {
    const formattedTo = normalizePhone(to);
    const baseUrl = whatsappApiUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}/${whatsappInstanceId}/messages/chat`;

    const body = `token=${encodeURIComponent(whatsappApiKey)}&to=${encodeURIComponent(formattedTo)}&body=${encodeURIComponent(message)}&priority=${encodeURIComponent(whatsappPriority || '10')}`;

    console.log("📤 UltraMSG REQUEST", { fullUrl, body });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const responseText = await response.text();
    console.log("📥 UltraMSG RAW RESPONSE:", responseText);

    let responseJson: any = {};
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      console.error("❌ Response not JSON:", responseText);
      return false;
    }

    if (!response.ok || responseJson.sent !== 'true') {
      console.error('❌ UltraMSG API Error:', responseJson);
      return false;
    }

    console.log('✅ UltraMSG API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('❌ Error in sendWithUltraMSG:', error);
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
