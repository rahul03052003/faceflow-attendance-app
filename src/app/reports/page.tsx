import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AttendanceTable } from '@/components/reports/attendance-table';
import { EmotionChart } from '@/components/reports/emotion-chart';
import { AiSummary } from '@/components/reports/ai-summary';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Reports
        </h1>
        <p className="text-muted-foreground">
          View detailed attendance records and emotion analysis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Log</CardTitle>
                    <CardDescription>
                        A detailed log of all attendance records.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AttendanceTable />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>
                Breakdown of detected emotions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionChart />
            </CardContent>
          </Card>
          <AiSummary />
        </div>
      </div>
    </div>
  );
}
