'use server';
/**
 * @fileOverview A flow for generating QR codes.
 *
 * - generateQrCode - A function that generates a QR code from a given string.
 * - GenerateQrCodeRequest - The input type for the generateQrCode function.
 * - GenerateQrCodeResponse - The return type for the generateQrCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQrCodeRequestSchema = z.object({
  content: z.string().describe('The content to encode in the QR code.'),
  logoUrl: z.string().optional().describe('Optional URL of an image to be placed in the center of the QR code.'),
});
export type GenerateQrCodeRequest = z.infer<typeof GenerateQrCodeRequestSchema>;

const GenerateQrCodeResponseSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      "The generated QR code image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type GenerateQrCodeResponse = z.infer<typeof GenerateQrCodeResponseSchema>;

export async function generateQrCode(input: GenerateQrCodeRequest): Promise<GenerateQrCodeResponse> {
  return generateQrCodeFlow(input);
}

const generateQrCodeFlow = ai.defineFlow(
  {
    name: 'generateQrCodeFlow',
    inputSchema: GenerateQrCodeRequestSchema,
    outputSchema: GenerateQrCodeResponseSchema,
  },
  async (input) => {
    // Using barcode.tec-it.com to generate a QR Code image.
    // The logoUrl is temporarily removed to prevent "Request-URI Too Long" errors when a data URI is passed.
    // A more robust solution that supports POST requests for the logo might be needed.
    let qrCodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
      input.content
    )}&code=QRCode&dpi=96&eclevel=H`;
    
    const response = await fetch(qrCodeUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch QR code: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      qrCodeDataUri: `data:image/png;base64,${base64}`,
    };
  }
);
