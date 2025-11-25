
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
import type { User } from '@/lib/types';
import { useCollection } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { generateFacialFeatures } from '@/ai/flows/generate-facial-features';

export default function UsersPage() {
  const firestore = useFirestore();
  const {
    data: users,
    isLoading,
    error,
  } = useCollection<User>('users');
  const { toast } = useToast();

  const handleAddUser = async (
    newUser: Omit<User, 'id' | 'avatar' | 'role' | 'subjects' | 'facialFeatures'> & { photo?: File, photoPreview?: string }
  ) => {
    
    // Add user without facial features first
    const userToAdd = {
      name: newUser.name,
      email: newUser.email,
      registerNo: newUser.registerNo,
      avatar: newUser.photoPreview || `https://i.pravatar.cc/150?u=${newUser.email}`,
      role: 'Student' as const, // Default role
      facialFeatures: null,
    };

    const collectionRef = collection(firestore, 'users');
    
    try {
        const docRef = await addDoc(collectionRef, userToAdd);

        // Now, if there is a photo, generate features and update the document
        if (newUser.photoPreview) {
            try {
                const result = await generateFacialFeatures({ photoDataUri: newUser.photoPreview });
                if (!result || !result.features) {
                    throw new Error("Facial feature generation returned an invalid result.");
                }
                await updateDoc(docRef, { facialFeatures: result.features });
            } catch (e) {
                console.error("Failed to generate facial features:", e);
                toast({
                    variant: "destructive",
                    title: "AI Analysis Failed",
                    description: "Could not analyze the user's photo for facial recognition. The user has been added, but recognition may fail."
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
      return <p className="text-destructive">Error loading users: {error.message}</p>;
    }

    return <UsersTable users={users || []} onDeleteUser={handleDeleteUser} />;
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View, add, and manage user profiles from your Firestore database.
          </p>
        </div>
        <AddUserDialog onAddUser={handleAddUser} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            A list of all users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
