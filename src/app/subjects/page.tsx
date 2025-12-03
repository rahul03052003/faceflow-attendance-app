
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubjectsTable } from '@/components/subjects/subjects-table';
import { AddSubjectDialog } from '@/components/subjects/add-subject-dialog';
import type { Subject } from '@/lib/types';
import { useCollection, useUser } from '@/firebase';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemo } from 'react';

export default function SubjectsPage() {
  const firestore = useFirestore();
  const { user: teacher, isLoading: isLoadingUser } = useUser();

  const {
    data: allSubjects,
    isLoading: isLoadingSubjects,
    error,
  } = useCollection<Subject>('subjects');

  const isLoading = isLoadingUser || isLoadingSubjects;

  const teacherSubjects = useMemo(() => {
    if (isLoading || !allSubjects || !teacher) return [];
    return allSubjects.filter(subject => subject.teacherId === teacher.uid);
  }, [allSubjects, teacher, isLoading]);


  const handleAddSubject = (
    newSubject: Omit<Subject, 'id' | 'teacherId'>
  ) => {
    if (!teacher) return;
    const subjectWithTeacher = { ...newSubject, teacherId: teacher.uid };
    const collectionRef = collection(firestore, 'subjects');
    addDoc(collectionRef, subjectWithTeacher).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: subjectWithTeacher,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    const docRef = doc(firestore, 'subjects', subjectId);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (error) {
      return <p className="text-destructive">Error loading subjects: {error.message}</p>;
    }

    return <SubjectsTable subjects={teacherSubjects} onDeleteSubject={handleDeleteSubject} />;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subject Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage subjects you teach.
          </p>
        </div>
        <AddSubjectDialog onAddSubject={handleAddSubject} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Subject List</CardTitle>
          <CardDescription>
            A list of all subjects you are assigned to.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
