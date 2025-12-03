
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  CameraOff,
  Frown,
  Loader2,
  Meh,
  PlayCircle,
  ScanFace,
  Smile,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User, AttendanceRecord, Subject } from '@/lib/types';
import { recognizeFace } from '@/ai/flows/recognize-face';
import { generateGreetingAudio } from '@/ai/flows/generate-greeting-audio';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

type NewAttendanceRecord = Omit<AttendanceRecord, 'id' | 'timestamp'> & {
  timestamp: any;
};

type ScanResult = {
  user: User;
  emotion: string;
  greetingAudio: string | null;
};

export default function CapturePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: teacher } = useUser();
  
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<User>('users');

  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    teacher?.uid ? 'subjects' : null,
    {
      buildQuery: (ref) => query(ref, where('teacherId', '==', teacher?.uid))
    }
  );

  const teacherSubjects = useMemo(() => {
    if (!subjects) return [];
    return subjects;
  }, [subjects]);
  
  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(
    teacher?.uid && teacherSubjectIds.length > 0 ? 'attendance' : null,
    {
      buildQuery: (ref) => query(ref, where('subjectId', 'in', teacherSubjectIds))
    }
  );

  const studentsInSelectedSubject = useMemo(() => {
    if (!selectedSubjectId || !allUsers) return [];
    return allUsers.filter(u => u.subjects?.includes(selectedSubjectId));
  }, [selectedSubjectId, allUsers]);

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
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
  
  useEffect(() => {
    startCamera();
    return () => stopCamera();
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
  
  const playGreeting = useCallback(() => {
      if (result?.greetingAudio && audioRef.current) {
        audioRef.current.src = result.greetingAudio;
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed", e);
            toast({
                variant: 'destructive',
                title: 'Audio Playback Error',
                description: 'Could not play audio. Please check your browser permissions.'
            })
        });
      }
  }, [result, toast]);

  const scan = async () => {
    if (!videoRef.current?.srcObject || !firestore || studentsInSelectedSubject.length === 0) {
       toast({
          variant: "destructive",
          title: "System Not Ready",
          description: "Camera is not ready or no students are enrolled in the selected subject.",
       });
       return;
    }
    
    setIsScanning(true);
    setResult(null);

    const canvas = document.createElement('canvas');
    if (!videoRef.current) { setIsScanning(false); return; }
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) { setIsScanning(false); return; }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUri = canvas.toDataURL('image/jpeg');

    try {
      const { user: matchedUser, emotion } = await recognizeFace({ photoDataUri, users: studentsInSelectedSubject });
      
      setIsScanning(false);

      if (!matchedUser) {
        toast({
          variant: "destructive",
          title: "Recognition Failed",
          description: "Could not identify a student from this subject in the photo. Please try again.",
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const selectedSubject = teacherSubjects.find(s => s.id === selectedSubjectId);
      const isAlreadyPresent = attendanceRecords?.some(
        record => record.userId === matchedUser.id && record.date === today && record.subjectId === selectedSubjectId
      );
      
      const newResult: ScanResult = { user: matchedUser, emotion, greetingAudio: null };

      if (isAlreadyPresent) {
        toast({
          title: "Already Marked Present",
          description: `${matchedUser.name}, you are already marked as present for this subject today.`,
        });
        setResult(newResult); // Set result without audio
        return;
      }
      
      // Mark present and generate audio
      setResult(newResult);

      const attendanceRecord: NewAttendanceRecord = {
        userId: matchedUser.id,
        userName: matchedUser.name,
        userAvatar: matchedUser.avatar,
        subjectId: selectedSubjectId!,
        subjectName: selectedSubject?.title || 'Unknown Subject',
        date: today,
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

      // Generate and play audio
      try {
        const { audio } = await generateGreetingAudio({ name: matchedUser.name });
        if (audio) {
          setResult(prev => prev ? { ...prev, greetingAudio: audio } : null);
          if (audioRef.current) {
            audioRef.current.src = audio;
            // Use a slight delay to ensure state is set before playing
            setTimeout(() => {
                audioRef.current?.play().catch(e => console.warn("Auto-play failed, user may need to interact.", e));
            }, 100);
          }
        }
      } catch (e) {
        console.error("Audio generation failed:", e);
      }

    } catch (error: any) {
      console.error('Face recognition flow failed.', error);
      setIsScanning(false);
      toast({
        variant: "destructive",
        title: "AI Scan Failed",
        description: error.message || "The AI could not process the image. Please try again.",
      });
    }
  };
  
  const getEmotionIcon = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happy': return <Smile className="h-6 w-6 text-green-500" />;
      case 'sad': return <Frown className="h-6 w-6 text-blue-500" />;
      case 'neutral': return <Meh className="h-6 w-6 text-yellow-500" />;
      case 'surprised': return <Sparkles className="h-6 w-6 text-purple-500" />;
      default: return <Meh className="h-6 w-6 text-gray-500" />;
    }
  };

  const renderVideoContent = () => {
      if (hasCameraPermission === false) {
           return (
            <Alert variant="destructive" className="m-4">
              <CameraOff className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>Allow camera access to use this feature.</AlertDescription>
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
      return null;
  }

  const renderMainContent = () => {
    if (isLoadingUsers && !allUsers) {
       return <Skeleton className="h-24 w-full" />;
    }
    if (isScanning) {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Scanning for a registered student...</p>
        </div>
      );
    }
    if (result) {
      return (
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95">
          <Avatar className="h-40 w-40 border-4 border-primary shadow-lg">
            <AvatarImage src={result.user.avatar} alt={result.user.name} />
            <AvatarFallback>{result.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-green-600" />
            <h3 className="text-2xl font-semibold">{result.user.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Status: Marked Present</Badge>
            {result.greetingAudio && (
                <Button variant="ghost" size="icon" onClick={playGreeting} className="h-7 w-7">
                    <PlayCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </Button>
            )}
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
            Select a subject and the system will capture and recognize students.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 p-6 min-h-[400px]">
          <div className="w-full aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center relative">
            {hasCameraPermission && (
              <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10" onClick={stopCamera}>
                <CameraOff className="h-4 w-4" />
              </Button>
            )}
            <video ref={videoRef} className={`w-full h-full object-cover ${!hasCameraPermission ? 'hidden' : ''}`} autoPlay muted playsInline />
            {!hasCameraPermission && renderVideoContent()}
          </div>

          {isLoadingSubjects ? <Skeleton className="h-10 w-full" /> : (
            <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId || ''}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject to begin..." />
              </SelectTrigger>
              <SelectContent>
                {teacherSubjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>{subject.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="w-full">
            {renderMainContent()}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleScanClick}
            disabled={isScanning || hasCameraPermission === null || isLoadingUsers || !selectedSubjectId}
            className="w-full"
            size="lg"
          >
            {isScanning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scanning...</>
             : result ? <><ScanFace className="mr-2 h-4 w-4" />Scan Another</>
             : hasCameraPermission ? <><ScanFace className="mr-2 h-4 w-4" />Start Scan</>
             : <><Camera className="mr-2 h-4 w-4" />Enable Camera</>}
          </Button>
        </CardFooter>
      </Card>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
