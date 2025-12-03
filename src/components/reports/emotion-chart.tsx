
'use client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { AttendanceRecord } from '@/lib/types';

const emotionColors: { [key: string]: string } = {
  Happy: 'hsl(var(--chart-1))',
  Sad: 'hsl(var(--chart-2))',
  Neutral: 'hsl(var(--chart-3))',
  Surprised: 'hsl(var(--chart-4))',
};

type EmotionChartProps = {
  attendanceRecords: AttendanceRecord[];
};

export function EmotionChart({ attendanceRecords }: EmotionChartProps) {
  const emotionData = (attendanceRecords || [])
    .filter((record) => record.emotion !== 'N/A')
    .reduce((acc: { [key: string]: number }, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {});

  const chartData = Object.keys(emotionData).map((emotion) => ({
    name: emotion,
    count: emotionData[emotion],
    fill: emotionColors[emotion] || 'hsl(var(--muted))',
  }));

  const chartConfig = {
    count: {
      label: 'Count',
    },
    ...Object.keys(emotionColors).reduce((acc, emotion) => {
      acc[emotion] = {
        label: emotion,
        color: emotionColors[emotion],
      };
      return acc;
    }, {} as any),
  };

  return (
    <div className="h-64 w-full">
       {chartData.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No emotion data yet.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={4} />
        </BarChart>
      </ChartContainer>
      )}
    </div>
  );
}
