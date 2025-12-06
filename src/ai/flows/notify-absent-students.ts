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
import * as nodemailer from 'nodemailer';

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

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        const errorMessage = 'Email credentials are not configured in the .env file. Cannot send emails.';
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass, // Use the App Password here
        },
    });

    const emailPromises = absentees.map(absentee => {
        const mailOptions = {
            from: `"faceflow Attendance System" <${emailUser}>`,
            to: absentee.email,
            subject: 'Unexcused Absence Notification',
            text: `
Dear ${absentee.name},

This is an automated notification to inform you that you were marked as absent for the subject "${absentee.subjectName}" on ${absentee.date}.

If you believe this is an error, please contact your teacher or the administration.

Regards,
faceflow Attendance System
            `
        };

        return transporter.sendMail(mailOptions);
    });

    try {
        await Promise.all(emailPromises);
        return {
          success: true,
          message: `Successfully sent notifications to ${absentees.length} absent students.`,
        };
    } catch(error: any) {
        console.error("Failed to send one or more emails:", error);
        return {
            success: false,
            message: `Failed to send emails. Please check server logs for details. Error: ${error.message}`
        }
    }
  }
);
