// Types for the agent system
export interface Product {
  id: string;
  title: string;
  price: number;
  tags: string[];
  sizes: string[];
  color: string;
}

export interface Order {
  order_id: string;
  email: string;
  created_at: string;
  items: Array<{
    id: string;
    size: string;
  }>;
}

// Types for tool results
export interface ProductSearchResult {
  id: string;
  title: string;
  price: number;
  color: string;
  sizes: string[];
}

export interface SizeRecommendationResult {
  recommendedSize: string;
  rationale: string;
}

export interface EtaResult {
  minDays: number;
  maxDays: number;
}

// Use the Order type directly for order lookup results
export type OrderLookupResult = Order;

export interface OrderCancelResult {
  success: boolean;
  message: string;
}

// Union type for all possible tool results
export type ToolResult = 
  | ProductSearchResult[]
  | SizeRecommendationResult
  | EtaResult
  | OrderLookupResult
  | OrderCancelResult
  | null;

// Type for evidence items
export type EvidenceItem = 
  | ProductSearchResult
  | { zip: string; eta: EtaResult }
  | SizeRecommendationResult
  | { order_id: string; created_at: string }
  | null;

export interface AgentState {
  userInput: string;
  intent?: 'product_assist' | 'order_help' | 'other';
  toolsCalled?: string[];
  evidence?: EvidenceItem[];
  policyDecision?: {
    cancelAllowed: boolean;
    reason?: string;
  };
  finalMessage?: string;
  toolResults?: ToolResult[];
}

export interface Trace {
  intent: string;
  tools_called: string[];
  evidence: EvidenceItem[];
  policy_decision: {
    cancel_allowed: boolean;
    reason?: string;
  } | null;
  final_message: string;
}