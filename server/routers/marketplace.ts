import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const marketplaceRouter = router({
  // Listar produtos
  listProducts: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return {
        products: [
          { id: 1, name: 'Óleo CBD 500mg', price: 99.90, rating: 4.8, stock: 45 },
          { id: 2, name: 'Cápsula Hemp 1000mg', price: 149.90, rating: 4.7, stock: 32 },
        ],
        total: 2,
        page: input.page,
      };
    }),

  // Obter detalhes do produto
  getProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.id,
        name: 'Óleo CBD 500mg',
        price: 99.90,
        description: 'Óleo CBD de alta concentração',
        rating: 4.8,
        reviews: 234,
        stock: 45,
        images: ['🧴'],
      };
    }),

  // Adicionar ao carrinho
  addToCart: protectedProcedure
    .input(z.object({
      productId: z.number(),
      quantity: z.number().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        cartId: Math.random(),
        message: 'Produto adicionado ao carrinho',
      };
    }),

  // Obter carrinho
  getCart: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        items: [
          { productId: 1, name: 'Óleo CBD', quantity: 1, price: 99.90 },
        ],
        total: 99.90,
      };
    }),

  // Remover do carrinho
  removeFromCart: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),

  // Criar pedido
  createOrder: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
      })),
      shippingAddress: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return {
        orderId: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        status: 'pending',
        total: 99.90,
        estimatedDelivery: '2026-03-02',
      };
    }),

  // Obter pedidos do usuário
  getUserOrders: protectedProcedure
    .query(async ({ ctx }) => {
      return [
        {
          id: 'ORD-ABC123',
          date: '2026-02-23',
          status: 'shipped',
          total: 99.90,
          items: 1,
        },
      ];
    }),

  // Deixar review de produto
  leaveProductReview: protectedProcedure
    .input(z.object({
      productId: z.number(),
      rating: z.number().min(1).max(5),
      text: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { success: true };
    }),
});
