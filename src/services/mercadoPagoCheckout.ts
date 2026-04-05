import { CartItem } from '@/store/cart';

export interface CheckoutData {
  items: CartItem[];
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export async function createMercadoPagoPreference(checkoutData: CheckoutData): Promise<string> {
  try {
    const preference = {
      items: checkoutData.items.map((item) => ({
        id: item.product.id,
        title: item.product.title,
        quantity: item.qty,
        unit_price: item.product.priceValue,
      })),
      payer: {
        name: checkoutData.customer.name,
        email: checkoutData.customer.email,
        phone: { area_code: '55', number: checkoutData.customer.phone.replace(/\D/g, '') },
        address: {
          street_name: checkoutData.customer.address,
          street_number: 0,
          zip_code: checkoutData.customer.zipCode,
          city_name: checkoutData.customer.city,
          state_name: checkoutData.customer.state,
        },
      },
      back_urls: {
        success: `${window.location.origin}/payment/success`,
        failure: `${window.location.origin}/payment/failure`,
        pending: `${window.location.origin}/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `${window.location.origin}/api/webhooks/mercado-pago`,
      external_reference: `ORDER-${Date.now()}`,
    };

    const response = await fetch('/api/checkout/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preference),
    });

    if (!response.ok) throw new Error('Erro ao criar preferência de pagamento');
    const data = await response.json();
    return data.init_point;
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    throw error;
  }
}
