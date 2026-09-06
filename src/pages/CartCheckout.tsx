import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Loader, Truck, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UpsellOffer } from '@/components/checkout/UpsellOffer';
import { TrustBadges } from '@/components/TrustBadges';
import { ShippingCalculator } from '@/components/ShippingCalculator';
import { supabase } from '@/integrations/supabase/client';

export default function CartCheckout() {
  const navigate = useNavigate();
  const { items, getSubtotal, getTax, getShipping, getFinalTotal, clearCart, shipping: selectedShipping } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [showUpsell, setShowUpsell] = useState(true);
  const [upsellApplied, setUpsellApplied] = useState<string | null>(null);
  const [upsellExtra, setUpsellExtra] = useState(0);

  // Estados de Frete
  const [shippingCost, setShippingCost] = useState<number>(() => getShipping());
  const [shippingCep, setShippingCep] = useState<string>('');
  const [shippingCarrier, setShippingCarrier] = useState<string>('Correios - PAC');
  const [shippingDays, setShippingDays] = useState<number>(5);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '',
  });

  useEffect(() => {
    if (items.length === 0 && !success) navigate('/');
  }, [items, navigate, success]);

  useEffect(() => {
    if (selectedShipping?.cep) {
      setFormData((prev) => (prev.zipCode ? prev : { ...prev, zipCode: selectedShipping.cep }));
    }
  }, [selectedShipping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'zipCode') {
      setShippingCep(e.target.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Preencha todos os campos obrigatórios (Nome, E-mail e Telefone)');
      }

      const orderId = `ORD-${Date.now()}`;
      const subtotal = getSubtotal();
      const tax = getTax();
      const finalTotal = subtotal + tax + shippingCost + upsellExtra;

      // Chama a Edge Function mp-checkout com todos os campos de frete e pedido
      const { data: mpData, error: mpError } = await supabase.functions.invoke('mp-checkout', {
        body: {
          orderId,
          amount: finalTotal,
          description: `Planta y Raiz - Pedido ${orderId}`,
          shipping_cost: shippingCost,
          shipping_cep: shippingCep || formData.zipCode,
          shipping_carrier: shippingCarrier,
          shipping_days: shippingDays,
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: shippingCep || formData.zipCode,
          },
          items: items.map((i) => ({
            id: i.product.id,
            title: i.product.title,
            quantity: i.qty,
            unit_price: i.product.priceValue,
          })),
        },
      });

      if (mpData?.init_point) {
        clearCart();
        window.location.href = mpData.init_point;
        return;
      }

      setSuccess(true);
      clearCart();
      window.location.href = mpData.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };


  if (items.length === 0 && !success) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Carrinho vazio</p>
          <Button onClick={() => navigate('/')}>Voltar para Home</Button>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = subtotal + tax + shippingCost + upsellExtra;

  return (
    <div className="min-h-dvh bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Checkout</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="p-6">
              {success && (
                <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3">
                  <CheckCircle className="text-primary" />
                  <div><p className="font-semibold">Pedido realizado com sucesso!</p><p className="text-sm text-muted-foreground">Redirecionando...</p></div>
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-3">
                  <AlertCircle className="text-destructive" /><p>{error}</p>
                </div>
              )}
              {showUpsell && !success && (
                <div className="mb-6">
                  <UpsellOffer
                    currentTotal={subtotal + tax + shippingCost}
                    onAccept={(newAmount, planName) => {
                      setUpsellExtra(newAmount - (subtotal + tax + shippingCost));
                      setUpsellApplied(planName);
                      setShowUpsell(false);
                    }}
                    onDecline={() => setShowUpsell(false)}
                  />
                </div>
              )}
              {upsellApplied && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle size={16} className="text-primary" />
                  <span className="font-semibold text-foreground">{upsellApplied}</span>
                  <span className="text-muted-foreground">adicionado — + R$ {upsellExtra.toFixed(2)}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div><h2 className="text-xl font-semibold mb-4">Dados Pessoais</h2>
                  <div className="space-y-4">
                    <Input name="name" placeholder="Nome completo" value={formData.name} onChange={handleInputChange} required />
                    <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                    <Input type="tel" name="phone" placeholder="Telefone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                </div>
                <div><h2 className="text-xl font-semibold mb-4">Endereço de Entrega & Frete</h2>
                  <div className="space-y-4">
                    <Input name="address" placeholder="Rua e número" value={formData.address} onChange={handleInputChange} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input name="city" placeholder="Cidade" value={formData.city} onChange={handleInputChange} />
                      <Input name="state" placeholder="Estado" value={formData.state} onChange={handleInputChange} />
                    </div>
                    <Input name="zipCode" placeholder="CEP (00000-000)" value={formData.zipCode} onChange={handleInputChange} />

                    {/* Calculadora e Seletor de Frete Integrado */}
                    <div className="pt-2">
                      <ShippingCalculator
                        cartTotal={subtotal}
                        onSelectShipping={(opt) => {
                          setShippingCost(opt.price);
                          setShippingCarrier(`${opt.company} (${opt.name})`);
                          setShippingDays(opt.delivery_time);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div><h2 className="text-xl font-semibold mb-4">Pagamento Seguro (Mercado Pago / Cartão)</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/20 border border-border flex items-center gap-3">
                      <ShieldCheck className="text-primary w-6 h-6 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Ambiente 100% criptografado. O pagamento poderá ser concluído via PIX com aprovação imediata, Cartão de Crédito em até 12x ou Boleto Bancário.
                      </p>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full py-6 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                  {loading ? (<><Loader className="animate-spin mr-2" size={20} />Processando Pedido...</>) : `Pagar Agora - R$ ${total.toFixed(2)}`}
                </Button>

              </form>
            </Card>
          </div>
          <div>
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.title} x {item.qty}</span>
                    <span className="font-semibold">R$ {(item.product.priceValue * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span><span>R$ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Imposto:</span><span>R$ {tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Truck size={14} className="text-primary" /> {shippingCarrier}:
                  </span>
                  <span className="font-bold text-foreground">{shippingCost === 0 ? "GRÁTIS" : `R$ ${shippingCost.toFixed(2)}`}</span>
                </div>
                {upsellExtra > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Upgrade ({upsellApplied}):</span><span className="text-primary font-semibold">+ R$ {upsellExtra.toFixed(2)}</span></div>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-bold"><span>Total:</span><span className="text-xl text-primary">R$ {total.toFixed(2)}</span></div>
              </div>
            </Card>

            <div className="mt-4">
              <TrustBadges variant="compact" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
