import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 5173;

const sessions = new Map();

const products = [
  {
    id: "pack-001",
    name: "Weekend Travel Pack",
    description: "Carry-on backpack with hydration pocket and padded laptop sleeve.",
    price: 129
  },
  {
    id: "audio-002",
    name: "Noise-Canceling Earbuds",
    description: "Adaptive noise canceling with six-hour battery and fast charge.",
    price: 89
  },
  {
    id: "home-003",
    name: "Smart Aroma Diffuser",
    description: "Schedule scents with app-based controls and soft ambient lighting.",
    price: 64
  },
  {
    id: "fit-004",
    name: "Performance Joggers",
    description: "Moisture-wicking joggers with 4-way stretch and zip pockets.",
    price: 78
  },
  {
    id: "fit-005",
    name: "Studio Yoga Mat",
    description: "5mm cushioned mat with alignment markers for stability flows.",
    price: 52
  },
  {
    id: "tech-006",
    name: "Wireless Charging Stand",
    description: "Fast-charge stand with dual coil support and LED indicator.",
    price: 44
  },
  {
    id: "kitchen-007",
    name: "Chef Knife Set",
    description: "Three-piece high carbon steel set with ergonomic grips.",
    price: 118
  },
  {
    id: "home-008",
    name: "Premium Throw Blanket",
    description: "Cloud-soft knit blanket for cozy nights and movie marathons.",
    price: 72
  },
  {
    id: "tech-009",
    name: "Smart Water Bottle",
    description: "Tracks hydration goals with glowing reminders and app sync.",
    price: 59
  },
  {
    id: "desk-010",
    name: "Ergonomic Desk Lamp",
    description: "Tunable lighting with touch controls and USB-C charging port.",
    price: 46
  },
  {
    id: "fit-011",
    name: "Trail Running Shoes",
    description: "All-terrain grip with responsive cushioning and waterproof knit.",
    price: 132
  },
  {
    id: "tech-012",
    name: "Compact Bluetooth Speaker",
    description: "360° audio with 12-hour battery and water-resistant shell.",
    price: 55
  },
  {
    id: "beauty-013",
    name: "Glow Skincare Kit",
    description: "Cleanser, serum, and moisturizer trio for daily radiance.",
    price: 94
  },
  {
    id: "home-014",
    name: "Smart LED Lightstrip",
    description: "Voice-controlled accent lighting with 16 million colors.",
    price: 38
  },
  {
    id: "kitchen-015",
    name: "Cold Brew Pitcher",
    description: "Brew smooth coffee overnight with fine mesh filter.",
    price: 36
  },
  {
    id: "apparel-016",
    name: "Everyday Crew Tee",
    description: "Soft organic cotton tee available in five colors.",
    price: 32
  },
  {
    id: "travel-017",
    name: "Packing Cube Set",
    description: "Four-piece compression cube set for tidy luggage.",
    price: 29
  },
  {
    id: "office-018",
    name: "Focus Journal",
    description: "Guided daily planner for productivity sprints and goals.",
    price: 24
  },
  {
    id: "home-019",
    name: "Candle Trio",
    description: "Soy candles in cedar, citrus, and lavender scents.",
    price: 41
  },
  {
    id: "travel-020",
    name: "Universal Travel Adapter",
    description: "Fast-charging adapter with four USB ports and surge protection.",
    price: 49
  }
];

const promos = {
  SAVE10: { type: "percent", value: 0.1, description: "10% off your order" },
  WELCOME15: {
    type: "percent",
    value: 0.15,
    minSubtotal: 100,
    description: "15% off orders over $100"
  },
  SHIP5: { type: "shipping", value: 5, description: "$5 off shipping" }
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.end("Not found");
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function calculateTotals({ line_items, promo_code }) {
  const items = line_items.map((item) => {
    const product = getProduct(item.item.id);
    return {
      id: item.item.id,
      quantity: item.quantity,
      product
    };
  });

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 8 : 0;
  let discount = 0;
  let promoDescription = null;

  if (promo_code && promos[promo_code]) {
    const promo = promos[promo_code];
    if (promo.type === "percent" && (!promo.minSubtotal || subtotal >= promo.minSubtotal)) {
      discount = subtotal * promo.value;
      promoDescription = promo.description;
    }
    if (promo.type === "shipping") {
      discount = Math.min(shipping, promo.value);
      promoDescription = promo.description;
    }
  }

  const tax = subtotal * 0.0825;
  const total = subtotal + shipping + tax - discount;

  return {
    items,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    promoDescription
  };
}

function buildSessionResponse(session) {
  const totals = calculateTotals(session.request);
  return {
    id: session.id,
    protocol: { version: "2026-01-22", capabilities: [] },
    status: session.status,
    currency: session.request.currency,
    line_items: totals.items.map((item) => ({
      id: `line_${item.id}`,
      item: { id: item.id },
      quantity: item.quantity,
      name: item.product.name,
      description: item.product.description,
      unit_amount: Math.round(item.product.price * 100),
      totals: [
        {
          type: "base_amount",
          display_text: "Base Amount",
          amount: Math.round(item.product.price * 100 * item.quantity)
        }
      ]
    })),
    fulfillment_details: session.request.fulfillment_details,
    selected_fulfillment_options: session.request.selected_fulfillment_options || [],
    totals: [
      {
        type: "items_base_amount",
        display_text: "Item(s) total",
        amount: Math.round(totals.subtotal * 100)
      },
      {
        type: "tax",
        display_text: "Tax",
        amount: Math.round(totals.tax * 100)
      },
      {
        type: "fulfillment",
        display_text: "Shipping",
        amount: Math.round(totals.shipping * 100)
      },
      {
        type: "discount",
        display_text: "Discount",
        amount: Math.round(totals.discount * 100)
      },
      {
        type: "total",
        display_text: "Total",
        amount: Math.round(totals.total * 100)
      }
    ],
    messages: totals.promoDescription
      ? [
          {
            type: "info",
            content_type: "plain",
            content: totals.promoDescription
          }
        ]
      : []
  };
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return null;
  return JSON.parse(raw);
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && url.pathname === "/api/checkout_sessions") {
    const body = await readBody(request);
    const id = `checkout_${crypto.randomUUID()}`;
    const session = {
      id,
      status: "ready_for_payment",
      request: body
    };
    sessions.set(id, session);
    return sendJson(response, 200, buildSessionResponse(session));
  }

  if (url.pathname.startsWith("/api/checkout_sessions/")) {
    const id = url.pathname.split("/")[3];
    const session = sessions.get(id);
    if (!session) return sendJson(response, 404, { error: "Session not found" });

    if (request.method === "GET") {
      return sendJson(response, 200, buildSessionResponse(session));
    }

    if (request.method === "PATCH") {
      const body = await readBody(request);
      session.request = {
        ...session.request,
        ...body
      };
      return sendJson(response, 200, buildSessionResponse(session));
    }

    if (request.method === "POST" && url.pathname.endsWith("/complete")) {
      const body = await readBody(request);
      session.status = "completed";
      session.complete_request = body;
      const responsePayload = buildSessionResponse(session);
      responsePayload.status = "completed";
      responsePayload.buyer = body.buyer;
      responsePayload.order = {
        id: `ord_${crypto.randomUUID()}`,
        checkout_session_id: session.id,
        permalink_url: `http://localhost:${port}/orders/${session.id}`
      };
      return sendJson(response, 200, responsePayload);
    }
  }

  return notFound(response);
}

async function handleStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const filePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const fullPath = path.join(__dirname, filePath);

  try {
    const data = await readFile(fullPath);
    const ext = path.extname(fullPath);
    const contentType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json"
    }[ext];
    response.writeHead(200, { "Content-Type": contentType || "text/plain" });
    response.end(data);
  } catch (error) {
    notFound(response);
  }
}

const server = http.createServer(async (request, response) => {
  if (request.url.startsWith("/api/")) {
    try {
      await handleApi(request, response);
    } catch (error) {
      sendJson(response, 500, { error: error.message });
    }
    return;
  }

  await handleStatic(request, response);
});

server.listen(port, () => {
  console.log(`Retail agent demo running at http://localhost:${port}`);
});
