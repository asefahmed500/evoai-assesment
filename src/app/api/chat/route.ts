import { NextRequest, NextResponse } from 'next/server';
import { createAgentGraph, generateTrace } from '../../../lib/agent/graph';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize the agent graph
    const graph = createAgentGraph();
    
    // Run the graph with the user's message
    const initialState = {
      userInput: message,
    };
    
    const result = await graph.invoke(initialState);
    
    // Generate trace using the helper function
    const trace = generateTrace(result);
    
    return NextResponse.json({
      trace,
      response: result.finalMessage
    });
    
  } catch (error: unknown) {
    console.error('Error processing chat message:', error);
    
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}