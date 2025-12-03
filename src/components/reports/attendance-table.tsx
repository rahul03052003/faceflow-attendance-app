
'use client';
import type { AttendanceRecord } from '@/lib/types';
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
import { format } from 'date-fns';

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
        <TooltipTrigger>{iconMap[emotion] || iconMap['N/A']}</TooltipTrigger>
        <TooltipContent>
          <p>{emotion}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type AttendanceTableProps = {
  attendanceRecords: AttendanceRecord[];
};

export function AttendanceTable({ attendanceRecords }: AttendanceTableProps) {

  const sortedRecords = [...(attendanceRecords || [])].sort((a, b) => {
    const timeA = a.timestamp && a.timestamp.toMillis ? a.timestamp.toMillis() : 0;
    const timeB = b.timestamp && b.timestamp.toMillis ? b.timestamp.toMillis() : 0;
    return timeB - timeA;
  });
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Emotion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRecords.map((record) => (
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
            <TableCell>{record.subjectName}</TableCell>
            <TableCell>{record.date}</TableCell>
            <TableCell>
              {record.timestamp && typeof record.timestamp.toDate === 'function' 
                ? format(record.timestamp.toDate(), 'p') 
                : 'N/A'}
            </TableCell>
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
        {sortedRecords.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No attendance records found for your subjects.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
