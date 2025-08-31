'use server';
/**
 * @fileOverview A flow for generating QR codes.
 *
 * - generateQrCode - A function that generates a QR code from a given string.
 * - GenerateQrCodeInput - The input type for the generateQrCode function.
 * - GenerateQrCodeOutput - The return type for the generateQrCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQrCodeInputSchema = z.object({
  content: z.string().describe('The content to encode in the QR code.'),
});
export type GenerateQrCodeInput = z.infer<typeof GenerateQrCodeInputSchema>;

const GenerateQrCodeOutputSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      "The generated QR code image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type GenerateQrCodeOutput = z.infer<typeof GenerateQrCodeOutputSchema>;

export async function generateQrCode(input: GenerateQrCodeInput): Promise<GenerateQrCodeOutput> {
  return generateQrCodeFlow(input);
}

const generateQrCodeFlow = ai.defineFlow(
  {
    name: 'generateQrCodeFlow',
    inputSchema: GenerateQrCodeInputSchema,
    outputSchema: GenerateQrCodeOutputSchema,
  },
  async (input) => {
    // In a real scenario, we would use a library like 'qrcode' to generate the image.
    // For this example, we will use a placeholder service that returns a QR code image.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      input.content
    )}`;
    
    // In a real app, you'd fetch the image and convert to a data URI.
    // To avoid a server-side dependency on node-fetch for this example, we will use a known placeholder.
    // This is a simulation. A full implementation would require fetching the image and converting it to base64.
    const response = await fetch(qrCodeUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      qrCodeDataUri: `data:image/png;base64,${base64}`,
    };
  }
);
