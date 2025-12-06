'use server';

/**
 * @fileOverview A flow to send email notifications to absent students.
 *
 * - notifyAbsentees - Sends a templated email to a list of absent students.
 * - NotifyAbsenteesInput - The input type for the flow.
 * - NotifyAbsenteesOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AbsenteeSchema = z.object({
  name: z.string().describe("The student's name."),
  email: z.string().email().describe("The student's email address."),
  subjectName: z.string().describe('The subject they were absent from.'),
  date: z.string().describe('The date of absence.'),
});

const NotifyAbsenteesInputSchema = z.object({
  absentees: z.array(AbsenteeSchema).describe('An array of absent students to notify.'),
});
export type NotifyAbsenteesInput = z.infer<typeof NotifyAbsenteesInputSchema>;

const NotifyAbsenteesOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type NotifyAbsenteesOutput = z.infer<typeof NotifyAbsenteesOutputSchema>;

export async function notifyAbsentees(
  input: NotifyAbsenteesInput
): Promise<NotifyAbsenteesOutput> {
  return notifyAbsenteesFlow(input);
}

const notifyAbsenteesFlow = ai.defineFlow(
  {
    name: 'notifyAbsenteesFlow',
    inputSchema: NotifyAbsenteesInputSchema,
    outputSchema: NotifyAbsenteesOutputSchema,
  },
  async ({ absentees }) => {
    if (!absentees || absentees.length === 0) {
      return { success: false, message: 'No absentees were provided.' };
    }

    console.log(`SIMULATING SENDING ${absentees.length} EMAILS...`);

    for (const absentee of absentees) {
      // In a real application, you would integrate a third-party email service
      // like Nodemailer, SendGrid, or Resend here.
      const emailBody = `
        Subject: Unexcused Absence Notification
        To: ${absentee.email}
        
        Dear ${absentee.name},
        
        This is an automated notification to inform you that you were marked as absent 
        for the subject "${absentee.subjectName}" on ${absentee.date}.
        
        If you believe this is an error, please contact your teacher or the administration.
        
        Regards,
        faceflow Attendance System
      `;

      // We log to the console to simulate the email sending action.
      console.log('--- EMAIL TO BE SENT ---');
      console.log(emailBody.trim());
      console.log('------------------------');
    }
    
    return {
      success: true,
      message: `Successfully processed notifications for ${absentees.length} absent students.`,
    };
  }
);
