import React, { useState } from 'react';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, ShoppingCart as CartIcon } from 'lucide-react';

export function ShoppingCart() {
  const { items, removeItem, updateQty, clearCart, getSubtotal, getTax, getShipping, getFinalTotal } = useCart();
  const [showCart, setShowCart] = useState(false);

  if (!showCart) {
    return (
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-all z-40"
        title="Abrir carrinho"
      >
        <CartIcon size={24} />
        {items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {items.length}
          </span>
        )}
      </button>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = getShipping();
  const total = getFinalTotal();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-end">
      <Card className="w-full md:w-96 h-screen md:h-auto md:rounded-lg rounded-t-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Carrinho de Compras</h2>
          <button
            onClick={() => setShowCart(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <CartIcon size={48} className="mb-4 opacity-50" />
              <p>Seu carrinho está vazio</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* Imagem */}
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{item.product.name}</h3>
                  <p className="text-gray-600 text-sm">{item.product.category}</p>
                  <p className="text-green-600 font-bold mt-1">
                    R$ {item.product.priceValue.toFixed(2)}
                  </p>
                </div>

                {/* Quantidade */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Minus size={16} />
                  </button>
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateQty(item.product.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center"
                  />
                  <button
                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Remover */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-red-500 hover:text-red-700 p-2"
                  title="Remover do carrinho"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Resumo */}
        {items.length > 0 && (
          <>
            <div className="border-t p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Imposto (10%):</span>
                <span className="font-semibold">R$ {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frete:</span>
                <span className="font-semibold">R$ {shipping.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold">Total:</span>
                <span className="text-xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botões */}
            <div className="p-6 border-t space-y-3">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
                onClick={() => {
                  // Integração com Mercado Pago será feita na próxima fase
                  alert('Redirecionando para Mercado Pago...');
                }}
              >
                Ir para Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => clearCart()}
              >
                Limpar Carrinho
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowCart(false)}
              >
                Continuar Comprando
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
