
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
import type { AttendanceRecord, Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useMemo } from 'react';
import { query, where, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ArchivePage() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();

  const isAdmin = useMemo(() => !isLoadingUser && currentUser?.role === 'Admin', [currentUser, isLoadingUser]);

  const subjectsQuery = useCallback((ref: any) => {
    if (!currentUser?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', currentUser.uid));
  }, [currentUser?.uid]);

  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    !isAdmin && currentUser ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );

  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const attendanceQuery = useCallback((ref: any) => {
    if (isAdmin) {
      // For Admin, order all records by archive date.
      return query(ref, orderBy('archivedAt', 'desc'));
    }
    
    // This should now correctly use the teacherSubjectIds when they are ready.
    if (teacherSubjectIds.length > 0) {
      return query(
        ref, 
        where('subjectId', 'in', teacherSubjectIds),
        orderBy('archivedAt', 'desc')
      );
    }

    // For a teacher with no subjects, return a query that finds nothing.
    return query(ref, where('subjectId', '==', '__NEVER_MATCH__'));
  }, [isAdmin, teacherSubjectIds]);


  // This flag determines if we should even attempt to fetch from the archive.
  // For a teacher, it waits until the subjects are loaded.
  const shouldFetchArchive = useMemo(() => {
    if (!currentUser) return false; // Don't fetch if no user
    if (isAdmin) return true; // Admin can always fetch
    if (isLoadingSubjects) return false; // Don't fetch if subjects are still loading for a teacher
    return true; // Teacher can fetch now (even if they have no subjects, the query will handle it)
  }, [currentUser, isAdmin, isLoadingSubjects]);
  

  const { data: archivedAttendance, isLoading: isLoadingRecords } = useCollection<AttendanceRecord>(
    shouldFetchArchive ? 'attendance_archive' : null,
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

