
'use server';

import type { SchoolSettings } from "@/context/settings-context";

export async function sendWhatsAppMessage(
    to: string, 
    message: string, 
    settings: SchoolSettings
): Promise<boolean> {
  console.log(`Attempting to send WhatsApp message to ${to} via ${settings.whatsappProvider}`);

  if (settings.whatsappProvider === 'ultramsg') {
    return sendWithUltraMSG(to, message, settings);
  } else if (settings.whatsappProvider === 'official') {
    return sendWithOfficialAPI(to, message, settings);
  } else {
    console.error('No valid WhatsApp provider selected in settings.');
    throw new Error('No valid WhatsApp provider selected.');
  }
}

async function sendWithUltraMSG(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
    const { whatsappApiUrl, whatsappApiKey, whatsappInstanceId, whatsappPriority } = settings;
    if (!whatsappApiUrl || !whatsappApiKey || !whatsappInstanceId) {
        console.error('UltraMSG API URL, Token, or Instance ID not provided in settings.');
        throw new Error('UltraMSG API credentials are not configured.');
    }
  
    const body = JSON.stringify({
        token: whatsappApiKey,
        to: to,
        body: message,
        priority: whatsappPriority || "10",
        referenceId: "",
    });

    try {
        const fullUrl = `${whatsappApiUrl}/messages/chat`;
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        const responseJson = await response.json();

        if (!response.ok) {
            const errorMsg = responseJson?.error?.message || `API Error: ${response.status}`;
            console.error('UltraMSG API Error:', errorMsg, responseJson);
            throw new Error(errorMsg);
        }
        
        console.log('UltraMSG API Success:', responseJson);
        return true;

    } catch (error: any) {
        console.error('Failed to send WhatsApp message with UltraMSG:', error);
        throw error;
    }
}

async function sendWithOfficialAPI(to: string, message: string, settings: SchoolSettings): Promise<boolean> {
    const { whatsappPhoneNumberId, whatsappAccessToken } = settings;
    if (!whatsappPhoneNumberId || !whatsappAccessToken) {
        console.error('Official WhatsApp API Phone Number ID or Access Token not provided.');
        throw new Error('Official WhatsApp API credentials are not configured.');
    }

    const body = JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    });

    try {
        const url = `https://graph.facebook.com/v19.0/${whatsappPhoneNumberId}/messages`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: body
        });
        const responseJson = await response.json();

        if (!response.ok) {
            const errorMsg = responseJson?.error?.message || `API Error: ${response.status}`;
            console.error('Official WhatsApp API Error:', errorMsg, responseJson);
            throw new Error(errorMsg);
        }

        console.log('Official WhatsApp API Success:', responseJson);
        return true;

    } catch (error: any) {
        console.error('Failed to send WhatsApp message with Official API:', error);
        throw error;
    }
}
