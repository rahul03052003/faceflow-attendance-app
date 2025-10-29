'use client';

import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { VoiceCommandDialog } from './voice-command-dialog';
import { useState } from 'react';

export function VoiceCommandButton() {
  const [open, setOpen] = useState(false);

  return (
    <VoiceCommandDialog open={open} onOpenChange={setOpen}>
        <Button variant="ghost" size="icon">
          <Mic className="h-5 w-5" />
          <span className="sr-only">Use Voice Command</span>
        </Button>
    </VoiceCommandDialog>
  );
}
