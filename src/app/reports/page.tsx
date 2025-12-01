
'use client';

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
import { useCollection, useUser } from '@/firebase';
import type { AttendanceRecord, Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';


export default function ReportsPage() {
  const { user: currentUser } = useUser();
  const { data: allAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>('attendance');
  const { data: allSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>('subjects');

  const isAdmin = currentUser?.role === 'Admin';

  const teacherSubjectIds = useMemo(() => {
    if (isAdmin || !allSubjects || !currentUser) return [];
    return allSubjects.filter(s => s.teacherId === currentUser.uid).map(s => s.id);
  }, [allSubjects, currentUser, isAdmin]);

  const filteredAttendance = useMemo(() => {
    if (isAdmin) return allAttendance || [];
    if (!allAttendance || teacherSubjectIds.length === 0) return [];
    return allAttendance.filter(att => teacherSubjectIds.includes(att.subjectId));
  }, [allAttendance, teacherSubjectIds, isAdmin]);

  const isLoading = isLoadingRecords || isLoadingSubjects;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Reports
        </h1>
        <p className="text-muted-foreground">
          {isAdmin ? "View detailed attendance records for all classes." : "View detailed attendance records for your subjects."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
              <CardDescription>
                {isAdmin ? "A detailed log of all attendance records across the system." : "A detailed log of all attendance records for your classes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <AttendanceTable attendanceRecords={filteredAttendance} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>
                {isAdmin ? "Breakdown of detected emotions across all classes." : "Breakdown of detected emotions in your classes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <EmotionChart attendanceRecords={filteredAttendance} />
              )}
            </CardContent>
          </Card>
          <AiSummary attendanceRecords={filteredAttendance} isLoading={isLoading}/>
        </div>
      </div>
    </div>
  );
}
