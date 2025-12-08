
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
import type { ArchivedAttendanceRecord, Subject } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useMemo } from 'react';
import { query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Inbox } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format } from 'date-fns';

type GroupedArchives = {
  [key: string]: ArchivedAttendanceRecord[];
};

export default function ArchivePage() {
  const { user: currentUser, isLoading: isLoadingUser } = useUser();

  const isAdmin = useMemo(() => !isLoadingUser && currentUser?.role === 'Admin', [currentUser, isLoadingUser]);

  const subjectsQuery = useCallback((ref: any) => {
    if (isAdmin || !currentUser?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', currentUser.uid));
  }, [currentUser?.uid, isAdmin]);

  const { data: teacherSubjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    !isAdmin && currentUser ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );

  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const shouldFetchArchive = useMemo(() => {
    if (!currentUser) return false; // Don't fetch if no user
    if (isAdmin) return true; // Admin can always fetch
    if (isLoadingSubjects) return false; // Don't fetch if subjects are loading for teacher
    return teacherSubjectIds.length > 0; // Fetch only if teacher has subjects
  }, [currentUser, isAdmin, isLoadingSubjects, teacherSubjectIds]);


  const attendanceQuery = useCallback((ref: any) => {
    let q = query(ref, orderBy('archivedAt', 'desc'));
    // IMPORTANT: This condition is now aligned with `shouldFetchArchive`.
    // It ensures that `teacherSubjectIds` has at least one item before adding the 'in' clause.
    if (!isAdmin && teacherSubjectIds.length > 0) {
      q = query(q, where('subjectId', 'in', teacherSubjectIds));
    }
    return q;
  }, [isAdmin, teacherSubjectIds]);


  const { data: archivedAttendance, isLoading: isLoadingRecords } = useCollection<ArchivedAttendanceRecord>(
    shouldFetchArchive ? 'attendance_archive' : null, // The key to fixing the race condition
    { buildQuery: attendanceQuery }
  );
  
  const groupedArchives = useMemo(() => {
    if (!archivedAttendance) return {};
    
    return archivedAttendance.reduce((acc, record) => {
      const sessionId = record.sessionId;
      if (!sessionId) return acc;

      if (!acc[sessionId]) {
        acc[sessionId] = [];
      }
      acc[sessionId].push(record);
      return acc;
    }, {} as GroupedArchives);
  }, [archivedAttendance]);

  const sortedGroupKeys = useMemo(() => {
    // Sort groups by the sessionId (which is a timestamp) in descending order
    return Object.keys(groupedArchives).sort((a, b) => {
        const timeA = groupedArchives[a]?.[0]?.archivedAt instanceof Timestamp ? groupedArchives[a][0].archivedAt.toMillis() : Number(a);
        const timeB = groupedArchives[b]?.[0]?.archivedAt instanceof Timestamp ? groupedArchives[b][0].archivedAt.toMillis() : Number(b);
        return timeB - timeA;
    });
  }, [groupedArchives]);


  const isLoading = isLoadingUser || isLoadingRecords || (!isAdmin && isLoadingSubjects);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (sortedGroupKeys.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center text-muted-foreground p-8">
          <Inbox className="h-16 w-16" />
          <h3 className="text-xl font-semibold">No Archived Records</h3>
          <p>When you clear the live attendance log, the records will be moved here for historical reference.</p>
        </div>
      );
    }
    
    return (
      <Accordion type="single" collapsible className="w-full">
        {sortedGroupKeys.map((key) => {
          const records = groupedArchives[key];
          // Use the actual timestamp from the first record in the group for more accurate display
          const archiveDate = records[0]?.archivedAt instanceof Timestamp ? records[0].archivedAt.toDate() : new Date(Number(key));
          
          return (
            <AccordionItem value={key} key={key}>
              <AccordionTrigger>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-left">
                   <h3 className="font-semibold text-base">
                      Session Archived on: {format(archiveDate, 'PPP p')}
                   </h3>
                   <span className="text-sm text-muted-foreground">
                      ({records.length} records)
                   </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <AttendanceTable attendanceRecords={records} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Archived Reports
          </h1>
          <p className="text-muted-foreground">
            A read-only log of all previously cleared attendance sessions.
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
          <CardTitle>Archived Sessions</CardTitle>
          <CardDescription>
            Each item below represents a session that was cleared from the live reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

