
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
import { AddTeacherDialog } from '@/components/users/add-teacher-dialog';
import type { User, Subject } from '@/lib/types';
import { useCollection, useUser } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { generateFacialFeatures } from '@/ai/flows/generate-facial-features';
import { useMemo } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export default function UsersPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
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
  
  const isAdmin = currentUser?.role === 'Admin';

  const teacherSubjects = useMemo(() => {
    if (isAdmin || !subjects || !currentUser) return subjects || [];
    return subjects.filter(s => s.teacherId === currentUser.uid);
  }, [subjects, currentUser, isAdmin]);

  const teacherSubjectIds = useMemo(() => teacherSubjects.map(s => s.id), [teacherSubjects]);

  const filteredUsers = useMemo(() => {
    if (!allUsers || !currentUser) return [];
    
    if (isAdmin) {
      // Admins see all teachers and students
      return allUsers.filter(u => u.role === 'Teacher' || u.role === 'Student');
    }
    
    // Teachers see students in their subjects
    return allUsers.filter(u => 
      u.role === 'Student' &&
      u.subjects?.some(subId => teacherSubjectIds.includes(subId))
    );
  }, [allUsers, currentUser, teacherSubjectIds, isAdmin]);


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

  const handleAddTeacher = async (
    newTeacher: Omit<User, 'id' | 'avatar' | 'role' | 'facialFeatures' | 'registerNo'> & { email: string, name: string, subjects?: string[] }
  ) => {
    const auth = getAuth();
    try {
      // NOTE: This uses a hardcoded password. In a real app, this should be handled securely
      // (e.g., by sending a password reset email or a temporary password).
      const userCredential = await createUserWithEmailAndPassword(auth, newTeacher.email, 'teacher123');
      const teacherId = userCredential.user.uid;

      const teacherToAdd = {
        name: newTeacher.name,
        email: newTeacher.email,
        avatar: `https://i.pravatar.cc/150?u=${newTeacher.email}`,
        role: 'Teacher' as const,
        subjects: newTeacher.subjects || [],
        registerNo: '', // Not applicable to teachers
      };
      
      const userDocRef = doc(firestore, 'users', teacherId);
      await setDoc(userDocRef, teacherToAdd);

      toast({
        title: 'Teacher Added',
        description: `${newTeacher.name} has been created and assigned to subjects.`,
      });

    } catch (error: any) {
       console.error("Error creating teacher:", error);
       if (error.code === 'auth/email-already-in-use') {
         toast({
            variant: "destructive",
            title: "Failed to Add Teacher",
            description: "This email address is already in use by another account.",
          });
       } else if (error.name === 'FirestorePermissionError') {
          errorEmitter.emit('permission-error', error);
       } else {
          toast({
            variant: "destructive",
            title: "An Error Occurred",
            description: "Could not create the teacher account. See the console for details.",
          });
       }
    }
  };

  const handleDeleteUser = (userId: string) => {
    // Note: This only deletes the Firestore record, not the Auth user.
    // In a real app, you would need a Cloud Function to handle this.
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "View, add, and manage all teachers and students." : "View students assigned to your subjects."}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <AddTeacherDialog onAddTeacher={handleAddTeacher} subjects={subjects || []} />}
          <AddUserDialog onAddUser={handleAddUser} subjects={teacherSubjects} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "User List" : "Student List"}</CardTitle>
          <CardDescription>
            {isAdmin ? "A list of all teachers and students in the system." : "A list of all students assigned to your subjects."}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
