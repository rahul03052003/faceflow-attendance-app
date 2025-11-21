'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, Mic, MicOff, Send } from 'lucide-react';
import { processVoiceCommand } from '@/ai/flows/process-voice-commands';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Extend window to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type VoiceCommandDialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VoiceCommandDialog({ children, open, onOpenChange }: VoiceCommandDialogProps) {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: 'Voice commands are not supported in this browser.',
      });
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCommand(transcript);
      handleCommand(transcript); // Automatically process after speech is recognized
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      toast({
        variant: 'destructive',
        title: 'Recognition Error',
        description: `Could not process audio. ${event.error}`,
      });
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [toast]);

  const handleAction = (action: string, params: Record<string, any>) => {
    switch (action) {
      case 'navigate':
        if (params.page) {
          router.push(params.page);
        }
        break;
      case 'addUser':
        const userToAdd = {
          name: params.name || 'Unknown',
          email: params.email || `user_${Date.now()}@example.com`,
          avatar: `https://i.pravatar.cc/150?u=${params.email || params.name}`,
          role: 'User',
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
        toast({
          title: 'User Added',
          description: `User ${userToAdd.name} has been added.`,
        });
        break;
       case 'markPresent':
         // This is a more complex action that requires finding a user first.
         // For a demo, we can just show a toast.
         toast({
           title: 'Action Received',
           description: `Attempting to mark ${params.name} as present.`
         });
         break;
       case 'showReport':
         router.push('/reports');
         break;
      default:
        toast({
          variant: 'destructive',
          title: 'Unknown Action',
          description: `The command "${action}" is not recognized.`,
        });
    }
  };

  const handleCommand = async (text: string) => {
    if (!text) return;
    setIsLoading(true);
    try {
      const result = await processVoiceCommand({ command: text });
      handleAction(result.action, result.parameters);
      onOpenChange(false);
      setCommand('');
    } catch (error) {
      console.error('Error processing command:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process the command.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
    setIsListening(!isListening);
  };
  
  const handleDialogChange = (isOpen: boolean) => {
     if (!isOpen && isListening) {
        recognition?.stop();
        setIsListening(false);
     }
     onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-primary" />
            Voice Command Interface
          </DialogTitle>
          <DialogDescription>
             Click the microphone to speak, or type a command. E.g., "Go to reports" or "Add user John Doe with email john@test.com".
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            id="command"
            placeholder={isListening ? 'Listening...' : 'Type or speak your command...'}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand(command)}
            disabled={isLoading || isListening}
          />
          <Button onClick={() => handleCommand(command)} disabled={isLoading || !command || isListening} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send Command</span>
          </Button>
          {recognition && (
             <Button onClick={toggleListening} disabled={isLoading} size="icon" variant={isListening ? 'destructive' : 'outline'}>
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="sr-only">{isListening ? 'Stop Listening' : 'Start Listening'}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
