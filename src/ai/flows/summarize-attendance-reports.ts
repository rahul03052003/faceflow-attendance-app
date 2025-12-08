
'use server';

/**
 * @fileOverview Summarizes attendance reports using AI to identify trends and insights.
 *
 * - summarizeAttendanceReport - A function that summarizes attendance reports.
 * - SummarizeAttendanceReportInput - The input type for the summarizeAttendanceReport function.
 * - SummarizeAttendanceReportOutput - The return type for the summarizeAttendanceReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAttendanceReportInputSchema = z.object({
  reportData: z.string().describe('The attendance report data to summarize.'),
});
export type SummarizeAttendanceReportInput = z.infer<
  typeof SummarizeAttendanceReportInputSchema
>;

const SummarizeAttendanceReportOutputSchema = z.object({
  summary: z.string().describe('A summary of the attendance report data.'),
});
export type SummarizeAttendanceReportOutput = z.infer<
  typeof SummarizeAttendanceReportOutputSchema
>;

export async function summarizeAttendanceReport(
  input: SummarizeAttendanceReportInput
): Promise<SummarizeAttendanceReportOutput> {
  return summarizeAttendanceReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAttendanceReportPrompt',
  input: {schema: SummarizeAttendanceReportInputSchema},
  output: {schema: SummarizeAttendanceReportOutputSchema},
  prompt: `You are an AI assistant helping administrators summarize attendance reports.

  Please provide a concise summary of the following attendance report data, highlighting any key trends or insights:

  Report Data: {{{reportData}}}
  `,
});

const summarizeAttendanceReportFlow = ai.defineFlow(
  {
    name: 'summarizeAttendanceReportFlow',
    inputSchema: SummarizeAttendanceReportInputSchema,
    outputSchema: SummarizeAttendanceReportOutputSchema,
  },
  async input => {

    // SIMULATION: To avoid API quota issues, we return a static summary.
    return {
      summary: "This is a simulated AI summary. Based on the latest data for the CSE subject, attendance is high. Most listed students, including Rahul, Jeff, and Vishwas, were successfully marked as 'Present'. One student, Elon Musk, was marked 'Absent'. Emotion analysis indicates a generally positive classroom atmosphere."
    };

    /*
    // REAL API CALL (currently disabled due to quota limits)
    const {output} = await prompt(input);
    return output!;
    */
  }
);
