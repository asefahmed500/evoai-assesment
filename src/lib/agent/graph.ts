import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { productSearch, sizeRecommender, eta, orderLookup, orderCancel } from './tools';
import { SYSTEM_PROMPT } from './prompts';
import OpenAI from 'openai';
import { ToolResult, EvidenceItem, ProductSearchResult, OrderLookupResult } from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key', // In production, use a real key from env vars
});

// Define the agent state schema using Annotation
const AgentState = Annotation.Root({
  userInput: Annotation<string>,
  intent: Annotation<'product_assist' | 'order_help' | 'other'>({ reducer: (x, y) => y, default: () => 'other' }),
  toolsCalled: Annotation<string[]>({ reducer: (x, y) => [...(x || []), ...y], default: () => [] }),
  evidence: Annotation<EvidenceItem[]>({ reducer: (x, y) => [...(x || []), ...y], default: () => [] }),
  policyDecision: Annotation<{
    cancelAllowed: boolean;
    reason?: string;
  } | undefined>({ reducer: (x, y) => y, default: () => undefined }),
  finalMessage: Annotation<string>({ reducer: (x, y) => y, default: () => '' }),
  toolResults: Annotation<ToolResult[]>({ reducer: (x, y) => [...(x || []), ...y], default: () => [] }),
});

// Define the agent graph
export function createAgentGraph() {
  // Define the router node
  const router = async (state: typeof AgentState.State) => {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Classify this user query: "${state.userInput}"` },
          { role: "system", content: "Respond with only one of: product_assist, order_help, or other. No other text." }
        ],
        temperature: 0,
      });
      
      const intent = completion.choices[0]?.message?.content?.trim() as 'product_assist' | 'order_help' | 'other';
      return { intent };
    } catch (_error) {
      // If OpenAI API fails, use a simple heuristic to classify the intent
      const input = state.userInput.toLowerCase();
      if (input.includes('cancel') || input.includes('order') || input.includes('tracking')) {
        return { intent: 'order_help' as const };
      } else if (input.includes('product') || input.includes('dress') || input.includes('size') || input.includes('wedding')) {
        return { intent: 'product_assist' as const };
      } else {
        return { intent: 'other' as const };
      }
    }
  };

  // Define the tool selector node
  const toolSelector = async (state: typeof AgentState.State) => {
    const toolsCalled: string[] = [];
    const toolResults: ToolResult[] = [];
    const evidence: EvidenceItem[] = [];
    
    if (state.intent === 'product_assist') {
      // Extract parameters for product search
      const priceMatch = state.userInput.match(/\$(\d+)/) || state.userInput.match(/(\d+)\s*dollars/);
      const priceMax = priceMatch ? parseInt(priceMatch[1]) : 1000; // Default high value
      
      const tags = [];
      if (state.userInput.toLowerCase().includes('wedding')) tags.push('wedding');
      if (state.userInput.toLowerCase().includes('party')) tags.push('party');
      if (state.userInput.toLowerCase().includes('daywear')) tags.push('daywear');
      
      // Call product search
      const products = productSearch('dress', priceMax, tags);
      toolsCalled.push('product_search');
      toolResults.push(products);
      evidence.push(...products.map((p) => ({ id: p.id, title: p.title, price: p.price, color: p.color, sizes: p.sizes })));
      
      // Extract zip code for ETA
      const zipMatch = state.userInput.match(/\b\d{5,6}\b/);
      if (zipMatch) {
        const zip = zipMatch[0];
        const deliveryEstimate = eta(zip);
        toolsCalled.push('eta');
        toolResults.push(deliveryEstimate);
        evidence.push({ zip, eta: deliveryEstimate });
      }
      
      // Get size recommendation
      const sizeRec = sizeRecommender(state.userInput);
      toolsCalled.push('size_recommender');
      toolResults.push(sizeRec);
      evidence.push(sizeRec);
    } 
    else if (state.intent === 'order_help') {
      // Extract order ID and email
      const orderIdMatch = state.userInput.match(/[A-Z]\d+/);
      const emailMatch = state.userInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      
      if (orderIdMatch && emailMatch) {
        const orderId = orderIdMatch[0];
        const email = emailMatch[0];
        
        // Look up order
        const order = orderLookup(orderId, email);
        toolsCalled.push('order_lookup');
        toolResults.push(order);
        
        if (order) {
          evidence.push({ order_id: order.order_id, created_at: order.created_at });
          
          // Check if cancellation is requested
          if (state.userInput.toLowerCase().includes('cancel')) {
            const cancelResult = orderCancel(orderId, new Date());
            toolsCalled.push('order_cancel');
            toolResults.push(cancelResult);
            
            return {
              toolsCalled,
              toolResults,
              evidence,
              policyDecision: {
                cancelAllowed: cancelResult.success,
                reason: cancelResult.success ? undefined : 'Order was placed more than 60 minutes ago'
              }
            };
          }
        }
      }
    }
    
    return { toolsCalled, toolResults, evidence };
  };

  // Define the policy guard node
  const policyGuard = async (_state: typeof AgentState.State) => {
    // For order help with cancellation, we've already set policyDecision
    // For other cases, no policy decision is needed
    return {};
  };

  // Define the responder node
  const responder = async (state: typeof AgentState.State) => {
    let finalMessage = '';
    
    if (state.intent === 'product_assist') {
      // Find the product search results
      const productsResult = state.toolResults?.find(r => Array.isArray(r) && r[0]?.id?.startsWith('P')) as ProductSearchResult[] | undefined;
      
      // Find other results
      const sizeRec = state.toolResults?.find(r => r && typeof r === 'object' && 'recommendedSize' in r) as {recommendedSize: string; rationale: string} | undefined;
      const etaResult = state.toolResults?.find(r => r && typeof r === 'object' && 'minDays' in r) as {minDays: number; maxDays: number} | undefined;
      
      if (productsResult && productsResult.length > 0) {
        finalMessage = `I found ${productsResult.length} dress(es) matching your criteria:\n\n`;
        
        productsResult.forEach((product, index) => {
          finalMessage += `${index + 1}) ${product.title} ($${product.price}) in ${product.color}, available sizes: ${product.sizes.join(', ')}\n`;
        });
        
        if (sizeRec) {
          finalMessage += `\nSize recommendation: ${sizeRec.recommendedSize} - ${sizeRec.rationale}\n`;
        }
        
        if (etaResult) {
          finalMessage += `\nDelivery estimate: ${etaResult.minDays}-${etaResult.maxDays} days\n`;
        }
        
        finalMessage += `\nLet me know if you'd like more details about any of these options!`;
      } else {
        finalMessage = "I couldn't find any dresses matching your criteria. Would you like to try a different search?";
      }
    } 
    else if (state.intent === 'order_help') {
      const order = state.toolResults?.find(r => r && typeof r === 'object' && 'order_id' in r) as OrderLookupResult | null | undefined;
      
      if (!order) {
        finalMessage = "I couldn't find your order. Please check that the order ID and email address are correct.";
      } else if (state.userInput.toLowerCase().includes('cancel')) {
        const cancelResult = state.toolResults?.find(r => r && typeof r === 'object' && 'success' in r) as {success: boolean; message: string} | undefined;
        
        if (cancelResult && cancelResult.success) {
          finalMessage = `I've successfully cancelled your order ${order.order_id}. You should receive a confirmation email shortly.`;
        } else {
          finalMessage = `I'm unable to cancel order ${order.order_id} as it was placed more than 60 minutes ago. `;
          finalMessage += `Our policy allows cancellations only within the first hour after purchase. `;
          finalMessage += `Would you like to:\n1) Edit the shipping address instead?\n2) Receive store credit for future purchases?\n3) Speak with our support team for other options?`;
        }
      } else {
        finalMessage = `I found your order ${order.order_id} placed on ${new Date(order.created_at).toLocaleDateString()}. `;
        finalMessage += `It contains ${order.items.length} item(s). How can I help you with this order?`;
      }
    } 
    else {
      // Handle guardrail cases
      if (state.userInput.toLowerCase().includes('discount') && state.userInput.toLowerCase().includes('code')) {
        finalMessage = "I can't provide discount codes that aren't in our system. However, you might enjoy our newsletter subscriber discount (10% off first order) or our seasonal sales. Would you like me to tell you more about these?";
      } else {
        finalMessage = "I'm here to help with product recommendations and order assistance. How can I help you today?";
      }
    }
    
    return { finalMessage };
  };

  // Build the graph
  const workflow = new StateGraph(AgentState)
    .addNode("router", router)
    .addNode("tool_selector", toolSelector)
    .addNode("policy_guard", policyGuard)
    .addNode("responder", responder)
    .addEdge(START, "router")
    .addEdge("router", "tool_selector")
    .addEdge("tool_selector", "policy_guard")
    .addEdge("policy_guard", "responder")
    .addEdge("responder", END);

  return workflow.compile();
}

// Function to generate JSON trace from agent state
export function generateTrace(state: typeof AgentState.State) {
  return {
    intent: state.intent || 'other',
    tools_called: state.toolsCalled || [],
    evidence: state.evidence || [],
    policy_decision: state.policyDecision ? {
      cancel_allowed: state.policyDecision.cancelAllowed,
      reason: state.policyDecision.reason
    } : null,
    final_message: state.finalMessage || ''
  };
}