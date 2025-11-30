
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UsersTable } from '@/components/users/users-table';
import { AddUserDialog } from '@/components/users/add-user-dialog';
import type { User, Subject } from '@/lib/types';
import { useCollection, useUser } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { generateFacialFeatures } from '@/ai/flows/generate-facial-features';
import { useMemo } from 'react';

export default function UsersPage() {
  const firestore = useFirestore();
  const { user: teacher } = useUser();
  const {
    data: allUsers,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useCollection<User>('users');
  const { 
    data: subjects, 
    isLoading: isLoadingSubjects 
  } = useCollection<Subject>('subjects');
  const { toast } = useToast();

  const teacherSubjects = useMemo(() => {
    if (!subjects || !teacher) return [];
    return subjects.filter(s => s.teacherId === teacher.uid);
  }, [subjects, teacher]);

  const teacherSubjectIds = useMemo(() => teacherSubjects.map(s => s.id), [teacherSubjects]);

  const filteredUsers = useMemo(() => {
    if (!allUsers || !teacher) return [];
    // Admins see all users. Teachers see students in their subjects.
    const teacherUser = allUsers.find(u => u.id === teacher.uid);
    if (teacherUser?.role === 'Admin') {
      return allUsers.filter(u => u.role !== 'Admin' && u.role !== 'Teacher');
    }
    
    return allUsers.filter(u => 
      u.role === 'Student' &&
      u.subjects?.some(subId => teacherSubjectIds.includes(subId))
    );
  }, [allUsers, teacher, teacherSubjectIds]);


  const handleAddUser = async (
    newUser: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures'> & { photo?: File, photoPreview?: string, subjects?: string[] }
  ) => {
    
    const userToAdd = {
      name: newUser.name,
      email: newUser.email,
      registerNo: newUser.registerNo,
      avatar: newUser.photoPreview || `https://i.pravatar.cc/150?u=${newUser.email}`,
      role: 'Student' as const,
      subjects: newUser.subjects || [],
      facialFeatures: null,
    };

    const collectionRef = collection(firestore, 'users');
    
    try {
        const docRef = await addDoc(collectionRef, userToAdd);

        if (newUser.photoPreview) {
            try {
                const { vector } = await generateFacialFeatures({ photoDataUri: newUser.photoPreview });
                if (!vector) {
                    throw new Error("Facial feature generation returned an invalid result.");
                }
                await updateDoc(docRef, { facialFeatures: vector });
            } catch (e) {
                console.error("Failed to generate facial features:", e);
                toast({
                    variant: "destructive",
                    title: "AI Analysis Failed",
                    description: "Could not analyze the user's photo. The user has been added, but recognition may fail."
                })
            }
        }
    } catch (serverError) {
         const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: userToAdd,
          });
         errorEmitter.emit('permission-error', permissionError);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const docRef = doc(firestore, 'users', userId);
    deleteDoc(docRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const renderContent = () => {
    if (isLoadingUsers || isLoadingSubjects) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (usersError) {
      return <p className="text-destructive">Error loading users: {usersError.message}</p>;
    }

    return <UsersTable users={filteredUsers} onDeleteUser={handleDeleteUser} />;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage students assigned to your subjects.
          </p>
        </div>
        <AddUserDialog onAddUser={handleAddUser} subjects={teacherSubjects} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            A list of all students assigned to your subjects.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
