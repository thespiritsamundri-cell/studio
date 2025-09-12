
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SchoolSettings } from '@/context/settings-context';

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  try {
    const settingsDoc = await getDoc(doc(db, 'Settings', 'School Settings'));
    if (!settingsDoc.exists()) {
      throw new Error('School settings are not configured in the database.');
    }
    const settings = settingsDoc.data() as SchoolSettings;

    const { whatsappApiUrl, whatsappApiKey, whatsappInstanceId, whatsappPriority } = settings;

    if (!whatsappApiUrl || !whatsappApiKey || !whatsappInstanceId) {
      console.error('WhatsApp API URL, Token, or Instance ID not provided in settings.');
      throw new Error('API credentials are not configured in settings.');
    }

    console.log(`Attempting to send WhatsApp message to ${to} via ${whatsappApiUrl}`);

    const body = JSON.stringify({
      token: whatsappApiKey,
      to: to,
      body: message,
      priority: whatsappPriority || "10",
      referenceId: "",
    });

    const fullUrl = `${whatsappApiUrl}/messages/chat`;
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });

    const responseJson = await response.json();

    if (!response.ok) {
      const errorMsg = responseJson?.error?.message || `API Error: ${response.status}`;
      console.error('WhatsApp API Error:', errorMsg, responseJson);
      throw new Error(errorMsg);
    }

    console.log('WhatsApp API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error);
    // Re-throw the error so the calling function can handle it.
    throw error;
  }
}
