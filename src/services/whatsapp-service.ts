// This is a REAL service. In a real application, you would integrate with a
// WhatsApp API provider like Twilio or UltraMSG to send messages.

export async function sendWhatsAppMessage(to: string, message: string, apiUrl?: string, apiKey?: string): Promise<boolean> {
  console.log(`Attempting to send WhatsApp message to ${to} via ${apiUrl}`);
  
  if (!apiUrl || !apiKey) {
    console.error('WhatsApp API URL or Key not provided in settings.');
    // Return false without showing a toast, as the calling function will handle user feedback.
    return false;
  }
  
  // The body format can vary between WhatsApp API providers.
  // This is a common format, but may need to be adjusted for your specific provider.
  const body = JSON.stringify({
      token: apiKey, // Some providers use a token in the body
      to: to,
      body: message,
  });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Some providers might use a Bearer token in the header instead
        // 'Authorization': `Bearer ${apiKey}` 
      },
      body: body
    });

    if (!response.ok) {
      // Try to get more details from the API response if possible
      const errorBody = await response.text();
      console.error('WhatsApp API Error:', `Status: ${response.status}`, errorBody);
      return false;
    }
    
    console.log(`Successfully sent message to ${to}`);
    return true;

  } catch (error) {
    console.error('Failed to send WhatsApp message due to a network or fetch error:', error);
    return false;
  }
}
