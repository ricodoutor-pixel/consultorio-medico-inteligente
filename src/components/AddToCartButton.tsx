import React, { useState } from 'react';
import { Product } from '@/data/products';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showNotification?: boolean;
}

export function AddToCartButton({
  product,
  quantity = 1,
  className = '',
  variant = 'default',
  size = 'default',
  showNotification = true,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }

    if (showNotification) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <>
      <Button
        onClick={handleAddToCart}
        variant={variant}
        size={size}
        className={`gap-2 ${className} ${
          added ? 'bg-green-600 hover:bg-green-700' : ''
        }`}
      >
        {added ? (
          <>
            <Check size={18} />
            Adicionado!
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            Adicionar ao Carrinho
          </>
        )}
      </Button>

      {showNotification && added && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-bounce">
          <p className="text-sm font-semibold">✓ Adicionado ao carrinho!</p>
        </div>
      )}
    </>
  );
}
