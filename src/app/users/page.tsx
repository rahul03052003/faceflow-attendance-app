
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
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { DEMO_USERS } from '@/lib/types';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const firestore = useFirestore();
  const {
    data: usersData,
    isLoading,
    error,
  } = useCollection<User>('users');
  const { toast } = useToast();

  const useDemoData = (!usersData || usersData.length === 0) && !isLoading;
  const users = useDemoData ? DEMO_USERS : usersData;


  const handleAddUser = async (
    newUser: Omit<User, 'id' | 'avatar' | 'role' | 'subjects' | 'facialFeatures'> & { photo?: File, photoPreview?: string }
  ) => {
    if (useDemoData) {
      alert("Cannot add users when in demo mode. Please connect to Firebase to add real data.");
      return;
    }
    
    let facialFeatures: any = null;
    if (newUser.photoPreview) {
        try {
            const result = await ai.generate({
                model: 'googleai/gemini-pro-vision',
                prompt: `Describe the facial features of the person in this photo in a detailed JSON format. Include descriptions of eyes, nose, mouth, face shape, and any distinguishing marks.
                
                Photo: {{media url=photoDataUri}}`,
                output: {
                  schema: z.object({
                    features: z.object({
                      eyes: z.string(),
                      nose: z.string(),
                      mouth: z.string(),
                      faceShape: z.string(),
                    }),
                  }),
                },
                input: { photoDataUri: newUser.photoPreview },
            });
            facialFeatures = result.output?.features;
        } catch (e) {
            console.error("Failed to generate facial features:", e);
            toast({
                variant: "destructive",
                title: "AI Analysis Failed",
                description: "Could not analyze the user's photo for facial recognition. The user will be added without this data."
            })
        }
    }


    const userToAdd = {
      name: newUser.name,
      email: newUser.email,
      registerNo: newUser.registerNo,
      avatar: newUser.photoPreview || `https://i.pravatar.cc/150?u=${newUser.email}`,
      role: 'Student' as const, // Default role
      facialFeatures: facialFeatures,
    };

    const collectionRef = collection(firestore, 'users');
    addDoc(collectionRef, userToAdd).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: userToAdd,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (useDemoData) {
      alert("Cannot delete users when in demo mode. Please connect to Firebase to add real data.");
      return;
    }
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
    if (isLoading && !useDemoData) {
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

    return <UsersTable users={users || []} onDeleteUser={handleDeleteUser} isDemo={useDemoData} />;
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
            {useDemoData && <span className="text-yellow-600 dark:text-yellow-400 font-semibold"> (Demo Data)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
