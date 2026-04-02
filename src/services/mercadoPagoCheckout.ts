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

export interface MercadoPagoPreference {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  payer: {
    name: string;
    email: string;
    phone: {
      area_code: string;
      number: string;
    };
    address: {
      street_name: string;
      street_number: number;
      zip_code: string;
      city_name: string;
      state_name: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  notification_url: string;
  external_reference: string;
}

/**
 * Cria uma preferência de pagamento para Mercado Pago
 */
export async function createMercadoPagoPreference(
  checkoutData: CheckoutData
): Promise<string> {
  try {
    const preference: MercadoPagoPreference = {
      items: checkoutData.items.map((item) => ({
        id: item.product.id,
        title: item.product.name,
        quantity: item.qty,
        unit_price: item.product.priceValue,
      })),
      payer: {
        name: checkoutData.customer.name,
        email: checkoutData.customer.email,
        phone: {
          area_code: '55',
          number: checkoutData.customer.phone.replace(/\D/g, ''),
        },
        address: {
          street_name: checkoutData.customer.address,
          street_number: 0,
          zip_code: checkoutData.customer.zipCode,
          city_name: checkoutData.customer.city,
          state_name: checkoutData.customer.state,
        },
      },
      back_urls: {
        success: `${window.location.origin}/payment-success`,
        failure: `${window.location.origin}/payment-failure`,
        pending: `${window.location.origin}/payment-pending`,
      },
      auto_return: 'approved',
      notification_url: `${window.location.origin}/api/webhooks/mercado-pago`,
      external_reference: `ORDER-${Date.now()}`,
    };

    // Chamada à API para criar preferência
    const response = await fetch('/api/checkout/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar preferência de pagamento');
    }

    const data = await response.json();
    return data.init_point; // URL para redirecionamento ao Mercado Pago
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    throw error;
  }
}

/**
 * Processa o pagamento via checkout transparente
 */
export async function processTransparentCheckout(
  checkoutData: CheckoutData,
  cardData: {
    cardNumber: string;
    cardExpiry: string;
    cardCVC: string;
  }
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const response = await fetch('/api/checkout/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...checkoutData,
        cardData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Erro ao processar pagamento',
      };
    }

    return {
      success: true,
      orderId: data.orderId,
    };
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return {
      success: false,
      error: 'Erro ao processar pagamento',
    };
  }
}

/**
 * Valida dados do cartão
 */
export function validateCardData(cardData: {
  cardNumber: string;
  cardExpiry: string;
  cardCVC: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar número do cartão (Luhn algorithm)
  const cardNumber = cardData.cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cardNumber)) {
    errors.push('Número do cartão inválido');
  }

  // Validar expiração
  const [month, year] = cardData.cardExpiry.split('/');
  if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
    errors.push('Data de expiração inválida');
  }

  // Validar CVC
  if (!/^\d{3,4}$/.test(cardData.cardCVC)) {
    errors.push('CVC inválido');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formata número do cartão
 */
export function formatCardNumber(value: string): string {
  return value
    .replace(/\s/g, '')
    .replace(/(\d{4})/g, '$1 ')
    .trim();
}

/**
 * Formata data de expiração
 */
export function formatCardExpiry(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .slice(0, 5);
}
