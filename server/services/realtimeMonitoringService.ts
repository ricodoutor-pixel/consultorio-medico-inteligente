// ============================================================================
// REALTIME MONITORING SERVICE — Monitoramento 24/7 com Mapa Mundi
// Planta & Raiz 3.0 — CEO Autônomo
// ============================================================================

import { notifyOwner } from '../_core/notification';

interface UserLocation {
  userId: string;
  ipAddress: string;
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  lastSeen: number;
  sessionDuration: number;
  platform: 'web' | 'mobile' | 'app';
  deposits: number;
  earnings: number;
  consultations: number;
  status: 'online' | 'idle' | 'offline';
}

interface WorldMapData {
  timestamp: number;
  totalOnline: number;
  totalToday: number;
  byCountry: Map<string, number>;
  byState: Map<string, number>;
  users: UserLocation[];
  hotspots: Array<{
    country: string;
    city: string;
    count: number;
    latitude: number;
    longitude: number;
  }>;
}

class RealtimeMonitoringService {
  private onlineUsers: Map<string, UserLocation> = new Map();
  private dailyUsers: Set<string> = new Set();
  private worldMapData: WorldMapData | null = null;

  /**
   * Inicializar serviço de monitoramento
   */
  public async initialize(): Promise<void> {
    console.log('[RealtimeMonitoring] Initializing...');

    // Atualizar mapa mundi a cada 30 segundos
    setInterval(() => this.updateWorldMap(), 30000);

    // Limpar usuários offline a cada 5 minutos
    setInterval(() => this.cleanupOfflineUsers(), 300000);

    // Gerar relatório a cada hora
    setInterval(() => this.generateHourlyReport(), 3600000);

    // Reset diário de contadores
    setInterval(() => this.resetDailyCounters(), 86400000);

    // Monitoramento de autoridade técnica: Dr. Edilson Bezerra
    setInterval(() => {
      console.log('[RealtimeMonitoring] Supervisão Técnica: Dr. Edilson Bezerra (CFM 2.314/2022) - Ativo');
    }, 60000); // A cada 1 minuto

    console.log('[RealtimeMonitoring] Initialized');
  }

  /**
   * Registrar usuário online
   */
  public registerUserOnline(
    userId: string,
    ipAddress: string,
    country: string,
    state: string,
    city: string,
    latitude: number,
    longitude: number,
    platform: 'web' | 'mobile' | 'app',
    deposits: number,
    earnings: number,
    consultations: number
  ): void {
    const user: UserLocation = {
      userId,
      ipAddress,
      country,
      state,
      city,
      latitude,
      longitude,
      lastSeen: Date.now(),
      sessionDuration: 0,
      platform,
      deposits,
      earnings,
      consultations,
      status: 'online',
    };

    this.onlineUsers.set(userId, user);
    this.dailyUsers.add(userId);

    console.log(`[RealtimeMonitoring] User ${userId} online from ${city}, ${state}, ${country}`);
  }

  /**
   * Atualizar status de usuário
   */
  public updateUserStatus(userId: string, status: 'online' | 'idle' | 'offline'): void {
    const user = this.onlineUsers.get(userId);
    if (user) {
      user.status = status;
      user.lastSeen = Date.now();

      if (status === 'offline') {
        this.onlineUsers.delete(userId);
      }
    }
  }

  /**
   * Atualizar mapa mundi
   */
  private async updateWorldMap(): Promise<void> {
    try {
      const byCountry = new Map<string, number>();
      const byState = new Map<string, number>();
      const hotspots: Array<{ country: string; city: string; count: number; latitude: number; longitude: number }> = [];

      // Contar usuários por país e estado
      for (const user of this.onlineUsers.values()) {
        byCountry.set(user.country, (byCountry.get(user.country) || 0) + 1);
        byState.set(`${user.state}, ${user.country}`, (byState.get(`${user.state}, ${user.country}`) || 0) + 1);
      }

      // Identificar hotspots (cidades com 5+ usuários)
      const cityCounts = new Map<string, { count: number; latitude: number; longitude: number; country: string }>();
      for (const user of this.onlineUsers.values()) {
        const key = `${user.city}, ${user.state}`;
        const existing = cityCounts.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityCounts.set(key, {
            count: 1,
            latitude: user.latitude,
            longitude: user.longitude,
            country: user.country,
          });
        }
      }

      for (const [city, data] of cityCounts) {
        if (data.count >= 5) {
          hotspots.push({
            country: data.country,
            city,
            count: data.count,
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
      }

      this.worldMapData = {
        timestamp: Date.now(),
        totalOnline: this.onlineUsers.size,
        totalToday: this.dailyUsers.size,
        byCountry,
        byState,
        users: Array.from(this.onlineUsers.values()),
        hotspots,
      };

      console.log(`[RealtimeMonitoring] World map updated: ${this.onlineUsers.size} online, ${this.dailyUsers.size} today`);
    } catch (error) {
      console.error('[RealtimeMonitoring] World map update failed:', error);
    }
  }

  /**
   * Limpar usuários offline
   */
  private cleanupOfflineUsers(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutos

    for (const [userId, user] of this.onlineUsers) {
      if (now - user.lastSeen > timeout) {
        this.onlineUsers.delete(userId);
        console.log(`[RealtimeMonitoring] User ${userId} marked offline (timeout)`);
      }
    }
  }

  /**
   * Gerar relatório horário
   */
  private async generateHourlyReport(): Promise<void> {
    try {
      if (!this.worldMapData) return;

      const topCountries = Array.from(this.worldMapData.byCountry.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => `${e[0]}: ${e[1]}`)
        .join(' | ');

      const totalDeposits = Array.from(this.onlineUsers.values()).reduce((sum, u) => sum + u.deposits, 0);
      const totalEarnings = Array.from(this.onlineUsers.values()).reduce((sum, u) => sum + u.earnings, 0);

      console.log('[RealtimeMonitoring] Hourly Report:');
      console.log(`  Online: ${this.worldMapData.totalOnline}`);
      console.log(`  Today: ${this.worldMapData.totalToday}`);
      console.log(`  Top Countries: ${topCountries}`);
      console.log(`  Total Deposits: R$ ${totalDeposits.toFixed(2)}`);
      console.log(`  Total Earnings: R$ ${totalEarnings.toFixed(2)}`);

      // Notificar se pico de usuários
      if (this.worldMapData.totalOnline > 500) {
        await notifyOwner({
          title: '📊 Pico de Usuários Online',
          content: `${this.worldMapData.totalOnline} usuários online | Top: ${topCountries}`,
        });
      }
    } catch (error) {
      console.error('[RealtimeMonitoring] Report generation failed:', error);
    }
  }

  /**
   * Reset diário de contadores
   */
  private resetDailyCounters(): void {
    this.dailyUsers.clear();
    console.log('[RealtimeMonitoring] Daily counters reset');
  }

  /**
   * Obter dados do mapa mundi
   */
  public getWorldMapData(): WorldMapData | null {
    return this.worldMapData;
  }

  /**
   * Obter usuários online
   */
  public getOnlineUsers(): UserLocation[] {
    return Array.from(this.onlineUsers.values());
  }

  /**
   * Obter usuário específico
   */
  public getUser(userId: string): UserLocation | undefined {
    return this.onlineUsers.get(userId);
  }

  /**
   * Obter estatísticas de monitoramento
   */
  public getMonitoringStats(): {
    totalOnline: number;
    totalToday: number;
    topCountries: Array<{ country: string; count: number }>;
    topCities: Array<{ city: string; count: number; country: string }>;
    platformDistribution: { web: number; mobile: number; app: number };
    totalDeposits: number;
    totalEarnings: number;
  } {
    if (!this.worldMapData) {
      return {
        totalOnline: 0,
        totalToday: 0,
        topCountries: [],
        topCities: [],
        platformDistribution: { web: 0, mobile: 0, app: 0 },
        totalDeposits: 0,
        totalEarnings: 0,
      };
    }

    const topCountries = Array.from(this.worldMapData.byCountry.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((e) => ({ country: e[0], count: e[1] }));

    const topCities = this.worldMapData.hotspots.slice(0, 10).map((h) => ({
      city: h.city,
      count: h.count,
      country: h.country,
    }));

    const platformDistribution = {
      web: Array.from(this.onlineUsers.values()).filter((u) => u.platform === 'web').length,
      mobile: Array.from(this.onlineUsers.values()).filter((u) => u.platform === 'mobile').length,
      app: Array.from(this.onlineUsers.values()).filter((u) => u.platform === 'app').length,
    };

    const totalDeposits = Array.from(this.onlineUsers.values()).reduce((sum, u) => sum + u.deposits, 0);
    const totalEarnings = Array.from(this.onlineUsers.values()).reduce((sum, u) => sum + u.earnings, 0);

    return {
      totalOnline: this.worldMapData.totalOnline,
      totalToday: this.worldMapData.totalToday,
      topCountries,
      topCities,
      platformDistribution,
      totalDeposits,
      totalEarnings,
    };
  }

  /**
   * Exportar dados para mapa
   */
  public exportMapData(): {
    markers: Array<{
      id: string;
      lat: number;
      lng: number;
      title: string;
      deposits: number;
      earnings: number;
      consultations: number;
      platform: string;
    }>;
    heatmap: Array<{ lat: number; lng: number; weight: number }>;
  } {
    const markers = Array.from(this.onlineUsers.values()).map((u) => ({
      id: u.userId,
      lat: u.latitude,
      lng: u.longitude,
      title: `${u.city}, ${u.state}, ${u.country}`,
      deposits: u.deposits,
      earnings: u.earnings,
      consultations: u.consultations,
      platform: u.platform,
    }));

    const heatmap = Array.from(this.onlineUsers.values()).map((u) => ({
      lat: u.latitude,
      lng: u.longitude,
      weight: 1,
    }));

    return { markers, heatmap };
  }
}

// Exportar instância singleton
export const realtimeMonitoringService = new RealtimeMonitoringService();
