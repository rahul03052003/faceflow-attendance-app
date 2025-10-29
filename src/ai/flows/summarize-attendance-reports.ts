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
    const {output} = await prompt(input);
    return output!;
  }
);
