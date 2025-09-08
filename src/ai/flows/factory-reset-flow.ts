'use server';
/**
 * @fileOverview A flow for handling the secure factory reset process.
 *
 * - sendResetOtp - Generates and sends a one-time password for verification.
 * - verifyResetOtp - Verifies the provided OTP.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendWhatsAppMessage } from '../../services/whatsapp-service';

// NOTE: In a production environment, this should be stored in a secure,
// persistent, and time-limited cache like Redis or Firestore, not in-memory.
let otpStorage: { otp: string; timestamp: number } | null = null;
const OTP_EXPIRATION_MINUTES = 5;

// --- Send OTP ---

const SendResetOtpInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to send the OTP to.'),
  schoolName: z.string().describe('The name of the school for the message.'),
  apiUrl: z.string(),
  apiKey: z.string(),
  instanceId: z.string(),
  priority: z.string(),
});
export type SendResetOtpInput = z.infer<typeof SendResetOtpInputSchema>;

const SendResetOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendResetOtpOutput = z.infer<typeof SendResetOtpOutputSchema>;

export async function sendResetOtp(input: SendResetOtpInput): Promise<SendResetOtpOutput> {
  return sendResetOtpFlow(input);
}

const sendResetOtpFlow = ai.defineFlow(
  {
    name: 'sendResetOtpFlow',
    inputSchema: SendResetOtpInputSchema,
    outputSchema: SendResetOtpOutputSchema,
  },
  async (input) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    otpStorage = { otp, timestamp: Date.now() };

    const message = `Your one-time password (OTP) for resetting all data for ${input.schoolName} is: ${otp}. This code will expire in ${OTP_EXPIRATION_MINUTES} minutes. DO NOT share this code.`;

    try {
      const success = await sendWhatsAppMessage(
        input.phoneNumber,
        message,
        input.apiUrl,
        input.apiKey,
        input.instanceId,
        input.priority
      );

      if (success) {
        return { success: true, message: `OTP sent to ${input.phoneNumber}` };
      } else {
        throw new Error('WhatsApp API returned a failure status.');
      }
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      otpStorage = null; // Clear OTP if sending failed
      return { success: false, message: `Failed to send OTP: ${error.message}` };
    }
  }
);


// --- Verify OTP ---

const VerifyResetOtpInputSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits.'),
});
export type VerifyResetOtpInput = z.infer<typeof VerifyResetOtpInputSchema>;

const VerifyResetOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type VerifyResetOtpOutput = z.infer<typeof VerifyResetOtpOutputSchema>;

export async function verifyResetOtp(input: VerifyResetOtpInput): Promise<VerifyResetOtpOutput> {
    return verifyResetOtpFlow(input);
}

const verifyResetOtpFlow = ai.defineFlow({
    name: 'verifyResetOtpFlow',
    inputSchema: VerifyResetOtpInputSchema,
    outputSchema: VerifyResetOtpOutputSchema,
}, async ({ otp }) => {
    if (!otpStorage) {
        return { success: false, message: 'No OTP has been sent or it has already been used.' };
    }

    const now = Date.now();
    const otpAgeInMinutes = (now - otpStorage.timestamp) / (1000 * 60);

    if (otpAgeInMinutes > OTP_EXPIRATION_MINUTES) {
        otpStorage = null; // Clear expired OTP
        return { success: false, message: 'OTP has expired. Please try again.' };
    }

    if (otp === otpStorage.otp) {
        otpStorage = null; // OTP is single-use, clear it after verification
        return { success: true, message: 'OTP verified successfully.' };
    }

    return { success: false, message: 'Invalid OTP.' };
});
