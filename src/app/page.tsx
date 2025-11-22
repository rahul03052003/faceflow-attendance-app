'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, Frown, Meh, Smile, Users } from 'lucide-react';
import { EmotionChart } from '@/components/reports/emotion-chart';
import { useCollection } from '@/firebase';
import type { AttendanceRecord, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DEMO_USERS, DEMO_ATTENDANCE } from '@/lib/types';

function EmotionIcon({ emotion }: { emotion: string }) {
  switch (emotion) {
    case 'Happy':
      return <Smile className="text-green-500" />;
    case 'Neutral':
      return <Meh className="text-yellow-500" />;
    case 'Sad':
      return <Frown className="text-blue-500" />;
    default:
      return <Meh className="text-gray-500" />;
  }
}

export default function Home() {
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useCollection<User>('users');
  const { data: attendanceData, isLoading: isLoadingRecords, error: attendanceError } =
    useCollection<AttendanceRecord>('attendance');

  const useDemoData = (!usersData || usersData.length === 0) && !isLoadingUsers && (!attendanceData || attendanceData.length === 0) && !isLoadingRecords;
  
  const users = useDemoData ? DEMO_USERS : usersData;
  const attendanceRecords = useDemoData ? DEMO_ATTENDANCE : attendanceData;

  const getTodaysAttendance = () => {
    if (!attendanceRecords) return 0;
    const today = new Date().toISOString().split('T')[0];
    return attendanceRecords.filter(
      (record) => record.date === today && record.status === 'Present'
    ).length;
  };

  const totalUsers = users?.length || 0;
  const presentToday = getTodaysAttendance();
  const recentRecords = attendanceRecords
    ?.sort((a, b) => (b.timestamp as any)?.seconds || (b.timestamp as Date).getTime() - (a.timestamp as any)?.seconds || (a.timestamp as Date).getTime())
    .slice(0, 5) || [];


  const renderStatCard = (title: string, value: number | string, description: string, icon: React.ReactNode, isLoading: boolean) => (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading && !useDemoData ? (
          <Skeleton className="h-8 w-1/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s a quick overview of your system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {renderStatCard("Total Users", totalUsers, "Managed users in the system", <Users className="h-4 w-4 text-muted-foreground" />, isLoadingUsers)}
        {renderStatCard("Present Today", presentToday, "Users marked present for today's date", <BarChart3 className="h-4 w-4 text-muted-foreground" />, isLoadingRecords)}

        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Emotions</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingRecords && !useDemoData ? <Skeleton className="h-8 w-full" /> : (
              <div className="flex -space-x-2 overflow-hidden">
                  {recentRecords.map((record, index) => (
                      <div key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center bg-background">
                          <EmotionIcon emotion={record.emotion} />
                      </div>
                  ))}
              </div>
            )}
             <p className="text-xs text-muted-foreground mt-2">
              Last 5 detected emotions
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Emotion Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecords && !useDemoData ? (
            <div className="h-64 w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <EmotionChart attendanceRecords={attendanceRecords || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
