
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
  RefreshCw,
  ScanFace,
  Smile,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { User, AttendanceRecord, Subject } from '@/lib/types';
import { recognizeFace } from '@/ai/flows/recognize-face';
import { generateGreetingAudio } from '@/ai/flows/generate-greeting-audio';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, where, writeBatch, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type NewAttendanceRecord = Omit<AttendanceRecord, 'id' | 'timestamp'> & {
  timestamp: any;
};

type ScanResult = {
  user: User;
  emotion: string;
  greetingAudio: string | null;
  status: 'Present' | 'Already Marked Present';
};

// Helper function to update and dispatch accuracy stats
const updateAccuracy = (isSuccess: boolean) => {
  if (typeof window === 'undefined') return;

  const stored = sessionStorage.getItem('scanAccuracy');
  let stats = { successful: 0, failed: 0 };
  if (stored) {
    try {
      stats = JSON.parse(stored);
    } catch (e) {
      console.error('Could not parse accuracy stats', e);
    }
  }

  if (isSuccess) {
    stats.successful += 1;
  } else {
    stats.failed += 1;
  }

  const total = stats.successful + stats.failed;
  const percentage = total > 0 ? ((stats.successful / total) * 100).toFixed(1) : '0.0';

  console.log('---------------------------------');
  console.log('Scan Accuracy Update:');
  console.log(`- Status: ${isSuccess ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`- Successful Scans: ${stats.successful}`);
  console.log(`- Failed Scans: ${stats.failed}`);
  console.log(`- Total Scans: ${total}`);
  console.log(`- Current Session Accuracy: ${percentage}%`);
  console.log('---------------------------------');

  sessionStorage.setItem('scanAccuracy', JSON.stringify(stats));
  // Dispatch a custom event to notify other components (like the dashboard) in the same tab
  window.dispatchEvent(new CustomEvent('accuracyUpdated'));
};


export default function CapturePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
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

  const subjectsQuery = useCallback((ref: any) => {
    if (!teacher?.uid) return query(ref, where('teacherId', '==', ''));
    return query(ref, where('teacherId', '==', teacher.uid));
  }, [teacher?.uid]);

  const { data: subjects, isLoading: isLoadingSubjects } = useCollection<Subject>(
    teacher?.uid ? 'subjects' : null,
    { buildQuery: subjectsQuery }
  );

  const teacherSubjects = useMemo(() => {
    if (!subjects) return [];
    return subjects;
  }, [subjects]);
  
  const teacherSubjectIds = useMemo(() => {
    if (!teacherSubjects) return [];
    return teacherSubjects.map(s => s.id);
  }, [teacherSubjects]);

  const attendanceQuery = useCallback((ref: any) => {
    if (!teacher?.uid || teacherSubjectIds.length === 0) return query(ref, where('subjectId', '==', ''));
    const today = new Date().toISOString().split('T')[0];
    return query(ref, where('subjectId', 'in', teacherSubjectIds), where('date', '==', today));
  }, [teacher?.uid, teacherSubjectIds]);


  const { data: todaysAttendance, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(
    teacher?.uid && teacherSubjectIds.length > 0 ? 'attendance' : null,
    { buildQuery: attendanceQuery }
  );

  const studentsInSelectedSubject = useMemo(() => {
    if (!selectedSubjectId || !allUsers) return [];
    return allUsers.filter(
      (u) =>
        u.role === 'Student' &&
        Array.isArray(u.subjects) &&
        u.subjects.includes(selectedSubjectId)
    );
  }, [allUsers, selectedSubjectId]);

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
  
  const scan = useCallback(async () => {
    if (!videoRef.current?.srcObject || !firestore || !allUsers) {
       toast({
          variant: "destructive",
          title: "System Not Ready",
          description: "Camera is not ready or users are not loaded.",
       });
       return;
    }

    const selectedSubject = teacherSubjects.find(s => s.id === selectedSubjectId);
    if (!selectedSubject) {
        toast({
            variant: "destructive",
            title: "No Subject Selected",
            description: "Please select a subject before scanning.",
        });
        return;
    }

    if (studentsInSelectedSubject.length === 0) {
      toast({
         variant: "destructive",
         title: "No Students",
         description: `There are no students enrolled in ${selectedSubject.title}.`,
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
      
      if (!matchedUser) {
        setIsScanning(false);
        updateAccuracy(false); // Update accuracy on failure
        toast({
          variant: "destructive",
          title: "Recognition Failed",
          description: "Could not identify a registered student in the photo. Please try again.",
        });
        return;
      }
      
      updateAccuracy(true);
      
      // Generate audio first, so it's ready for the result state.
      let greetingAudio: string | null = null;
      try {
        const { audio } = await generateGreetingAudio({ name: matchedUser.name });
        if (audio) {
          greetingAudio = audio;
        }
      } catch (e) {
        console.error("Audio generation failed:", e);
      }

      const today = new Date().toISOString().split('T')[0];
      const isAlreadyPresent = todaysAttendance?.some(
        record => record.userId === matchedUser.id && record.subjectId === selectedSubjectId
      );

      if (isAlreadyPresent) {
        setResult({ user: matchedUser, emotion, greetingAudio, status: 'Already Marked Present' });
        toast({
          title: "Already Marked Present",
          description: `${matchedUser.name}, you are already marked as present for this subject today.`,
        });
        setIsScanning(false);
        return;
      }

      // Set the final result state with the audio, triggering the useEffect for playback.
      setResult({ user: matchedUser, emotion, greetingAudio, status: 'Present' });
      
      const attendanceRecord: NewAttendanceRecord = {
        userId: matchedUser.id,
        userName: matchedUser.name,
        userAvatar: matchedUser.avatar,
        subjectId: selectedSubjectId!,
        subjectName: selectedSubject.title || 'Unknown Subject',
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

    } catch (error: any) {
      console.error('Face recognition flow failed.', error);
      updateAccuracy(false);
      toast({
        variant: "destructive",
        title: "AI Scan Failed",
        description: error.message || "The AI could not process the image. Please try again.",
      });
    } finally {
        setIsScanning(false);
    }
  }, [firestore, allUsers, teacherSubjects, selectedSubjectId, studentsInSelectedSubject, todaysAttendance, toast]);
  
  useEffect(() => {
    startCamera();

    const handleVoiceScan = () => {
      // Check if we are on the capture page and ready to scan
      if (document.visibilityState === 'visible') {
        handleScanClick();
      }
    };
    
    window.addEventListener('trigger-voice-scan', handleVoiceScan);
    
    return () => {
      stopCamera();
      window.removeEventListener('trigger-voice-scan', handleVoiceScan);
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
  
  const playGreeting = useCallback(() => {
      if (result?.greetingAudio && audioRef.current) {
        audioRef.current.src = result.greetingAudio;
        audioRef.current.play().catch(e => {
            console.error("Audio playback failed", e);
            // Don't show a toast for this, as it can be annoying if autoplay is blocked by browser
        });
      }
  }, [result]);

  // This useEffect hook is the key to reliable automatic playback.
  useEffect(() => {
    if (result && result.greetingAudio) {
      // A short delay can sometimes help with browser autoplay policies.
      const timer = setTimeout(() => {
        playGreeting();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result, playGreeting]);

  const handleEndSession = async () => {
    setIsAlertOpen(false);
    if (!selectedSubjectId || studentsInSelectedSubject.length === 0 || !todaysAttendance) {
        toast({
            variant: "destructive",
            title: "Cannot End Session",
            description: "Please select a subject with students first."
        });
        return;
    }

    setIsEndingSession(true);
    toast({
        title: "Ending Session...",
        description: "Marking remaining students as absent."
    });

    const today = new Date().toISOString().split('T')[0];
    const presentStudentIds = new Set(todaysAttendance
        .filter(r => r.subjectId === selectedSubjectId)
        .map(r => r.userId)
    );

    const absentStudents = studentsInSelectedSubject.filter(student => !presentStudentIds.has(student.id));
    
    if (absentStudents.length === 0) {
        toast({
            title: "Session Ended",
            description: "All students in the selected subject have been accounted for."
        });
        setIsEndingSession(false);
        return;
    }

    try {
        const batch = writeBatch(firestore);
        const selectedSubject = teacherSubjects.find(s => s.id === selectedSubjectId);

        absentStudents.forEach(student => {
            const attendanceRecord: NewAttendanceRecord = {
                userId: student.id,
                userName: student.name,
                userAvatar: student.avatar,
                subjectId: selectedSubjectId!,
                subjectName: selectedSubject?.title || 'Unknown Subject',
                date: today,
                status: 'Absent',
                emotion: 'N/A',
                timestamp: serverTimestamp(),
            };
            const attendanceRef = doc(collection(firestore, 'attendance'));
            batch.set(attendanceRef, attendanceRecord);
        });

        await batch.commit();

        toast({
            title: "Session Ended Successfully",
            description: `Marked ${absentStudents.length} student(s) as absent. You can now notify them from the reports page.`
        });
    } catch (e: any) {
        console.error("Failed to mark students as absent:", e);
        toast({
            variant: "destructive",
            title: "Failed to End Session",
            description: e.message || "An error occurred while updating attendance."
        });
    } finally {
        setIsEndingSession(false);
    }
  };
  
  const getEmotionIcon = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happy': return <Smile className="h-5 w-5 text-green-500" />;
      case 'sad': return <Frown className="h-5 w-5 text-blue-500" />;
      case 'neutral': return <Meh className="h-5 w-5 text-yellow-500" />;
      case 'surprised': return <Sparkles className="h-5 w-5 text-purple-500" />;
      default: return <Meh className="h-5 w-5 text-gray-500" />;
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
  
  const handleRefresh = () => {
    setResult(null);
    setSelectedSubjectId(null);
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('scanAccuracy');
        window.dispatchEvent(new CustomEvent('accuracyUpdated'));
    }
    toast({
      title: 'Session Refreshed',
      description: 'Accuracy tracking has been reset. You can start a new session.',
    });
  };


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
    if (result && result.user) {
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
            <Badge variant="secondary">Status: {result.status}</Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
                {getEmotionIcon(result.emotion)}
                Emotion: {result.emotion}
            </Badge>
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
    <>
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <CardTitle className="text-2xl">Capture Attendance</CardTitle>
          <CardDescription>
            Select a subject and the system will capture and recognize students.
          </CardDescription>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="absolute top-4 right-4"
          >
            <RefreshCw className="h-5 w-5" />
            <span className="sr-only">Start New Session</span>
          </Button>
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
          <p className="text-sm text-muted-foreground text-center -mt-4">
            Note: For best results, ensure the student's face is clearly visible before starting the scan.
          </p>

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
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleScanClick}
            disabled={isScanning || hasCameraPermission === null || isLoadingUsers || !selectedSubjectId || isEndingSession}
            className="w-full"
            size="lg"
          >
            {isScanning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scanning...</>
             : result ? <><ScanFace className="mr-2 h-4 w-4" />Scan Another</>
             : hasCameraPermission ? <><ScanFace className="mr-2 h-4 w-4" />Start Scan</>
             : <><Camera className="mr-2 h-4 w-4" />Enable Camera</>}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAlertOpen(true)}
            disabled={isEndingSession || !selectedSubjectId || isScanning}
            className="w-full sm:w-auto"
            size="lg"
            >
             {isEndingSession ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ending...</> : <><UserX className="mr-2 h-4 w-4" />End Session</>}
          </Button>
        </CardFooter>
      </Card>
      <audio ref={audioRef} className="hidden" />
    </div>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Attendance Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all students in the selected subject who have not been scanned as &quot;Absent&quot; for today. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession}>
              Yes, End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
    