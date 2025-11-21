
'use client';

import { useState, useRef, useEffect } from 'react';
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
  VideoOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User, AttendanceRecord } from '@/lib/types';
import { recognizeFace } from '@/ai/flows/recognize-face';
import { useFirestore } from '@/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type ScanResult = {
  user: User;
  emotion: string;
};

export default function CapturePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const getCameraPermission = async () => {
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
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  
  useEffect(() => {
    getCameraPermission();
    return () => {
      stopCamera();
    };
  }, []);

  const handleScan = async () => {
    if (!videoRef.current || !hasCameraPermission) {
      await getCameraPermission();
      return;
    }
    
    // This check is now robust because useFirestore() won't return null
    // after the client provider fix.
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "System Not Ready",
            description: "The database connection is not yet available. Please wait a moment and try again.",
        });
        return;
    }

    setIsScanning(true);
    setResult(null);

    const canvas = document.createElement('canvas');
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
      const { user, emotion, audio } = await recognizeFace({ photoDataUri });
      
      const userDocRef = doc(firestore, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      
      let finalUser = user;
      if (userDocSnap.exists()) {
        const firestoreUser = { id: userDocSnap.id, ...userDocSnap.data() } as User;
        finalUser = firestoreUser;
      } else {
        console.warn(`User with ID ${user.id} not found in Firestore. Using simulated data.`);
      }

      const newResult = { user: finalUser, emotion };

      setResult(newResult);

      if (audio && audioRef.current) {
        audioRef.current.src = audio;
        audioRef.current.play();
      } else if (!audio) {
        console.log("No audio returned from flow, likely due to a rate limit.");
      }
      
      const attendanceRecord: Omit<AttendanceRecord, 'id'> = {
        userId: finalUser.id,
        userName: finalUser.name,
        userAvatar: finalUser.avatar,
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        emotion: emotion as any,
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


    } catch (error) {
      console.error('Face recognition failed.', error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Could not recognize a face. Please try again.",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCloseCamera = () => {
    stopCamera();
    setHasCameraPermission(false);
  };
  
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'Happy':
        return <Smile className="h-6 w-6 text-green-500" />;
      case 'Sad':
        return <Frown className="h-6 w-6 text-blue-500" />;
      case 'Neutral':
        return <Meh className="h-6 w-6 text-yellow-500" />;
      case 'Surprised':
        return <Sparkles className="h-6 w-6 text-purple-500" />;
      default:
        return <Meh className="h-6 w-6 text-gray-500" />;
    }
  };

  const renderContent = () => {
    if (isScanning) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Scanning and analyzing...</p>
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
            <h3 className="text-xl font-semibold">{result.user.name}</h3>
          </div>
          <Badge variant="secondary">Status: Present</Badge>
          <div className="flex items-center gap-2">
            <p className="font-medium">Emotion:</p>
            {getEmotionIcon(result.emotion)}
            <p>{result.emotion}</p>
          </div>
        </div>
      );
    }

    if (hasCameraPermission === false) {
      return (
        <Alert variant="destructive">
          <VideoOff className="h-4 w-4" />
          <AlertTitle>Camera Access Required</AlertTitle>

          <AlertDescription>
            Please allow camera access to use this feature, then click the button below.
          </AlertDescription>
        </Alert>
      );
    }

    // With the provider fix, we no longer need a complex loading state here for Firestore.
    // The camera permission check is sufficient.
    if (hasCameraPermission === null) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Waiting for camera...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-6 bg-primary/10 rounded-full">
          <ScanFace className="h-16 w-16 text-primary" />
        </div>
        <p className="text-muted-foreground">Ready to mark attendance.</p>
      </div>
    );
  };

  const renderCameraButton = () => {
    if (hasCameraPermission) {
      return (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
          onClick={handleCloseCamera}
        >
          <CameraOff className="h-4 w-4" />
          <span className="sr-only">Close Camera</span>
        </Button>
      );
    }
    return null;
  }

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Capture Attendance</CardTitle>
          <CardDescription>
            Position your face in the video feed and click the scan button.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 p-6">
          <div className="w-full aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center relative">
            {renderCameraButton()}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!hasCameraPermission ? 'hidden' : ''}`}
              autoPlay
              muted
              playsInline
            />
            {!hasCameraPermission && hasCameraPermission !== null && (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <VideoOff className="h-10 w-10" />
                <span>Camera is off</span>
              </div>
            )}
          </div>
          {renderContent()}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleScan}
            disabled={isScanning || !firestore || !hasCameraPermission}
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
