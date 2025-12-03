
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, Frown, Meh, Smile, Users } from 'lucide-react';
import { EmotionChart } from '@/components/reports/emotion-chart';
import { useCollection, useUser } from '@/firebase';
import type { AttendanceRecord, User, Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

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
  const { user: teacher, isLoading: isLoadingUser } = useUser();
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<User>('users');
  const { data: allAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>('attendance');
  const { data: allSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>('subjects');

  const isLoading = isLoadingUser || isLoadingUsers || isLoadingRecords || isLoadingSubjects;

  const teacherSubjectIds = useMemo(() => {
    if (isLoading || !allSubjects || !teacher) return [];
    return allSubjects.filter(s => s.teacherId === teacher.uid).map(s => s.id);
  }, [allSubjects, teacher, isLoading]);

  const teacherStudents = useMemo(() => {
    if (isLoading || !allUsers || teacherSubjectIds.length === 0) return [];
    return allUsers.filter(u => u.role === 'Student' && u.subjects?.some(subId => teacherSubjectIds.includes(subId)));
  }, [allUsers, teacherSubjectIds, isLoading]);

  const teacherAttendance = useMemo(() => {
    if (isLoading || !allAttendance || teacherSubjectIds.length === 0) return [];
    return allAttendance.filter(att => teacherSubjectIds.includes(att.subjectId));
  }, [allAttendance, teacherSubjectIds, isLoading]);
  
  const getTodaysAttendance = () => {
    if (!teacherAttendance) return 0;
    const today = new Date().toISOString().split('T')[0];
    const presentToday = new Set<string>();
    teacherAttendance.forEach(record => {
      if (record.date === today && record.status === 'Present') {
        presentToday.add(record.userId);
      }
    });
    return presentToday.size;
  };

  const totalStudents = teacherStudents?.length || 0;
  const presentToday = getTodaysAttendance();
  const recentRecords = teacherAttendance
    ?.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
    .slice(0, 5) || [];

  const renderStatCard = (title: string, value: number | string, description: string, icon: React.ReactNode, isLoading: boolean) => (
     <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
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
        <div className="text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-5 w-96" />
          ) : (
            <p>Welcome back! Here&apos;s a quick overview of your students and subjects.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {renderStatCard("Total Students", totalStudents, "Students in your subjects", <Users className="h-4 w-4 text-muted-foreground" />, isLoading)}
        {renderStatCard("Present Today", presentToday, "Unique students marked present today", <BarChart3 className="h-4 w-4 text-muted-foreground" />, isLoading)}

        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Emotions</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-full" /> : (
              <div className="flex -space-x-2 overflow-hidden">
                  {(recentRecords.length > 0) ? recentRecords.map((record, index) => (
                      <div key={record.id || index} className="inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center bg-background">
                          <EmotionIcon emotion={record.emotion} />
                      </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">No recent activity.</p>
                  )}
              </div>
            )}
             <p className="text-xs text-muted-foreground mt-2">
              Last 5 detected emotions in your classes
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Emotion Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 w-full flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <EmotionChart attendanceRecords={teacherAttendance} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
