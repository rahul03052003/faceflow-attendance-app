
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
  const { user: teacher } = useUser();
  const { data: allAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>('attendance');
  const { data: allSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>('subjects');

  const teacherSubjectIds = useMemo(() => {
    if (!allSubjects || !teacher) return [];
    return allSubjects.filter(s => s.teacherId === teacher.uid).map(s => s.id);
  }, [allSubjects, teacher]);

  const teacherAttendance = useMemo(() => {
    if (!allAttendance || teacherSubjectIds.length === 0) return [];
    return allAttendance.filter(att => teacherSubjectIds.includes(att.subjectId));
  }, [allAttendance, teacherSubjectIds]);

  const isLoading = isLoadingRecords || isLoadingSubjects;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Reports
        </h1>
        <p className="text-muted-foreground">
          View detailed attendance records for your subjects.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
              <CardDescription>
                A detailed log of all attendance records for your classes.
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
                <AttendanceTable attendanceRecords={teacherAttendance} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>
                Breakdown of detected emotions in your classes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <EmotionChart attendanceRecords={teacherAttendance} />
              )}
            </CardContent>
          </Card>
          <AiSummary attendanceRecords={teacherAttendance} isLoading={isLoading}/>
        </div>
      </div>
    </div>
  );
}
