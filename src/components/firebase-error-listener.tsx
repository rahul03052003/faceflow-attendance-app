'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';

export function FirebaseErrorListener({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      console.error('Firestore Permission Error:', error);

      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // In development, we throw the error to let the Next.js overlay handle it.
        // This provides a rich debugging experience.
        throw error;
      } else {
        // In production, we show a user-friendly toast notification.
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description:
            'You do not have permission to perform this action. Please contact an administrator if you believe this is an error.',
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return <>{children}</>;
}
