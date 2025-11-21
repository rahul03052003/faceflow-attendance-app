'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';
import { summarizeAttendanceReport } from '@/ai/flows/summarize-attendance-reports';
import type { AttendanceRecord } from '@/lib/types';

type AiSummaryProps = {
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
};

export function AiSummary({ attendanceRecords, isLoading: isLoadingRecords }: AiSummaryProps) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const reportData = JSON.stringify(attendanceRecords, null, 2);
      const result = await summarizeAttendanceReport({ reportData });
      setSummary(result.summary);
    } catch (e) {
      setError('Failed to generate summary. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear summary if records change
  useEffect(() => {
    setSummary('');
  }, [attendanceRecords]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="text-primary" />
          AI Summary
        </CardTitle>
        <CardDescription>
          Let AI analyze the attendance data and provide key insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
        {!summary && !isLoading && !error && (
            <p className="text-sm text-muted-foreground text-center pt-4">Click below to generate a summary.</p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateSummary} disabled={isLoading || isLoadingRecords} className="w-full">
          {isLoading ? 'Generating...' : 'Generate Summary'}
        </Button>
      </CardFooter>
    </Card>
  );
}
