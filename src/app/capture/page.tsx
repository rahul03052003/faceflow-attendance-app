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
  Frown,
  Loader2,
  Meh,
  ScanFace,
  Smile,
  Sparkles,
  VideoOff,
} from 'lucide-react';
import { USERS } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const emotions = ['Happy', 'Sad', 'Neutral'];

type ScanResult = {
  user: (typeof USERS)[0];
  emotion: string;
};

export default function CapturePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [toast]);

  const handleScan = async () => {
    setIsScanning(true);
    setResult(null);

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const randomUser = USERS[Math.floor(Math.random() * USERS.length)];
    const randomEmotion =
      emotions[Math.floor(Math.random() * emotions.length)];
    const newResult = { user: randomUser, emotion: randomEmotion };

    setResult(newResult);
    setIsScanning(false);

    try {
      const greeting = `Hello, ${newResult.user.name}. You have been marked present.`;
      const ttsResponse = await textToSpeech({ text: greeting });
      if (audioRef.current) {
        audioRef.current.src = ttsResponse.audio;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Failed to generate or play audio.', error);
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'Happy':
        return <Smile className="h-6 w-6 text-green-500" />;
      case 'Sad':
        return <Frown className="h-6 w-6 text-blue-500" />;
      case 'Neutral':
        return <Meh className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
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
              src={`https://i.pravatar.cc/150?u=${result.user.email}`}
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
                Please allow camera access in your browser to use this feature.
            </AlertDescription>
        </Alert>
      )
    }

    if (hasCameraPermission === null) {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Accessing camera...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-6 bg-primary/10 rounded-full">
            <ScanFace className="h-16 w-16 text-primary" />
            </div>
            <p className="text-muted-foreground">Ready to mark attendance.</p>
        </div>
    );
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
          <div className="w-full aspect-video rounded-md bg-muted overflow-hidden flex items-center justify-center">
            {hasCameraPermission ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            ) : (
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
            disabled={isScanning || !hasCameraPermission}
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
                <Sparkles className="mr-2 h-4 w-4" />
                Scan Another
              </>
            ) : (
              <>
                <ScanFace className="mr-2 h-4 w-4" />
                Start Scan
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
