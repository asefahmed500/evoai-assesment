import { NextRequest, NextResponse } from 'next/server';
import { productSearch, sizeRecommender, eta, orderLookup, orderCancel } from '@/lib/agent/tools';

export async function POST(request: NextRequest) {
  try {
    const { tool, parameters } = await request.json();
    
    if (!tool) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    let result;
    
    switch (tool) {
      case 'product_search':
        const { query, price_max, tags } = parameters || {};
        result = productSearch(query, price_max, tags);
        break;
        
      case 'size_recommender':
        const { user_inputs } = parameters || {};
        result = sizeRecommender(user_inputs);
        break;
        
      case 'eta':
        const { zip } = parameters || {};
        if (!zip) {
          return NextResponse.json({ error: 'Zip code is required for ETA tool' }, { status: 400 });
        }
        result = eta(zip);
        break;
        
      case 'order_lookup':
        const { order_id, email } = parameters || {};
        if (!order_id || !email) {
          return NextResponse.json({ error: 'Order ID and email are required for order lookup' }, { status: 400 });
        }
        result = orderLookup(order_id, email);
        break;
        
      case 'order_cancel':
        const { order_id: cancelOrderId, timestamp } = parameters || {};
        if (!cancelOrderId) {
          return NextResponse.json({ error: 'Order ID is required for cancellation' }, { status: 400 });
        }
        result = orderCancel(cancelOrderId, timestamp ? new Date(timestamp) : new Date());
        break;
        
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
    
    return NextResponse.json({ result });
    
  } catch (error) {
    console.error('Error executing tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET endpoint for testing tools
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tool = searchParams.get('tool');
  
  if (!tool) {
    return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
  }

  try {
    let result;
    
    switch (tool) {
      case 'product_search':
        result = productSearch('dress', 100, ['wedding']);
        break;
        
      case 'size_recommender':
        result = sizeRecommender('I am between M and L');
        break;
        
      case 'eta':
        result = eta('560001');
        break;
        
      case 'order_lookup':
        result = orderLookup('A1001', 'rehan@example.com');
        break;
        
      case 'order_cancel':
        result = orderCancel('A1001', new Date());
        break;
        
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
    
    return NextResponse.json({ 
      tool, 
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error testing tool:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}