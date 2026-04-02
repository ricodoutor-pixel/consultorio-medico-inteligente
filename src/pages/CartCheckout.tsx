import React, { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useNavigate } from 'wouter';

export function CartCheckout() {
  const navigate = useNavigate();
  const { items, getSubtotal, getTax, getShipping, getFinalTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validação básica
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      // Aqui seria feita a integração com Mercado Pago
      // Por enquanto, simulamos o pagamento
      const orderData = {
        items: items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.qty,
          price: item.product.priceValue,
        })),
        customer: formData,
        total: getFinalTotal(),
        subtotal: getSubtotal(),
        tax: getTax(),
        shipping: getShipping(),
        timestamp: new Date().toISOString(),
      };

      // Simular chamada à API
      console.log('Pedido:', orderData);

      // Aqui seria feita a chamada real à API
      // const response = await fetch('/api/checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(orderData),
      // });

      // Simular sucesso
      setSuccess(true);
      clearCart();

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/payment-success');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Carrinho vazio</p>
          <Button onClick={() => navigate('/')}>Voltar para Home</Button>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = getShipping();
  const total = getFinalTotal();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Formulário */}
          <div className="md:col-span-2">
            <Card className="p-6">
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Pedido realizado com sucesso!</p>
                    <p className="text-sm text-green-700">Redirecionando...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="text-red-600" />
                  <p className="text-red-900">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Dados Pessoais</h2>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      name="name"
                      placeholder="Nome completo"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="Telefone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Endereço de Entrega</h2>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      name="address"
                      placeholder="Rua e número"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        name="city"
                        placeholder="Cidade"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                      <Input
                        type="text"
                        name="state"
                        placeholder="Estado"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    <Input
                      type="text"
                      name="zipCode"
                      placeholder="CEP"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Cartão */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Dados do Cartão</h2>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      name="cardNumber"
                      placeholder="Número do cartão"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      maxLength={19}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        maxLength={5}
                      />
                      <Input
                        type="text"
                        name="cardCVC"
                        placeholder="CVC"
                        value={formData.cardCVC}
                        onChange={handleInputChange}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin mr-2" size={20} />
                      Processando...
                    </>
                  ) : (
                    `Confirmar Pagamento - R$ ${total.toFixed(2)}`
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div>
            <Card className="p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-6 pb-6 border-b">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} x {item.qty}
                    </span>
                    <span className="font-semibold">
                      R$ {(item.product.priceValue * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Imposto:</span>
                  <span>R$ {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete:</span>
                  <span>R$ {shipping.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-xl text-green-600">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
