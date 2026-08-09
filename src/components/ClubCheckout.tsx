/**
 * Club Planta y Raiz - Checkout com Mercado Pago
 * Administrado 24/7 pelo Manus CEO
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, Lock, Zap, CheckCircle } from 'lucide-react';
import { clubProducts, ClubProduct } from '@/data/clubProducts';

interface CartItem {
  product: ClubProduct;
  quantity: number;
}

interface CheckoutProps {
  onPaymentSuccess?: (orderId: string) => void;
  userMembershipLevel?: 'free' | 'member' | 'vip';
}

export const ClubCheckout: React.FC<CheckoutProps> = ({
  onPaymentSuccess,
  userMembershipLevel = 'free',
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'processing' | 'success' | 'error'>(
    'idle'
  );
  const [orderId, setOrderId] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    number: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Calcular total do carrinho
  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const discount = userMembershipLevel === 'vip' ? item.product.memberDiscount + 5 : 
                       userMembershipLevel === 'member' ? item.product.memberDiscount : 0;
      const finalPrice = item.product.price * (1 - discount / 100);
      return total + finalPrice * item.quantity;
    }, 0);
  };

  // Calcular desconto total
  const calculateDiscount = () => {
    return cart.reduce((total, item) => {
      const discount = userMembershipLevel === 'vip' ? item.product.memberDiscount + 5 : 
                       userMembershipLevel === 'member' ? item.product.memberDiscount : 0;
      return total + (item.product.price * (discount / 100)) * item.quantity;
    }, 0);
  };

  // Calcular frete (gratis para assinantes)
  const calculateShipping = () => {
    if (userMembershipLevel === 'member' || userMembershipLevel === 'vip') {
      return 0; // Frete gratis para assinantes
    }
    return calculateTotal() > 100 ? 0 : 15.90; // Frete gratis acima de R$100
  };

  // Calcular total final com frete
  const calculateFinalTotal = () => {
    return calculateTotal() + calculateShipping();
  };

  // Adicionar item ao carrinho
  const addToCart = (product: ClubProduct) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Remover item do carrinho
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Processar pagamento via Mercado Pago
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Carrinho vazio!');
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city) {
      alert('Preencha o endereço de entrega!');
      return;
    }

    setIsProcessing(true);
    setOrderStatus('processing');

    try {
      // Criar pedido
      const newOrderId = `ORD-${Date.now()}`;
      setOrderId(newOrderId);

      // Order tracking handled by backend audit system

      // Simular chamada à API para criar preferência de pagamento
      const response = await fetch('/api/club/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: newOrderId,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totalAmount: calculateTotal(),
          shippingAddress,
          membershipLevel: userMembershipLevel,
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirecionar para Mercado Pago
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Erro ao criar checkout');
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      setOrderStatus('error');
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-emerald-400" />
            Carrinho de Compras
          </h1>
          <p className="text-slate-400">
            Manus CEO administra seu pedido 24/7 automaticamente
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            {cart.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-8 text-center">
                <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Seu carrinho está vazio</p>
                <p className="text-slate-500 text-sm mt-2">
                  Volte à loja e adicione produtos!
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const discount = userMembershipLevel === 'vip' ? item.product.memberDiscount + 5 : 
                                userMembershipLevel === 'member' ? item.product.memberDiscount : 0;
                const finalPrice = item.product.price * (1 - discount / 100);

                return (
                  <div
                    key={item.product.id}
                    className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-4 flex gap-4"
                  >
                    {/* Imagem */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    {/* Informações */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{item.product.name}</h3>
                      <p className="text-sm text-slate-400 mb-2">{item.product.description}</p>

                      {/* Preço */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-emerald-400">
                          R$ {finalPrice.toFixed(2)}
                        </span>
                        {discount > 0 && (
                          <>
                            <span className="text-sm text-slate-400 line-through">
                              R$ {item.product.price.toFixed(2)}
                            </span>
                            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded">
                              -{discount}%
                            </span>
                          </>
                        )}
                      </div>

                      {/* Quantidade */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white p-1 rounded transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-white font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="bg-slate-700 hover:bg-slate-600 text-white p-1 rounded transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal e Remover */}
                    <div className="text-right flex flex-col justify-between">
                      <div>
                        <p className="text-slate-400 text-sm">Subtotal</p>
                        <p className="text-lg font-bold text-white">
                          R$ {(finalPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-400 hover:text-red-300 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Resumo e Checkout */}
          <div className="space-y-4">
            {/* Resumo do Pedido */}
            <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">Resumo do Pedido</h2>

              <div className="space-y-2 border-b border-purple-500/20 pb-4">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal</span>
                  <span>R$ {(calculateTotal() + calculateDiscount()).toFixed(2)}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Desconto Membro</span>
                    <span>-R$ {calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-300">
                  <span>Frete</span>
                  <span>Grátis</span>
                </div>
              </div>

              <div className="flex justify-between text-2xl font-bold text-white">
                <span>Total</span>
                <span className="text-emerald-400">R$ {calculateTotal().toFixed(2)}</span>
              </div>

              {/* Endereço de Entrega */}
              <div className="space-y-3 border-t border-purple-500/20 pt-4">
                <h3 className="font-semibold text-white">Endereço de Entrega</h3>

                <input
                  type="text"
                  placeholder="Rua"
                  value={shippingAddress.street}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, street: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Número"
                    value={shippingAddress.number}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, number: e.target.value })
                    }
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="CEP"
                    value={shippingAddress.zipCode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
                    }
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Cidade"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Botão de Checkout */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing || cart.length === 0}
                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                  isProcessing || cart.length === 0
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pagar com Mercado Pago
                  </>
                )}
              </button>

              {/* Segurança */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
                <p className="text-emerald-400 text-sm flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Pagamento 100% seguro
                </p>
              </div>

              {/* Status do Pedido */}
              {orderStatus !== 'idle' && (
                <div
                  className={`p-3 rounded-lg text-center ${
                    orderStatus === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : orderStatus === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {orderStatus === 'success' && `✅ Pedido #${orderId} criado com sucesso!`}
                  {orderStatus === 'error' && '❌ Erro ao processar pagamento'}
                  {orderStatus === 'processing' && '⏳ Processando pagamento...'}
                </div>
              )}
            </div>

            {/* Info Manus CEO */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4">
              <p className="text-purple-300 text-sm">
                <strong>💜 Manus CEO:</strong> Seu pedido será administrado 24/7 automaticamente.
                Acompanhamento, pagamento, envio e suporte totalmente autônomos!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubCheckout;
