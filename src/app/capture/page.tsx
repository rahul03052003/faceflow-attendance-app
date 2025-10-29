'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Frown, Loader2, Meh, ScanFace, Smile, Sparkles } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { USERS } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const emotions = ['Happy', 'Sad', 'Neutral'];

type ScanResult = {
  user: (typeof USERS)[0];
  emotion: string;
};

export default function CapturePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const faceScanImage = PlaceHolderImages.find((img) => img.id === 'face-scan');

  const handleScan = () => {
    setIsScanning(true);
    setResult(null);
    setTimeout(() => {
      const randomUser = USERS[Math.floor(Math.random() * USERS.length)];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      setResult({ user: randomUser, emotion: randomEmotion });
      setIsScanning(false);
    }, 2000);
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

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Capture Attendance</CardTitle>
          <CardDescription>
            Click the button to scan for facial recognition and emotion detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-6 p-10">
          {isScanning && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">Scanning and analyzing...</p>
            </div>
          )}

          {!isScanning && result && faceScanImage && (
            <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95">
              <Image
                src={faceScanImage.imageUrl}
                alt={faceScanImage.description}
                data-ai-hint={faceScanImage.imageHint}
                width={200}
                height={200}
                className="rounded-full border-4 border-primary shadow-lg"
              />
              <div className="flex items-center gap-2">
                 <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${result.user.email}`} alt={result.user.name} />
                    <AvatarFallback>{result.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">{result.user.name}</h3>
              </div>
              <Badge variant="secondary">Status: Present</Badge>
              <div className="flex items-center gap-2">
                <p className="font-medium">Emotion:</p>
                {getEmotionIcon(result.emotion)}
                <p>{result.emotion}</p>
              </div>
            </div>
          )}

          {!isScanning && !result && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-6 bg-primary/10 rounded-full">
                <ScanFace className="h-16 w-16 text-primary" />
              </div>
              <p className="text-muted-foreground">Ready to mark attendance.</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleScan}
            disabled={isScanning}
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
    </div>
  );
}
