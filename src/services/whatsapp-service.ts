// This is a REAL service. In a real application, you would integrate with a
// WhatsApp API provider like Twilio or UltraMSG to send messages.
'use server';

export async function sendWhatsAppMessage(
    to: string, 
    message: string, 
    apiUrl?: string, 
    token?: string,
    instanceId?: string,
    priority?: string
): Promise<boolean> {
  console.log(`Attempting to send WhatsApp message to ${to} via ${apiUrl}`);
  
  if (!apiUrl || !token || !instanceId) {
    console.error('WhatsApp API URL, Token, or Instance ID not provided in settings.');
    // Return false without showing a toast, as the calling function will handle user feedback.
    throw new Error('API URL, Token, or Instance ID not provided.');
  }
  
  // The body format specific to UltraMSG API
  const body = JSON.stringify({
      token: token,
      to: to,
      body: message,
      priority: priority || "10", // Default priority to 10 if not provided
      referenceId: "", // Optional, can be empty
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });

    const responseJson = await response.json();

    if (!response.ok) {
      // Try to get more details from the API response if possible
      const errorMsg = responseJson?.error?.message || `API Error: ${response.status}`;
      console.error('WhatsApp API Error:', errorMsg, responseJson);
      throw new Error(errorMsg);
    }
    
    console.log('WhatsApp API Success:', responseJson);
    return true;

  } catch (error: any) {
    console.error('Failed to send WhatsApp message due to a network or fetch error:', error);
    // Re-throw the error so the calling function can handle it.
    throw error;
  }
}
