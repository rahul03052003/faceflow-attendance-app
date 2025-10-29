import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { USERS, ATTENDANCE_RECORDS } from '@/lib/data';
import { BarChart3, Frown, Meh, Smile, Users } from 'lucide-react';
import { EmotionChart } from '@/components/reports/emotion-chart';

function getTodaysAttendance() {
  const today = new Date().toISOString().split('T')[0];
  return ATTENDANCE_RECORDS.filter(
    (record) => record.date === today && record.status === 'Present'
  ).length;
}

function getEmotionIcon(emotion: string) {
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
  const totalUsers = USERS.length;
  const presentToday = getTodaysAttendance();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s a quick overview of your system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Managed users in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Present Today
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentToday}</div>
            <p className="text-xs text-muted-foreground">
              Users marked present for today&apos;s date
            </p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Emotions</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2 overflow-hidden">
                {ATTENDANCE_RECORDS.slice(0,5).map((record, index) => (
                    <div key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                        {getEmotionIcon(record.emotion)}
                    </div>
                ))}
            </div>
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
          <EmotionChart />
        </CardContent>
      </Card>
    </div>
  );
}
