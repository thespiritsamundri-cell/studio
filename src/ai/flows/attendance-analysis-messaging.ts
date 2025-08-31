// attendance-analysis-messaging.ts
'use server';

/**
 * @fileOverview AI-powered attendance analysis and personalized messaging for school administrators.
 *
 * - analyzeAttendanceAndSendMessage - Analyzes attendance data and sends personalized WhatsApp messages to parents.
 * - AttendanceAnalysisInput - The input type for the analyzeAttendanceAndSendMessage function.
 * - AttendanceAnalysisOutput - The return type for the analyzeAttendanceAndSendMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';

const AttendanceAnalysisInputSchema = z.object({
  studentId: z.string().describe('The unique identifier for the student.'),
  studentName: z.string().describe('The name of the student.'),
  parentPhoneNumber: z.string().describe('The WhatsApp number of the parent.'),
  attendanceRecords: z.array(
    z.object({
      date: z.string().describe('The date of the attendance record (YYYY-MM-DD).'),
      isPresent: z.boolean().describe('Whether the student was present or not.'),
    })
  ).describe('An array of attendance records for the student.'),
  messageCustomization: z.string().optional().describe('Optional message customization for WhatsApp message.'),
});
export type AttendanceAnalysisInput = z.infer<typeof AttendanceAnalysisInputSchema>;

const AttendanceAnalysisOutputSchema = z.object({
  analysisResult: z.string().describe('AI analysis of attendance patterns.'),
  messageSent: z.boolean().describe('Indicates whether a WhatsApp message was sent.'),
});
export type AttendanceAnalysisOutput = z.infer<typeof AttendanceAnalysisOutputSchema>;

export async function analyzeAttendanceAndSendMessage(
  input: AttendanceAnalysisInput
): Promise<AttendanceAnalysisOutput> {
  return analyzeAttendanceAndSendMessageFlow(input);
}

const analyzeAttendancePrompt = ai.definePrompt({
  name: 'analyzeAttendancePrompt',
  input: {schema: AttendanceAnalysisInputSchema},
  output: {schema: AttendanceAnalysisOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing student attendance data and identifying unusual patterns.

  Analyze the following attendance records for student {{studentName}} (ID: {{studentId}}):

  {{#each attendanceRecords}}
  - Date: {{date}}, Present: {{#if isPresent}}Yes{{else}}No{{/if}}
  {{/each}}

  Based on this data, determine if there are any unusual absence patterns that warrant sending a message to the parent.
  Consider factors such as sudden increases in absences, consecutive absences, or absences on specific days of the week.

  If an unusual pattern is detected, generate a message to the parent (phone number: {{parentPhoneNumber}}) informing them of the situation and requesting their attention.  Include a brief summary of the analysis in the message.

  If no unusual pattern is detected, indicate that no message should be sent.

  Message Customization: {{messageCustomization}}

  Output in JSON format:
  {
    "analysisResult": "Your analysis of the attendance data.",
    "messageSent": true or false,
  }
  `,
});

const analyzeAttendanceAndSendMessageFlow = ai.defineFlow(
  {
    name: 'analyzeAttendanceAndSendMessageFlow',
    inputSchema: AttendanceAnalysisInputSchema,
    outputSchema: AttendanceAnalysisOutputSchema,
  },
  async input => {
    const {output} = await analyzeAttendancePrompt(input);

    if (output && output.analysisResult && output.analysisResult.toLowerCase().includes('unusual pattern')) {
      // Send WhatsApp message using the imported service
      try {
        const message = `Dear Parent, \n\nWe have noticed an unusual absence pattern for your child, ${input.studentName}. ${output.analysisResult} Please contact the school to discuss this matter.  \n\nThank you.\nEduCentral School Administration`;
        const success = await sendWhatsAppMessage(input.parentPhoneNumber, message);

        if (success) {
          return {
            analysisResult: output.analysisResult,
            messageSent: true,
          };
        } else {
          return {
            analysisResult: output.analysisResult,
            messageSent: false,
          };
        }
      } catch (error: any) {
        console.error('Error sending WhatsApp message:', error);
        return {
          analysisResult: output.analysisResult,
          messageSent: false,
        };
      }
    } else {
      return {
        analysisResult: output?.analysisResult || 'No unusual pattern detected.',
        messageSent: false,
      };
    }
  }
);
