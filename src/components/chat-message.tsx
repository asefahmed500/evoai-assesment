'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-xs`}>
        <Avatar className="h-8 w-8">
          <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
            {isUser ? 'U' : 'A'}
          </AvatarFallback>
        </Avatar>
        
        <Card className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          <CardContent className="p-3">
            <p className="text-sm">{message.content}</p>
            <p className={`text-xs mt-1 ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}