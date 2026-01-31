export type TenderType = 'card' | 'cash' | 'account' | 'comp';

export type CartLineItem = {
  id: string;
  sku?: string;
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
};

export type CartTotals = {
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
};

export type Tender = {
  type: TenderType;
  amount?: number;
};

export type Cart = {
  id?: string;
  lineItems: CartLineItem[];
  totals: CartTotals;
  tender: Tender | null;
};

export type CartLineItemInput = {
  sku?: string;
  name: string;
  qty: number;
  unitPrice: number;
};

export type CartService = {
  createOrLoadCart: () => Promise<Cart>;
  addCartItem: (item: CartLineItemInput) => Promise<Cart>;
  updateCartItem: (lineItemId: string, qty: number) => Promise<Cart>;
  removeCartItem: (lineItemId: string) => Promise<Cart>;
  clearCart: () => Promise<Cart>;
  completeSale: () => Promise<Cart>;
};

const emptyTotals: CartTotals = {
  subtotal: 0,
  tax: 0,
  discounts: 0,
  total: 0,
};

function calculateTotals(items: CartLineItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0;
  const discounts = 0;
  return {
    subtotal,
    tax,
    discounts,
    total: subtotal + tax - discounts,
  };
}

class MockCartService implements CartService {
  private cart: Cart | null = null;

  async createOrLoadCart() {
    if (!this.cart) {
      this.cart = {
        id: crypto.randomUUID(),
        lineItems: [],
        totals: { ...emptyTotals },
        tender: null,
      };
    }
    return this.cloneCart(this.cart);
  }

  async addCartItem(item: CartLineItemInput) {
    const cart = await this.ensureCart();
    const existing = cart.lineItems.find((lineItem) => lineItem.sku === item.sku);
    if (existing) {
      existing.qty += item.qty;
      existing.total = existing.qty * existing.unitPrice;
    } else {
      cart.lineItems.push({
        id: crypto.randomUUID(),
        sku: item.sku,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: item.qty * item.unitPrice,
      });
    }
    cart.totals = calculateTotals(cart.lineItems);
    this.cart = cart;
    return this.cloneCart(cart);
  }

  async updateCartItem(lineItemId: string, qty: number) {
    const cart = await this.ensureCart();
    const lineItem = cart.lineItems.find((item) => item.id === lineItemId);
    if (!lineItem) return this.cloneCart(cart);
    if (qty <= 0) {
      cart.lineItems = cart.lineItems.filter((item) => item.id !== lineItemId);
    } else {
      lineItem.qty = qty;
      lineItem.total = lineItem.qty * lineItem.unitPrice;
    }
    cart.totals = calculateTotals(cart.lineItems);
    this.cart = cart;
    return this.cloneCart(cart);
  }

  async removeCartItem(lineItemId: string) {
    const cart = await this.ensureCart();
    cart.lineItems = cart.lineItems.filter((item) => item.id !== lineItemId);
    cart.totals = calculateTotals(cart.lineItems);
    this.cart = cart;
    return this.cloneCart(cart);
  }

  async clearCart() {
    const cart = await this.ensureCart();
    cart.lineItems = [];
    cart.totals = { ...emptyTotals };
    cart.tender = null;
    this.cart = cart;
    return this.cloneCart(cart);
  }

  async completeSale() {
    return this.clearCart();
  }

  private async ensureCart() {
    if (!this.cart) {
      await this.createOrLoadCart();
    }
    return this.cart as Cart;
  }

  private cloneCart(cart: Cart): Cart {
    return {
      ...cart,
      lineItems: cart.lineItems.map((item) => ({ ...item })),
      totals: { ...cart.totals },
      tender: cart.tender ? { ...cart.tender } : null,
    };
  }
}

export function createCartService(): CartService {
  return new MockCartService();
}
