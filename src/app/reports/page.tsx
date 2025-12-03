
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
import { useCallback, useMemo } from 'react';
import { query, where } from 'firebase/firestore';


export default function ReportsPage() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();

  const subjectsQuery = useCallback((ref: any) => {
    if (!currentUser?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', currentUser.uid));
  }, [currentUser?.uid]);

  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    currentUser?.role === 'Teacher' ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );
  
  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const attendanceQuery = useCallback((ref: any) => {
    if (currentUser?.role === 'Admin') return ref;
    if (teacherSubjectIds.length > 0) {
      return query(ref, where('subjectId', 'in', teacherSubjectIds));
    }
    // Return a query that will find nothing if there are no subjects
    return query(ref, where('subjectId', '==', ''));
  }, [currentUser?.role, teacherSubjectIds]);


  const { data: allAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>(
    currentUser ? 'attendance' : null,
    { buildQuery: attendanceQuery }
  );

  const isLoading = isLoadingUser || isLoadingRecords || isLoadingSubjects;
  
  const isAdmin = useMemo(() => !isLoadingUser && currentUser?.role === 'Admin', [currentUser, isLoadingUser]);

  const filteredAttendance = useMemo(() => {
    if (isLoading || !allAttendance) return [];
    return allAttendance;
  }, [allAttendance, isLoading]);


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Attendance Reports
        </h1>
        <div className="text-muted-foreground">
          {isLoading ? <Skeleton className="h-5 w-72" /> : <p>{(isAdmin ? "View detailed attendance records for all classes." : "View detailed attendance records for your subjects.")}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
              <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-96" /> : (isAdmin ? "A detailed log of all attendance records across the system." : "A detailed log of all attendance records for your classes.")}
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
                <AttendanceTable attendanceRecords={filteredAttendance || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
              <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-64" /> : (isAdmin ? "Breakdown of detected emotions across all classes." : "Breakdown of detected emotions in your classes.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <EmotionChart attendanceRecords={filteredAttendance || []} />
              )}
            </CardContent>
          </Card>
          <AiSummary attendanceRecords={filteredAttendance || []} isLoading={isLoading}/>
        </div>
      </div>
    </div>
  );
}

    