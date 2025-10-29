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
import { ATTENDANCE_RECORDS } from '@/lib/data';

const emotionColors: { [key: string]: string } = {
  Happy: 'hsl(var(--chart-1))',
  Sad: 'hsl(var(--chart-2))',
  Neutral: 'hsl(var(--chart-3))',
  Surprised: 'hsl(var(--chart-4))',
};

export function EmotionChart() {
  const emotionData = ATTENDANCE_RECORDS.filter(
    (record) => record.emotion !== 'N/A'
  ).reduce((acc: { [key: string]: number }, record) => {
    acc[record.emotion] = (acc[record.emotion] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(emotionData).map((emotion) => ({
    name: emotion,
    count: emotionData[emotion],
    fill: emotionColors[emotion],
  }));

  const chartConfig = {
    count: {
      label: "Count",
    },
    ...Object.keys(emotionColors).reduce((acc, emotion) => {
        acc[emotion] = {
            label: emotion,
            color: emotionColors[emotion],
        };
        return acc;
    }, {} as any)
  };


  return (
    <div className="h-64 w-full">
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
    </div>
  );
}
