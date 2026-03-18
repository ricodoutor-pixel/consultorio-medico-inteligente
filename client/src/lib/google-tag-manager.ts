/**
 * GOOGLE TAG MANAGER - INTEGRAÇÃO COMPLETA
 * ID: GTM-MKSBS7P
 * 
 * Rastreia:
 * - Visitantes e sessões
 * - Eventos de usuário
 * - Conversões
 * - Performance
 * - Comportamento de usuário
 * 
 * Data: 09/03/2026
 */

// ============================================================================
// INICIALIZAR GOOGLE TAG MANAGER
// ============================================================================

export function initializeGTM() {
  // GTM já está carregado via index.html
  // Apenas validar que dataLayer existe
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    console.log('✅ Google Tag Manager Inicializado (GTM-MKSBS7P)');
  }
}

// ============================================================================
// RASTREAR EVENTOS
// ============================================================================

export function trackEvent(eventName: string, eventData?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Evento rastreado: ${eventName}`, eventData);
  }
}

// ============================================================================
// RASTREAR VISUALIZAÇÕES DE PÁGINA
// ============================================================================

export function trackPageView(pageName: string, pagePath: string) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'page_view',
      page_title: pageName,
      page_path: pagePath,
      timestamp: new Date().toISOString()
    });
    console.log(`📄 Página rastreada: ${pageName}`);
  }
}

// ============================================================================
// RASTREAR CONVERSÕES
// ============================================================================

export function trackConversion(conversionType: string, value?: number) {
  trackEvent('conversion', {
    type: conversionType,
    value: value || 0,
    timestamp: new Date().toISOString()
  });
  console.log(`💰 Conversão rastreada: ${conversionType}`);
}

// ============================================================================
// RASTREAR USUÁRIOS
// ============================================================================

export function trackUser(userId: string, userData?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'user_identification',
      user_id: userId,
      user_properties: userData || {},
      timestamp: new Date().toISOString()
    });
    console.log(`👤 Usuário rastreado: ${userId}`);
  }
}

// ============================================================================
// RASTREAR ERROS
// ============================================================================

export function trackError(errorMessage: string, errorStack?: string) {
  trackEvent('error', {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString()
  });
  console.error(`🚨 Erro rastreado: ${errorMessage}`);
}

// ============================================================================
// RASTREAR PERFORMANCE
// ============================================================================

export function trackPerformance(metricName: string, value: number) {
  trackEvent('performance_metric', {
    metric: metricName,
    value: value,
    timestamp: new Date().toISOString()
  });
  console.log(`⚡ Performance rastreada: ${metricName} = ${value}ms`);
}

// ============================================================================
// RASTREAR CONSULTAS
// ============================================================================

export function trackConsultation(consultationType: string, value: number) {
  trackConversion('consultation', value);
  trackEvent('consultation_booked', {
    type: consultationType,
    value: value,
    timestamp: new Date().toISOString()
  });
  console.log(`📅 Consulta rastreada: ${consultationType}`);
}

// ============================================================================
// RASTREAR PAGAMENTOS
// ============================================================================

export function trackPayment(paymentMethod: string, amount: number) {
  trackConversion('payment', amount);
  trackEvent('payment_completed', {
    method: paymentMethod,
    amount: amount,
    currency: 'BRL',
    timestamp: new Date().toISOString()
  });
  console.log(`💳 Pagamento rastreado: R$ ${amount}`);
}

// ============================================================================
// RASTREAR CADASTRO
// ============================================================================

export function trackSignup(userType: string) {
  trackConversion('signup', 0);
  trackEvent('user_signup', {
    type: userType,
    timestamp: new Date().toISOString()
  });
  console.log(`📝 Cadastro rastreado: ${userType}`);
}

// ============================================================================
// RASTREAR LOGIN
// ============================================================================

export function trackLogin(userType: string) {
  trackEvent('user_login', {
    type: userType,
    timestamp: new Date().toISOString()
  });
  console.log(`🔓 Login rastreado: ${userType}`);
}

// ============================================================================
// RASTREAR LOGOUT
// ============================================================================

export function trackLogout() {
  trackEvent('user_logout', {
    timestamp: new Date().toISOString()
  });
  console.log('🔒 Logout rastreado');
}

// ============================================================================
// RASTREAR CLIQUES
// ============================================================================

export function trackClick(elementName: string, elementType: string) {
  trackEvent('click', {
    element: elementName,
    type: elementType,
    timestamp: new Date().toISOString()
  });
  console.log(`🖱️ Clique rastreado: ${elementName}`);
}

// ============================================================================
// RASTREAR FORMULÁRIOS
// ============================================================================

export function trackFormSubmit(formName: string, formData?: Record<string, any>) {
  trackEvent('form_submit', {
    form: formName,
    data: formData || {},
    timestamp: new Date().toISOString()
  });
  console.log(`📋 Formulário enviado: ${formName}`);
}

// ============================================================================
// RASTREAR ENGAJAMENTO
// ============================================================================

export function trackEngagement(engagementType: string, duration?: number) {
  trackEvent('engagement', {
    type: engagementType,
    duration: duration || 0,
    timestamp: new Date().toISOString()
  });
  console.log(`📈 Engajamento rastreado: ${engagementType}`);
}

// ============================================================================
// RASTREAR COMPARTILHAMENTO
// ============================================================================

export function trackShare(contentType: string, contentId: string) {
  trackEvent('share', {
    content_type: contentType,
    content_id: contentId,
    timestamp: new Date().toISOString()
  });
  console.log(`📤 Compartilhamento rastreado: ${contentType}`);
}

// ============================================================================
// RASTREAR BUSCA
// ============================================================================

export function trackSearch(searchQuery: string, resultsCount?: number) {
  trackEvent('search', {
    search_term: searchQuery,
    results_count: resultsCount || 0,
    timestamp: new Date().toISOString()
  });
  console.log(`🔍 Busca rastreada: ${searchQuery}`);
}

// ============================================================================
// DEFINIR VARIÁVEIS CUSTOMIZADAS
// ============================================================================

export function setCustomVariable(variableName: string, variableValue: any) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      [variableName]: variableValue,
      timestamp: new Date().toISOString()
    });
    console.log(`📌 Variável customizada definida: ${variableName}`);
  }
}

// ============================================================================
// DEFINIR ID DE USUÁRIO
// ============================================================================

export function setUserId(userId: string) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'userId': userId,
      timestamp: new Date().toISOString()
    });
    console.log(`👤 ID de usuário definido: ${userId}`);
  }
}

// ============================================================================
// DEFINIR PROPRIEDADES DO USUÁRIO
// ============================================================================

export function setUserProperties(properties: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'user_properties': properties,
      timestamp: new Date().toISOString()
    });
    console.log(`👥 Propriedades do usuário definidas:`, properties);
  }
}

// ============================================================================
// DEFINIR TIPOS GLOBAIS
// ============================================================================

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// ============================================================================
// EXPORTAR TODAS AS FUNÇÕES
// ============================================================================

export const googleTagManager = {
  initialize: initializeGTM,
  trackEvent,
  trackPageView,
  trackConversion,
  trackUser,
  trackError,
  trackPerformance,
  trackConsultation,
  trackPayment,
  trackSignup,
  trackLogin,
  trackLogout,
  trackClick,
  trackFormSubmit,
  trackEngagement,
  trackShare,
  trackSearch,
  setCustomVariable,
  setUserId,
  setUserProperties
};
