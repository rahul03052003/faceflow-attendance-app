'use client';
import { ATTENDANCE_RECORDS } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Frown, Meh, Smile, Sparkles, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

function EmotionIcon({ emotion }: { emotion: string }) {
  const iconMap: { [key: string]: React.ReactNode } = {
    Happy: <Smile className="h-5 w-5 text-green-500" />,
    Sad: <Frown className="h-5 w-5 text-blue-500" />,
    Neutral: <Meh className="h-5 w-5 text-yellow-500" />,
    Surprised: <Sparkles className="h-5 w-5 text-purple-500" />,
    'N/A': <AlertCircle className="h-5 w-5 text-gray-400" />,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>{iconMap[emotion]}</TooltipTrigger>
        <TooltipContent>
          <p>{emotion}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AttendanceTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Emotion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ATTENDANCE_RECORDS.map((record) => (
          <TableRow key={record.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={record.userAvatar} alt={record.userName} />
                  <AvatarFallback>{record.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{record.userName}</span>
              </div>
            </TableCell>
            <TableCell>{record.date}</TableCell>
            <TableCell>
              <Badge
                variant={record.status === 'Present' ? 'default' : 'destructive'}
                className={record.status === 'Present' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30'}
              >
                {record.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <EmotionIcon emotion={record.emotion} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
