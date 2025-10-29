'use client';

import { useState } from 'react';
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
import { ATTENDANCE_RECORDS } from '@/lib/data';

export function AiSummary() {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const reportData = JSON.stringify(ATTENDANCE_RECORDS, null, 2);
      const result = await summarizeAttendanceReport({ reportData });
      setSummary(result.summary);
    } catch (e) {
      setError('Failed to generate summary. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

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
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full">
          {isLoading ? 'Generating...' : 'Generate Summary'}
        </Button>
      </CardFooter>
    </Card>
  );
}
