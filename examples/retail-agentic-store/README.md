# Agentic Commerce Retail Demo

This demo is a lightweight retail storefront with a built-in chat agent that:

- Understands shopper intent and recommends products.
- Builds carts, applies promo codes, and summarizes totals.
- Collects shipping + payment details conversationally.
- Calls a local ACP-style server to create, update, and complete checkout sessions.

## Run locally

```bash
cd examples/retail-agentic-store
node server.mjs
```

Then open <http://localhost:5173> in your browser.

## Try it out

- "Build me a weekend travel kit"
- "Add 2 performance joggers"
- "Apply promo SAVE10"
- "Checkout"
- Provide shipping + payment details until the agent asks you to "confirm checkout".

## ACP endpoints

The local server exposes ACP-style endpoints so you can see real request/response flows:

- `POST /api/checkout_sessions`
- `PATCH /api/checkout_sessions/:id`
- `POST /api/checkout_sessions/:id/complete`

## Notes

This is a local demo server. No real payment processing occurs. The ACP payload preview shows the last request + response exchanged with the server.
