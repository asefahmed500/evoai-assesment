'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TraceViewer } from '../trace-viewer';
import { ChatMessage } from '../chat-message';


interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Trace {
  intent: string;
  tools_called: string[];
  evidence: unknown[];
  policy_decision: {
    cancel_allowed: boolean;
    reason?: string;
  } | null;
  final_message: string;
}

export function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trace, setTrace] = useState<Trace | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Send to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setTrace(data.trace);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>EvoAI Shopping Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col h-96 overflow-y-auto mb-4 p-2 border rounded">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center justify-start my-2">
                <div className="animate-pulse rounded-full bg-primary/10 p-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
                <span className="ml-2 text-muted-foreground">Thinking...</span>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products or orders..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      {trace && <TraceViewer trace={trace} />}
    </div>
  );
}