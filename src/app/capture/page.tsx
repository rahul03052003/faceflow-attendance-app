
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Camera,
  CameraOff,
  Frown,
  Loader2,
  Meh,
  ScanFace,
  Smile,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User } from '@/lib/types';
import { recognizeFace } from '@/ai/flows/recognize-face';
import { generateGreetingAudio } from '@/ai/flows/generate-greeting-audio';
import { useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Define a new type for the attendance record to be created
type NewAttendanceRecord = {
    userId: string;
    userName: string;
    userAvatar: string;
    date: string;
    status: 'Present';
    emotion: string;
    timestamp: any; // serverTimestamp
};

type ScanResult = {
  user: User;
  emotion: string;
};

export default function CapturePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // Fetch users on the client-side
  const { data: users, isLoading: isLoadingUsers } = useCollection<User>('users');


  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasCameraPermission(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;

    setHasCameraPermission(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Camera API not supported.');
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: 'Your browser does not support camera access.',
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this app.',
      });
    }
  }, [toast]);
  
  // Effect to request camera permission on component mount
  useEffect(() => {
    startCamera();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);
  
  const handleScanClick = () => {
      if (!hasCameraPermission) {
          startCamera();
          return;
      }
      if (result) {
        setResult(null);
      }
      scan();
  }

  const scan = async () => {
    if (!videoRef.current?.srcObject || !firestore || !users || users.length === 0) {
       toast({
          variant: "destructive",
          title: "System Not Ready",
          description: "Camera, database, or user data is not yet available. Please try again.",
       });
       return;
    }
    
    setIsScanning(true);
    setResult(null);

    const canvas = document.createElement('canvas');
    if (!videoRef.current) {
        setIsScanning(false);
        return;
    }
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setIsScanning(false);
      return;
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const { user: matchedUser, emotion } = await recognizeFace({ photoDataUri, users });
      
      if (!matchedUser) {
        toast({
          variant: "destructive",
          title: "Recognition Failed",
          description: "Could not identify a registered user in the photo. Please try again.",
        });
        setIsScanning(false);
        return;
      }

      // Set result immediately for a faster UI response
      const newResult = { user: matchedUser, emotion };
      setResult(newResult);
      
      // In parallel, create attendance record
      const attendanceRecord: NewAttendanceRecord = {
        userId: matchedUser.id,
        userName: matchedUser.name,
        userAvatar: matchedUser.avatar,
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        emotion: emotion,
        timestamp: serverTimestamp(),
      };
      const collectionRef = collection(firestore, 'attendance');
      addDoc(collectionRef, attendanceRecord).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: attendanceRecord,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
      
      // And generate/play audio in the background
      generateGreetingAudio({ name: matchedUser.name })
        .then(({ audio }) => {
          if (audio && audioRef.current) {
            audioRef.current.src = audio;
            audioRef.current.play().catch(e => console.error("Audio playback failed", e));
          } else {
             console.log("No audio returned from flow, likely due to a rate limit or other issue.");
          }
        })
        .catch(e => console.error("Audio generation failed:", e));


    } catch (error: any) {
      console.error('Face recognition flow failed.', error);
      toast({
        variant: "destructive",
        title: "AI Scan Failed",
        description: error.message || "The AI could not process the image. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  const getEmotionIcon = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happy':
        return <Smile className="h-6 w-6 text-green-500" />;
      case 'sad':
        return <Frown className="h-6 w-6 text-blue-500" />;
      case 'neutral':
        return <Meh className="h-6 w-6 text-yellow-500" />;
      case 'surprised':
        return <Sparkles className="h-6 w-6 text-purple-500" />;
      default:
        return <Meh className="h-6 w-6 text-gray-500" />;
    }
  };

  const renderVideoContent = () => {
      if (hasCameraPermission === false) {
           return (
            <Alert variant="destructive" className="m-4">
              <CameraOff className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to use this feature.
              </AlertDescription>
            </Alert>
          );
      }
      if (hasCameraPermission === null) {
          return (
             <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Starting camera...</p>
            </div>
          )
      }
      return null; // Video will be visible if hasCameraPermission is true
  }

  const renderMainContent = () => {
    if (isLoadingUsers && !users) {
       return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      );
    }
    if (isScanning) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Scanning for a registered user...</p>
          <p className="text-sm text-muted-foreground">(This may take a moment)</p>
        </div>
      );
    }
    if (result) {
      return (
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95">
          <Avatar className="h-40 w-40 border-4 border-primary shadow-lg">
            <AvatarImage
              src={result.user.avatar}
              alt={result.user.name}
            />
            <AvatarFallback>{result.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-green-600" />
            <h3 className="text-2xl font-semibold">{result.user.name}</h3>
          </div>
          <Badge variant="secondary">Status: Marked Present</Badge>
          <div className="flex items-center gap-2">
            <p className="font-medium">Emotion:</p>
            {getEmotionIcon(result.emotion)}
            <p>{result.emotion}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-6 bg-primary/10 rounded-full">
          <ScanFace className="h-16 w-16 text-primary" />
        </div>
        <p className="text-muted-foreground">
          {hasCameraPermission ? "Ready to mark attendance." : "Enable your camera to begin."}
        </p>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Capture Attendance</CardTitle>
          <CardDescription>
            The system will capture your photo and recognize you automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 p-6 min-h-[400px]">
          <div className="w-full aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center relative">
            {hasCameraPermission && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
                onClick={stopCamera}
              >
                <CameraOff className="h-4 w-4" />
                <span className="sr-only">Close Camera</span>
              </Button>
            )}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!hasCameraPermission ? 'hidden' : ''}`}
              autoPlay
              muted
              playsInline
            />
            {!hasCameraPermission && renderVideoContent()}
          </div>
          
          <div className="w-full">
            {renderMainContent()}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleScanClick}
            disabled={isScanning || hasCameraPermission === null || isLoadingUsers}
            className="w-full"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : result ? (
              <>
                <ScanFace className="mr-2 h-4 w-4" />
                Scan Another
              </>
            ) : hasCameraPermission ? (
              <>
                <ScanFace className="mr-2 h-4 w-4" />
                Start Scan
              </>
            ) : (
               <>
                <Camera className="mr-2 h-4 w-4" />
                Enable Camera
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

    