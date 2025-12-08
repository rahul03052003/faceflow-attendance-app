
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AttendanceTable } from '@/components/reports/attendance-table';
import { useCollection, useUser } from '@/firebase';
import type { AttendanceRecord } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useMemo } from 'react';
import { query, where, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ArchivePage() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();

  const isAdmin = useMemo(() => !isLoadingUser && currentUser?.role === 'Admin', [currentUser, isLoadingUser]);

  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection(
    !isAdmin && currentUser ? 'subjects' : null,
    { buildQuery: (ref: any) => query(ref, where('teacherId', '==', currentUser?.uid)) }
  );

  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const attendanceQuery = useCallback((ref: any) => {
    let q = query(ref, orderBy('archivedAt', 'desc'));
    if (isAdmin) return q;
    if (teacherSubjectIds.length > 0) {
      return query(q, where('subjectId', 'in', teacherSubjectIds));
    }
    return query(q, where('subjectId', '==', '')); // Query that finds nothing
  }, [isAdmin, teacherSubjectIds]);


  const { data: archivedAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>(
    currentUser ? 'attendance_archive' : null,
    { buildQuery: attendanceQuery }
  );

  const isLoading = isLoadingUser || isLoadingRecords || (!isAdmin && isLoadingSubjects);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Archived Reports
          </h1>
          <p className="text-muted-foreground">
            A read-only log of all previously cleared attendance records.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Live Reports
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived Attendance Log</CardTitle>
          <CardDescription>
            This data is preserved for historical reference and cannot be modified.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <AttendanceTable attendanceRecords={archivedAttendance || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
