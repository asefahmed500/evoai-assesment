import { Product, Order } from './types';

// Mock data - in a real app, this would come from a database
import productsData from '../../app/data/products.json';
import ordersData from '../../app/data/orders.json';

/**
 * Product search tool
 * @param query Search query
 * @param priceMax Maximum price
 * @param tags Tags to filter by
 * @returns Filtered products
 */
export function productSearch(query: string, priceMax: number, tags: string[]): Product[] {
  let filteredProducts = productsData as Product[];
  
  // Filter by query if provided
  if (query) {
    filteredProducts = filteredProducts.filter(product => 
      product.title.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Filter by price
  if (priceMax) {
    filteredProducts = filteredProducts.filter(product => product.price <= priceMax);
  }
  
  // Filter by tags
  if (tags && tags.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      tags.some(tag => product.tags.includes(tag))
    );
  }
  
  return filteredProducts.slice(0, 2); // Return max 2 products
}

/**
 * Size recommendation tool
 * @param userInputs User preferences for size
 * @returns Size recommendation
 */
export function sizeRecommender(userInputs: string): { recommendedSize: string; rationale: string } {
  const input = userInputs.toLowerCase();
  
  if (input.includes('m/l') || input.includes('between m and l')) {
    return {
      recommendedSize: 'L',
      rationale: 'Based on your mention of being between M and L, I recommend size L for a more comfortable fit that allows for movement, especially for wedding events.'
    };
  }
  
  if (input.includes('s/m') || input.includes('between s and m')) {
    return {
      recommendedSize: 'M',
      rationale: 'Since you mentioned being between S and M, I recommend size M for a balanced fit that accommodates most body types.'
    };
  }
  
  // Default recommendation
  return {
    recommendedSize: 'M',
    rationale: 'Based on standard sizing, I recommend size M which fits most average body types comfortably.'
  };
}

/**
 * Estimated delivery time tool
 * @param zip Zip code
 * @returns Delivery estimate
 */
export function eta(zip: string): { minDays: number; maxDays: number } {
  // Simple rule-based ETA calculation
  const zipPrefix = parseInt(zip.substring(0, 2));
  
  if (zipPrefix >= 10 && zipPrefix <= 30) {
    return { minDays: 2, maxDays: 3 };
  } else if (zipPrefix >= 31 && zipPrefix <= 60) {
    return { minDays: 3, maxDays: 5 };
  } else {
    return { minDays: 4, maxDays: 6 };
  }
}

/**
 * Order lookup tool
 * @param orderId Order ID
 * @param email Email address
 * @returns Order details if found
 */
export function orderLookup(orderId: string, email: string): Order | null {
  const orders = ordersData as Order[];
  return orders.find(order => 
    order.order_id === orderId && order.email === email
  ) || null;
}

/**
 * Order cancellation tool with policy enforcement
 * @param orderId Order ID
 * @param timestamp Current timestamp for policy check
 * @returns Cancellation result
 */
export function orderCancel(orderId: string, timestamp: Date): { success: boolean; message: string } {
  const orders = ordersData as Order[];
  const order = orders.find(o => o.order_id === orderId);
  
  if (!order) {
    return { success: false, message: 'Order not found' };
  }
  
  const orderTime = new Date(order.created_at);
  const currentTime = timestamp;
  const timeDiff = (currentTime.getTime() - orderTime.getTime()) / (1000 * 60); // Difference in minutes
  
  // Enforce 60-minute cancellation policy
  if (timeDiff <= 60) {
    // In a real application, we would update the order status here
    return { 
      success: true, 
      message: `Order ${orderId} has been successfully cancelled.` 
    };
  } else {
    return { 
      success: false, 
      message: `Cancellation not allowed. Order was placed more than 60 minutes ago.` 
    };
  }
}