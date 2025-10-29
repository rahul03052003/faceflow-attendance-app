'use client';
import { useState } from 'react';
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
import { Bot, Loader2, Send } from 'lucide-react';
import { processVoiceCommand } from '@/ai/flows/process-voice-commands';
import { useToast } from '@/hooks/use-toast';

type VoiceCommandDialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VoiceCommandDialog({ children, open, onOpenChange }: VoiceCommandDialogProps) {
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCommand = async () => {
    if (!command) return;
    setIsLoading(true);
    try {
      const result = await processVoiceCommand({ command });
      toast({
        title: 'Voice Command Processed',
        description: `Action: ${result.action}, Parameters: ${JSON.stringify(
          result.parameters
        )}`,
      });
      onOpenChange(false);
      setCommand('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not process voice command.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="text-primary" />
            Voice Command Interface
          </DialogTitle>
          <DialogDescription>
            Type a command to interact with the system. For example: &quot;Mark
            John as present&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            id="command"
            placeholder="Type your command..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
            disabled={isLoading}
          />
          <Button onClick={handleCommand} disabled={isLoading || !command} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send Command</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
