
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
  async ({ reportData }) => {
    // SIMULATION: To avoid API quota issues, we dynamically generate a summary based on the input.
    try {
      const records: Array<{ userName: string; status: string; emotion: string; }> = JSON.parse(reportData);
      
      if (records.length === 0) {
        return { summary: "There is no attendance data to summarize for this session." };
      }

      const presentStudents = records.filter(r => r.status === 'Present').map(r => r.userName);
      const absentStudents = records.filter(r => r.status === 'Absent').map(r => r.userName);
      const emotions = records.filter(r => r.emotion && r.emotion !== 'N/A').map(r => r.emotion);

      let summaryText = `This is a simulated AI summary. For this session, ${presentStudents.length} student(s) were marked 'Present' and ${absentStudents.length} student(s) were marked 'Absent'.`;

      if (presentStudents.length > 0) {
        summaryText += ` Present students include: ${presentStudents.join(', ')}.`;
      }
      if (absentStudents.length > 0) {
        summaryText += ` Absent students include: ${absentStudents.join(', ')}.`;
      }
      
      if (emotions.length > 0) {
        const emotionCounts = emotions.reduce((acc, emotion) => {
            acc[emotion] = (acc[emotion] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);
        summaryText += ` The overall mood appears to be ${mostCommonEmotion.toLowerCase()}.`;
      } else {
        summaryText += " No emotion data was recorded for this session."
      }


      return { summary: summaryText };
    } catch (e) {
      console.error("Failed to parse report data for simulated summary:", e);
      return { summary: "Could not generate a dynamic summary because the report data was in an unexpected format." };
    }

    /*
    // REAL API CALL (currently disabled due to quota limits)
    const {output} = await prompt(input);
    return output!;
    */
  }
);
