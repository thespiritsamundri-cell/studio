'use server';
/**
 * @fileOverview A flow for generating barcodes.
 *
 * - generateBarcode - A function that generates a barcode from a given string.
 * - GenerateBarcodeRequest - The input type for the generateBarcode function.
 * - GenerateBarcodeResponse - The return type for the generateBarcode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBarcodeRequestSchema = z.object({
  content: z.string().describe('The content to encode in the barcode.'),
});
export type GenerateBarcodeRequest = z.infer<typeof GenerateBarcodeRequestSchema>;

const GenerateBarcodeResponseSchema = z.object({
  barcodeDataUri: z
    .string()
    .describe(
      "The generated barcode image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type GenerateBarcodeResponse = z.infer<typeof GenerateBarcodeResponseSchema>;

export async function generateBarcode(input: GenerateBarcodeRequest): Promise<GenerateBarcodeResponse> {
  return generateBarcodeFlow(input);
}

const generateBarcodeFlow = ai.defineFlow(
  {
    name: 'generateBarcodeFlow',
    inputSchema: GenerateBarcodeRequestSchema,
    outputSchema: GenerateBarcodeResponseSchema,
  },
  async (input) => {
    // Using barcode.tec-it.com to generate a Code 128 barcode image.
    const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
      input.content
    )}&code=Code128&dpi=96`;
    
    const response = await fetch(barcodeUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      barcodeDataUri: `data:image/png;base64,${base64}`,
    };
  }
);
