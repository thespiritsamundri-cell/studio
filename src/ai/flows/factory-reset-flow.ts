'use server';
/**
 * @fileOverview A flow for handling the factory reset OTP process.
 * 
 * - sendOtpEmail - A function that generates an OTP and simulates sending it via email.
 * - SendOtpEmailInput - The input type for the sendOtpEmail function.
 * - SendOtpEmailOutput - The return type for the sendOtpEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendOtpEmailInputSchema = z.object({
  email: z.string().email().describe('The email address to send the OTP to.'),
});
export type SendOtpEmailInput = z.infer<typeof SendOtpEmailInputSchema>;

const SendOtpEmailOutputSchema = z.object({
  otp: z.string().describe('The 6-digit One-Time Password.'),
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A status message.'),
});
export type SendOtpEmailOutput = z.infer<typeof SendOtpEmailOutputSchema>;

export async function sendOtpEmail(input: SendOtpEmailInput): Promise<SendOtpEmailOutput> {
  return sendOtpEmailFlow(input);
}

const sendOtpEmailFlow = ai.defineFlow(
  {
    name: 'sendOtpEmailFlow',
    inputSchema: SendOtpEmailInputSchema,
    outputSchema: SendOtpEmailOutputSchema,
  },
  async (input) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real application, you would integrate with an email service like SendGrid or Nodemailer.
    // For this development environment, we will log the OTP to the console for the user to retrieve.
    console.log(`
    ============================================================
    |                                                          |
    |  FACTORY RESET OTP                                       |
    |                                                          |
    |  To: ${input.email}                                         |
    |  Your Verification Code is: ${otp}                       |
    |                                                          |
    ============================================================
    `);
    
    return {
      otp,
      success: true,
      message: `An OTP has been sent to ${input.email}. (Check the console).`,
    };
  }
);
