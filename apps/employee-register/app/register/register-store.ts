'use client';

import { create } from 'zustand';
import type { CustomerDto } from '../../lib/api';
import type { components } from '@clubops/shared';
import type { Cart, CartLineItemInput, Tender, TenderType } from '../../lib/cart-service';
import { createCartService } from '../../lib/cart-service';

export type VisitDto = components['schemas']['VisitDTO'];

const cartService = createCartService();

type RegisterStore = {
  selectedCustomer: CustomerDto | null;
  activeVisit: VisitDto | null;
  cart: Cart;
  cartStatus: 'idle' | 'loading' | 'error';
  cartError: string | null;
  setSelectedCustomer: (customer: CustomerDto | null) => void;
  setActiveVisit: (visit: VisitDto | null) => void;
  createOrLoadCart: () => Promise<void>;
  addLineItem: (payload: CartLineItemInput) => Promise<void>;
  updateLineItemQty: (lineItemId: string, qty: number) => Promise<void>;
  removeLineItem: (lineItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setTender: (tender: Tender | null) => void;
  completeSale: () => Promise<void>;
};

const emptyCart: Cart = {
  lineItems: [],
  totals: { subtotal: 0, tax: 0, discounts: 0, total: 0 },
  tender: null,
};

export const useRegisterStore = create<RegisterStore>((set, get) => ({
  selectedCustomer: null,
  activeVisit: null,
  cart: emptyCart,
  cartStatus: 'idle',
  cartError: null,
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  setActiveVisit: (visit) => set({ activeVisit: visit }),
  createOrLoadCart: async () => {
    set({ cartStatus: 'loading', cartError: null });
    try {
      const cart = await cartService.createOrLoadCart();
      set({ cart, cartStatus: 'idle' });
    } catch (error) {
      set({
        cartStatus: 'error',
        cartError: error instanceof Error ? error.message : 'Unable to load cart.',
      });
    }
  },
  addLineItem: async (payload) => {
    const { cartStatus } = get();
    if (cartStatus === 'loading') return;
    set({ cartStatus: 'loading', cartError: null });
    try {
      const cart = await cartService.addCartItem(payload);
      set({ cart, cartStatus: 'idle' });
    } catch (error) {
      set({
        cartStatus: 'error',
        cartError: error instanceof Error ? error.message : 'Unable to add item.',
      });
    }
  },
  updateLineItemQty: async (lineItemId, qty) => {
    set({ cartStatus: 'loading', cartError: null });
    try {
      const cart = await cartService.updateCartItem(lineItemId, qty);
      set({ cart, cartStatus: 'idle' });
    } catch (error) {
      set({
        cartStatus: 'error',
        cartError: error instanceof Error ? error.message : 'Unable to update item.',
      });
    }
  },
  removeLineItem: async (lineItemId) => {
    set({ cartStatus: 'loading', cartError: null });
    try {
      const cart = await cartService.removeCartItem(lineItemId);
      set({ cart, cartStatus: 'idle' });
    } catch (error) {
      set({
        cartStatus: 'error',
        cartError: error instanceof Error ? error.message : 'Unable to remove item.',
      });
    }
  },
  clearCart: async () => {
    set({ cartStatus: 'loading', cartError: null });
    try {
      const cart = await cartService.clearCart();
      set({ cart, cartStatus: 'idle' });
    } catch (error) {
      set({
        cartStatus: 'error',
        cartError: error instanceof Error ? error.message : 'Unable to clear cart.',
      });
    }
  },
  setTender: (tender) => {
    const cart = { ...get().cart, tender };
    set({ cart });
  },
  completeSale: async () => {
    set({ cartStatus: 'loading', cartError: null });
    try {
      const cart = await cartService.completeSale();
      set({ cart, cartStatus: 'idle' });
    } catch (error) {
      set({
        cartStatus: 'error',
        cartError: error instanceof Error ? error.message : 'Unable to complete sale.',
      });
    }
  },
}));

export type { Cart, CartLineItemInput, Tender, TenderType };
