# EvoAI Test Outputs

This document contains the test outputs for the 4 required test cases.

## Test Case 1: Product Assist

**Input:** "Wedding guest, midi, under $120 — I'm between M/L. ETA to 560001?"

**Output:**
```
I found 2 dress(es) matching your criteria:

1) Midi Wrap Dress ($119) in Charcoal, available sizes: S, M, L
2) Satin Slip Dress ($99) in Blush, available sizes: XS, S, M

Size recommendation: L - Based on your mention of being between M and L, I recommend size L for a more comfortable fit that allows for movement, especially for wedding events.

Delivery estimate: 3-5 days

Let me know if you'd like more details about any of these options!
```

**Trace JSON:**
```json
{
  "intent": "product_assist",
  "tools_called": ["product_search", "eta", "size_recommender"],
  "evidence": [
    {"id": "P1", "title": "Midi Wrap Dress", "price": 119},
    {"id": "P2", "title": "Satin Slip Dress", "price": 99},
    {"zip": "560001", "eta": {"minDays": 3, "maxDays": 5}},
    {"recommendedSize": "L", "rationale": "Based on your mention of being between M and L, I recommend size L for a more comfortable fit that allows for movement, especially for wedding events."}
  ],
  "policy_decision": null,
  "final_message": "I found 2 dress(es) matching your criteria:\n\n1) Midi Wrap Dress ($119) in Charcoal, available sizes: S, M, L\n2) Satin Slip Dress ($99) in Blush, available sizes: XS, S, M\n\nSize recommendation: L - Based on your mention of being between M and L, I recommend size L for a more comfortable fit that allows for movement, especially for wedding events.\n\nDelivery estimate: 3-5 days\n\nLet me know if you'd like more details about any of these options!"
}
```

## Test Case 2: Order Help (Allowed)

**Input:** "Cancel order A1003 — email mira@example.com"

**Output:**
```
I've successfully cancelled your order A1003. You should receive a confirmation email shortly.
```

**Trace JSON:**
```json
{
  "intent": "order_help",
  "tools_called": ["order_lookup", "order_cancel"],
  "evidence": [
    {"order_id": "A1003", "created_at": "2025-09-07T16:30:00Z"}
  ],
  "policy_decision": {
    "cancel_allowed": true
  },
  "final_message": "I've successfully cancelled your order A1003. You should receive a confirmation email shortly."
}
```

## Test Case 3: Order Help (Blocked by 60-min Rule)

**Input:** "Cancel order A1002 — email alex@example.com"

**Output:**
```
I'm unable to cancel order A1002 as it was placed more than 60 minutes ago. Our policy allows cancellations only within the first hour after purchase. Would you like to:
1) Edit the shipping address instead?
2) Receive store credit for future purchases?
3) Speak with our support team for other options?
```

**Trace JSON:**
```json
{
  "intent": "order_help",
  "tools_called": ["order_lookup", "order_cancel"],
  "evidence": [
    {"order_id": "A1002", "created_at": "2025-09-06T13:05:00Z"}
  ],
  "policy_decision": {
    "cancel_allowed": false,
    "reason": "Order was placed more than 60 minutes ago"
  },
  "final_message": "I'm unable to cancel order A1002 as it was placed more than 60 minutes ago. Our policy allows cancellations only within the first hour after purchase. Would you like to:\n1) Edit the shipping address instead?\n2) Receive store credit for future purchases?\n3) Speak with our support team for other options?"
}
```

## Test Case 4: Guardrail (Nonsense Request)

**Input:** "Can you give me a discount code that doesn't exist?"

**Output:**
```
I can't provide discount codes that aren't in our system. However, you might enjoy our newsletter subscriber discount (10% off first order) or our seasonal sales. Would you like me to tell you more about these?
```

**Trace JSON:**
```json
{
  "intent": "other",
  "tools_called": [],
  "evidence": [],
  "policy_decision": null,
  "final_message": "I can't provide discount codes that aren't in our system. However, you might enjoy our newsletter subscriber discount (10% off first order) or our seasonal sales. Would you like me to tell you more about these?"
}
```