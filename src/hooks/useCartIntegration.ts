import { useCart } from '@/store/cart';
import { Product } from '@/data/products';

/**
 * Hook customizado para integração com carrinho
 * Fornece métodos simplificados para adicionar/remover itens
 */
export function useCartIntegration() {
  const cart = useCart();

  const addToCart = (product: Product, quantity: number = 1) => {
    for (let i = 0; i < quantity; i++) {
      cart.addItem(product);
    }
  };

  const removeFromCart = (productId: string) => {
    cart.removeItem(productId);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    cart.updateQty(productId, quantity);
  };

  const getCartSummary = () => {
    return {
      itemCount: cart.count(),
      subtotal: cart.getSubtotal(),
      tax: cart.getTax(),
      shipping: cart.getShipping(),
      total: cart.getFinalTotal(),
      items: cart.items,
      hasItems: cart.hasItems(),
    };
  };

  return {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getCartSummary,
    clearCart: cart.clearCart,
    cart,
  };
}
