const products = [
  {
    id: "pack-001",
    name: "Weekend Travel Pack",
    description: "Carry-on backpack with hydration pocket and padded laptop sleeve.",
    price: 129,
    tag: "Travel"
  },
  {
    id: "audio-002",
    name: "Noise-Canceling Earbuds",
    description: "Adaptive noise canceling with six-hour battery and fast charge.",
    price: 89,
    tag: "Audio"
  },
  {
    id: "home-003",
    name: "Smart Aroma Diffuser",
    description: "Schedule scents with app-based controls and soft ambient lighting.",
    price: 64,
    tag: "Home"
  },
  {
    id: "fit-004",
    name: "Performance Joggers",
    description: "Moisture-wicking joggers with 4-way stretch and zip pockets.",
    price: 78,
    tag: "Apparel"
  },
  {
    id: "fit-005",
    name: "Studio Yoga Mat",
    description: "5mm cushioned mat with alignment markers for stability flows.",
    price: 52,
    tag: "Wellness"
  },
  {
    id: "tech-006",
    name: "Wireless Charging Stand",
    description: "Fast-charge stand with dual coil support and LED indicator.",
    price: 44,
    tag: "Tech"
  },
  {
    id: "kitchen-007",
    name: "Chef Knife Set",
    description: "Three-piece high carbon steel set with ergonomic grips.",
    price: 118,
    tag: "Kitchen"
  },
  {
    id: "home-008",
    name: "Premium Throw Blanket",
    description: "Cloud-soft knit blanket for cozy nights and movie marathons.",
    price: 72,
    tag: "Home"
  },
  {
    id: "tech-009",
    name: "Smart Water Bottle",
    description: "Tracks hydration goals with glowing reminders and app sync.",
    price: 59,
    tag: "Wellness"
  },
  {
    id: "desk-010",
    name: "Ergonomic Desk Lamp",
    description: "Tunable lighting with touch controls and USB-C charging port.",
    price: 46,
    tag: "Office"
  },
  {
    id: "fit-011",
    name: "Trail Running Shoes",
    description: "All-terrain grip with responsive cushioning and waterproof knit.",
    price: 132,
    tag: "Footwear"
  },
  {
    id: "tech-012",
    name: "Compact Bluetooth Speaker",
    description: "360° audio with 12-hour battery and water-resistant shell.",
    price: 55,
    tag: "Audio"
  },
  {
    id: "beauty-013",
    name: "Glow Skincare Kit",
    description: "Cleanser, serum, and moisturizer trio for daily radiance.",
    price: 94,
    tag: "Beauty"
  },
  {
    id: "home-014",
    name: "Smart LED Lightstrip",
    description: "Voice-controlled accent lighting with 16 million colors.",
    price: 38,
    tag: "Home"
  },
  {
    id: "kitchen-015",
    name: "Cold Brew Pitcher",
    description: "Brew smooth coffee overnight with fine mesh filter.",
    price: 36,
    tag: "Kitchen"
  },
  {
    id: "apparel-016",
    name: "Everyday Crew Tee",
    description: "Soft organic cotton tee available in five colors.",
    price: 32,
    tag: "Apparel"
  },
  {
    id: "travel-017",
    name: "Packing Cube Set",
    description: "Four-piece compression cube set for tidy luggage.",
    price: 29,
    tag: "Travel"
  },
  {
    id: "office-018",
    name: "Focus Journal",
    description: "Guided daily planner for productivity sprints and goals.",
    price: 24,
    tag: "Office"
  },
  {
    id: "home-019",
    name: "Candle Trio",
    description: "Soy candles in cedar, citrus, and lavender scents.",
    price: 41,
    tag: "Home"
  },
  {
    id: "travel-020",
    name: "Universal Travel Adapter",
    description: "Fast-charging adapter with four USB ports and surge protection.",
    price: 49,
    tag: "Travel"
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

const state = {
  cart: [],
  promoCode: null,
  shipping: {
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal: "",
    country: ""
  },
  payment: {
    method: "",
    last4: "",
    expiry: ""
  },
  checkoutStep: "idle",
  acp: {
    lastRequest: null,
    lastResponse: null,
    sessionId: null
  }
};

const productGrid = document.getElementById("productGrid");
const cartItems = document.getElementById("cartItems");
const cartSummary = document.getElementById("cartSummary");
const cartCount = document.getElementById("cartCount");
const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const acpPayload = document.getElementById("acpPayload");

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderCatalog() {
  productGrid.innerHTML = "";
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <span class="tag">${product.tag}</span>
      <div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
      </div>
      <div class="product-meta">
        <strong>${formatCurrency(product.price)}</strong>
        <button class="add-btn" data-product="${product.id}">Add to cart</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  productGrid.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.product, 1);
      respondAsAgent(`Added 1 ${getProduct(btn.dataset.product).name} to your cart.`);
    });
  });
}

function getProduct(id) {
  return products.find((product) => product.id === id);
}

function addToCart(id, quantity) {
  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ id, quantity });
  }
  updateUI();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  updateUI();
}

function calculateTotals() {
  const items = state.cart.map((item) => ({
    ...item,
    product: getProduct(item.id)
  }));
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 0 ? 8 : 0;
  let discount = 0;
  let promoDescription = null;

  if (state.promoCode && promos[state.promoCode]) {
    const promo = promos[state.promoCode];
    if (promo.type === "percent") {
      if (!promo.minSubtotal || subtotal >= promo.minSubtotal) {
        discount = subtotal * promo.value;
        promoDescription = promo.description;
      }
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

function renderCart() {
  const { items, subtotal, shipping, tax, discount, total, promoDescription } =
    calculateTotals();

  cartItems.innerHTML = "";
  if (items.length === 0) {
    cartItems.innerHTML = '<p class="muted">Your cart is empty.</p>';
  } else {
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div>
          <strong>${item.product.name}</strong>
          <div><span>Qty ${item.quantity}</span></div>
        </div>
        <div>
          <span>${formatCurrency(item.product.price * item.quantity)}</span>
          <button class="add-btn" data-remove="${item.id}">Remove</button>
        </div>
      `;
      cartItems.appendChild(row);
    });
  }

  cartItems.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.remove));
  });

  cartSummary.innerHTML = `
    <div>Subtotal: ${formatCurrency(subtotal)}</div>
    <div>Shipping: ${formatCurrency(shipping)}</div>
    <div>Tax: ${formatCurrency(tax)}</div>
    <div>Discount: -${formatCurrency(discount)}</div>
    <div><strong>Total: ${formatCurrency(total)}</strong></div>
    ${promoDescription ? `<div>Promo: ${promoDescription}</div>` : ""}
  `;

  cartCount.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
}

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `chat-message ${sender}`;
  message.textContent = text;
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function respondAsAgent(text) {
  addMessage(text, "agent");
}

function parseAddCommand(message) {
  const quantityMatch = message.match(/\b(\d+)\b/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
  const product = products.find((item) =>
    message.includes(item.name.toLowerCase())
  );
  if (product) {
    addToCart(product.id, quantity);
    return `Added ${quantity} ${product.name} to your cart.`;
  }

  if (message.includes("travel")) {
    addToCart("pack-001", 1);
    addToCart("travel-017", 1);
    addToCart("travel-020", 1);
    return "I built a travel bundle with the Weekend Travel Pack, Packing Cubes, and Travel Adapter.";
  }

  return null;
}

function applyPromo(code) {
  const normalized = code.toUpperCase();
  if (!promos[normalized]) {
    return "That promo code isn't available. Try SAVE10 or WELCOME15.";
  }
  state.promoCode = normalized;
  updateUI();
  return `Promo ${normalized} applied: ${promos[normalized].description}.`;
}

function ensureCartHasItems() {
  if (state.cart.length === 0) {
    return "Your cart is empty. Tell me what you'd like to add.";
  }
  return null;
}

function nextCheckoutQuestion() {
  const { shipping, payment } = state;
  if (!shipping.name) return "Great! What's the full name for shipping?";
  if (!shipping.email) return "Got it. What's the best email for order updates?";
  if (!shipping.phone) return "Perfect. What's a phone number for delivery questions?";
  if (!shipping.line1) return "Thanks. What's the street address?";
  if (!shipping.city) return "Which city?";
  if (!shipping.region) return "State or region?";
  if (!shipping.postal) return "Postal code?";
  if (!shipping.country) return "Country?";
  if (!payment.method) return "How would you like to pay? (e.g. Visa, Amex)";
  if (!payment.last4)
    return "Please share the last 4 digits of the card for our demo.";
  if (!payment.expiry) return "Lastly, what's the expiry (MM/YY)?";
  return "All set! Say 'confirm checkout' to execute the ACP flow.";
}

function handleCheckoutAnswer(message) {
  const clean = message.trim();
  const { shipping, payment } = state;

  if (!shipping.name) {
    shipping.name = clean;
  } else if (!shipping.email) {
    shipping.email = clean;
  } else if (!shipping.phone) {
    shipping.phone = clean;
  } else if (!shipping.line1) {
    shipping.line1 = clean;
  } else if (!shipping.city) {
    shipping.city = clean;
  } else if (!shipping.region) {
    shipping.region = clean;
  } else if (!shipping.postal) {
    shipping.postal = clean;
  } else if (!shipping.country) {
    shipping.country = clean;
  } else if (!payment.method) {
    payment.method = clean;
  } else if (!payment.last4) {
    payment.last4 = clean;
  } else if (!payment.expiry) {
    payment.expiry = clean;
  }

  updateUI();
  return nextCheckoutQuestion();
}

function buildCreateRequest() {
  const totals = calculateTotals();
  return {
    currency: "usd",
    line_items: totals.items.map((item) => ({
      item: { id: item.product.id },
      quantity: item.quantity
    })),
    fulfillment_details: {
      name: state.shipping.name || "",
      phone_number: state.shipping.phone || "",
      email: state.shipping.email || "",
      address: {
        name: state.shipping.name || "",
        line_one: state.shipping.line1 || "",
        line_two: state.shipping.line2 || "",
        city: state.shipping.city || "",
        state: state.shipping.region || "",
        country: state.shipping.country || "",
        postal_code: state.shipping.postal || ""
      }
    },
    selected_fulfillment_options: [
      {
        type: "shipping",
        option_id: "shipping_standard",
        item_ids: totals.items.map((item) => item.product.id)
      }
    ],
    promo_code: state.promoCode
  };
}

function buildCompleteRequest() {
  return {
    buyer: {
      first_name: state.shipping.name.split(" ")[0] || "",
      last_name: state.shipping.name.split(" ").slice(1).join(" ") || "",
      email: state.shipping.email || "",
      phone_number: state.shipping.phone || ""
    },
    payment_data: {
      handler_id: "card_tokenized",
      instrument: {
        type: "card",
        credential: {
          type: "demo",
          token: `tok_demo_${state.payment.last4 || "0000"}`
        }
      },
      billing_address: {
        name: state.shipping.name || "",
        line_one: state.shipping.line1 || "",
        line_two: state.shipping.line2 || "",
        city: state.shipping.city || "",
        state: state.shipping.region || "",
        country: state.shipping.country || "",
        postal_code: state.shipping.postal || ""
      },
      metadata: {
        method: state.payment.method || "",
        expiry: state.payment.expiry || ""
      }
    }
  };
}

async function apiRequest(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
}

async function createCheckoutSession() {
  const requestBody = buildCreateRequest();
  state.acp.lastRequest = { endpoint: "POST /api/checkout_sessions", body: requestBody };
  const response = await apiRequest("/api/checkout_sessions", {
    method: "POST",
    body: JSON.stringify(requestBody)
  });
  state.acp.lastResponse = response;
  state.acp.sessionId = response.id;
  updatePayload();
}

async function updateCheckoutSession() {
  if (!state.acp.sessionId) return;
  const requestBody = buildCreateRequest();
  state.acp.lastRequest = {
    endpoint: `PATCH /api/checkout_sessions/${state.acp.sessionId}`,
    body: requestBody
  };
  const response = await apiRequest(`/api/checkout_sessions/${state.acp.sessionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(requestBody)
    }
  );
  state.acp.lastResponse = response;
  updatePayload();
}

async function completeCheckoutSession() {
  if (!state.acp.sessionId) return;
  const requestBody = buildCompleteRequest();
  state.acp.lastRequest = {
    endpoint: `POST /api/checkout_sessions/${state.acp.sessionId}/complete`,
    body: requestBody
  };
  const response = await apiRequest(
    `/api/checkout_sessions/${state.acp.sessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify(requestBody)
    }
  );
  state.acp.lastResponse = response;
  updatePayload();
}

function updatePayload() {
  acpPayload.textContent = JSON.stringify(
    {
      request: state.acp.lastRequest,
      response: state.acp.lastResponse
    },
    null,
    2
  );
}

function updateUI() {
  renderCart();
  updatePayload();
}

async function processMessage(message) {
  const lower = message.toLowerCase();

  if (lower.includes("reset")) {
    resetSession();
    return "Session reset. Ask me about products or say 'checkout'.";
  }

  const addResponse = parseAddCommand(lower);
  if (addResponse) {
    await updateCheckoutSession();
    return addResponse;
  }

  if (lower.includes("remove") && lower.includes("cart")) {
    state.cart = [];
    await updateCheckoutSession();
    updateUI();
    return "Your cart is now empty.";
  }

  if (lower.includes("promo") || lower.includes("code") || lower.includes("discount")) {
    const codeMatch = message.match(/\b[A-Za-z0-9]{4,}\b/);
    if (codeMatch) {
      const reply = applyPromo(codeMatch[0]);
      await updateCheckoutSession();
      return reply;
    }
    return "Share the promo code you'd like to apply (e.g. SAVE10).";
  }

  if (lower.includes("cart")) {
    const summary = calculateTotals();
    if (!summary.items.length) return "Your cart is empty.";
    return `You have ${summary.items.length} items totaling ${formatCurrency(
      summary.total
    )}. Want to checkout?`;
  }

  if (lower.includes("recommend") || lower.includes("suggest")) {
    addToCart("audio-002", 1);
    addToCart("tech-012", 1);
    await updateCheckoutSession();
    return "I recommend the Noise-Canceling Earbuds and the Compact Bluetooth Speaker for an audio duo.";
  }

  if (lower.includes("checkout") || lower.includes("buy") || lower.includes("purchase")) {
    const emptyMessage = ensureCartHasItems();
    if (emptyMessage) return emptyMessage;
    state.checkoutStep = "collecting";
    if (!state.acp.sessionId) {
      await createCheckoutSession();
    }
    return nextCheckoutQuestion();
  }

  if (state.checkoutStep === "collecting") {
    const response = handleCheckoutAnswer(message);
    await updateCheckoutSession();
    return response;
  }

  if (lower.includes("confirm") && lower.includes("checkout")) {
    const emptyMessage = ensureCartHasItems();
    if (emptyMessage) return emptyMessage;
    state.checkoutStep = "confirmed";
    await completeCheckoutSession();
    return "Checkout confirmed! ACP session completed on the local server.";
  }

  if (lower.includes("shipping")) {
    return "Standard shipping is $8 and arrives in 3-4 days. Express is available by request.";
  }

  return "I can help you build a cart, apply promos, and run ACP checkout. Ask me for a product or say 'checkout'.";
}

function resetSession() {
  state.cart = [];
  state.promoCode = null;
  state.checkoutStep = "idle";
  state.acp = { lastRequest: null, lastResponse: null, sessionId: null };
  Object.keys(state.shipping).forEach((key) => {
    state.shipping[key] = "";
  });
  Object.keys(state.payment).forEach((key) => {
    state.payment[key] = "";
  });
  chatLog.innerHTML = "";
  updateUI();
  respondAsAgent("Welcome to Nova Retail! What can I help you find today?");
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  addMessage(message, "user");
  chatInput.value = "";
  try {
    const response = await processMessage(message);
    respondAsAgent(response);
  } catch (error) {
    respondAsAgent(`ACP request failed: ${error.message}`);
  }
});

const resetButton = document.getElementById("resetSession");
resetButton.addEventListener("click", resetSession);

const startCheckoutButton = document.getElementById("startCheckout");
startCheckoutButton.addEventListener("click", async () => {
  try {
    const response = await processMessage("checkout");
    respondAsAgent(response);
  } catch (error) {
    respondAsAgent(`ACP request failed: ${error.message}`);
  }
});

renderCatalog();
resetSession();
