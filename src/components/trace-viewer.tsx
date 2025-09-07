'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface TraceViewerProps {
  trace: Trace;
}

export function TraceViewer({ trace }: TraceViewerProps) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-sm">Internal Agent Trace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <strong>Intent:</strong> {trace.intent}
          </div>
          <div>
            <strong>Tools Called:</strong> {trace.tools_called.join(', ') || 'None'}
          </div>
        </div>
        
        {trace.evidence.length > 0 && (
          <div className="mt-2">
            <strong>Evidence:</strong>
            <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto">
              {JSON.stringify(trace.evidence, null, 2)}
            </pre>
          </div>
        )}
        
        {trace.policy_decision && (
          <div className="mt-2">
            <strong>Policy Decision:</strong>
            <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto">
              {JSON.stringify(trace.policy_decision, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}