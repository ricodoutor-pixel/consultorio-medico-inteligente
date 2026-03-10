/**
 * Wearable Integration Service
 * Integrates with Apple Watch, Fitbit, Garmin for health data synchronization
 */

interface WearableDevice {
  id: string;
  userId: string;
  type: 'apple-watch' | 'fitbit' | 'garmin';
  deviceId: string;
  accessToken: string;
  refreshToken?: string;
  connectedAt: Date;
  lastSyncAt?: Date;
}

interface HealthMetrics {
  userId: string;
  timestamp: Date;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  bloodOxygen?: number;
  temperature?: number;
  steps?: number;
  calories?: number;
  sleepDuration?: number;
  stressLevel?: number;
}

interface HealthAlert {
  id: string;
  userId: string;
  type: 'high-heart-rate' | 'low-oxygen' | 'high-blood-pressure' | 'irregular-rhythm';
  severity: 'low' | 'medium' | 'high';
  value: number;
  threshold: number;
  timestamp: Date;
  notified: boolean;
}

export class WearableIntegrationService {
  private devices: Map<string, WearableDevice> = new Map();
  private healthMetrics: HealthMetrics[] = [];
  private healthAlerts: HealthAlert[] = [];

  /**
   * Connect wearable device
   */
  async connectDevice(
    userId: string,
    type: 'apple-watch' | 'fitbit' | 'garmin',
    accessToken: string,
    refreshToken?: string
  ): Promise<WearableDevice> {
    const device: WearableDevice = {
      id: `device_${Date.now()}`,
      userId,
      type,
      deviceId: `${type}_${userId}`,
      accessToken,
      refreshToken,
      connectedAt: new Date(),
    };

    this.devices.set(device.id, device);

    // Start syncing health data
    await this.syncHealthData(device);

    return device;
  }

  /**
   * Disconnect wearable device
   */
  async disconnectDevice(deviceId: string): Promise<boolean> {
    return this.devices.delete(deviceId);
  }

  /**
   * Sync health data from wearable
   */
  async syncHealthData(device: WearableDevice): Promise<HealthMetrics[]> {
    try {
      const metrics = await this.fetchHealthMetrics(device);
      
      // Store metrics in database
      for (const metric of metrics) {
        this.healthMetrics.push(metric);
        
        // Check for health alerts
        await this.checkHealthAlerts(metric);
      }

      // Update last sync time
      device.lastSyncAt = new Date();

      return metrics;
    } catch (error) {
      console.error(`Error syncing health data from ${device.type}:`, error);
      return [];
    }
  }

  /**
   * Fetch health metrics from wearable API
   */
  private async fetchHealthMetrics(device: WearableDevice): Promise<HealthMetrics[]> {
    try {
      let apiUrl = '';
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${device.accessToken}`,
        'Content-Type': 'application/json',
      };

      switch (device.type) {
        case 'apple-watch':
          apiUrl = 'https://api.apple.com/health/data';
          break;
        case 'fitbit':
          apiUrl = 'https://api.fitbit.com/1/user/-/activities/date/today.json';
          break;
        case 'garmin':
          apiUrl = 'https://connect.garmin.com/wellness-sdk/rest/garmenwellness/lastsevendays';
          break;
      }

      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Wearable API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseHealthMetrics(device.userId, device.type, data);
    } catch (error) {
      console.error(`Error fetching metrics from ${device.type}:`, error);
      return [];
    }
  }

  /**
   * Parse health metrics based on device type
   */
  private parseHealthMetrics(userId: string, deviceType: string, data: any): HealthMetrics[] {
    const metrics: HealthMetrics[] = [];

    switch (deviceType) {
      case 'apple-watch':
        metrics.push({
          userId,
          timestamp: new Date(),
          heartRate: data.heartRate,
          bloodOxygen: data.bloodOxygen,
          temperature: data.temperature,
          stressLevel: data.stressLevel,
        });
        break;

      case 'fitbit':
        metrics.push({
          userId,
          timestamp: new Date(),
          heartRate: data.activities?.[0]?.heartRateZones?.[0]?.caloriesOut,
          steps: data.summary?.steps,
          calories: data.summary?.caloriesBurned,
          sleepDuration: data.sleep?.[0]?.duration,
        });
        break;

      case 'garmin':
        metrics.push({
          userId,
          timestamp: new Date(),
          heartRate: data.heartRate,
          bloodPressure: data.bloodPressure ? {
            systolic: data.bloodPressure.systolic,
            diastolic: data.bloodPressure.diastolic,
          } : undefined,
          steps: data.steps,
          sleepDuration: data.sleepData?.sleepDuration,
          stressLevel: data.stressLevel,
        });
        break;
    }

    return metrics;
  }

  /**
   * Check for health alerts
   */
  private async checkHealthAlerts(metrics: HealthMetrics): Promise<void> {
    const alerts: HealthAlert[] = [];

    // Check heart rate
    if (metrics.heartRate && metrics.heartRate > 100) {
      alerts.push({
        id: `alert_${Date.now()}`,
        userId: metrics.userId,
        type: 'high-heart-rate',
        severity: metrics.heartRate > 120 ? 'high' : 'medium',
        value: metrics.heartRate,
        threshold: 100,
        timestamp: metrics.timestamp,
        notified: false,
      });
    }

    // Check blood oxygen
    if (metrics.bloodOxygen && metrics.bloodOxygen < 95) {
      alerts.push({
        id: `alert_${Date.now()}`,
        userId: metrics.userId,
        type: 'low-oxygen',
        severity: metrics.bloodOxygen < 90 ? 'high' : 'medium',
        value: metrics.bloodOxygen,
        threshold: 95,
        timestamp: metrics.timestamp,
        notified: false,
      });
    }

    // Check blood pressure
    if (metrics.bloodPressure && metrics.bloodPressure.systolic > 140) {
      alerts.push({
        id: `alert_${Date.now()}`,
        userId: metrics.userId,
        type: 'high-blood-pressure',
        severity: 'high',
        value: metrics.bloodPressure.systolic,
        threshold: 140,
        timestamp: metrics.timestamp,
        notified: false,
      });
    }

    // Store alerts and notify user
    for (const alert of alerts) {
      this.healthAlerts.push(alert);
      await this.notifyHealthAlert(alert);
    }
  }

  /**
   * Notify user of health alert
   */
  private async notifyHealthAlert(alert: HealthAlert): Promise<void> {
    console.log(`Health alert for user ${alert.userId}:`, alert.type, alert.value);
    
    // This would integrate with push notifications service
    // to alert the user and their healthcare provider
  }

  /**
   * Get health metrics for user
   */
  async getUserHealthMetrics(userId: string, days: number = 7): Promise<HealthMetrics[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return this.healthMetrics.filter(
      metric => metric.userId === userId && metric.timestamp >= cutoffDate
    );
  }

  /**
   * Get health alerts for user
   */
  async getUserHealthAlerts(userId: string): Promise<HealthAlert[]> {
    return this.healthAlerts.filter(alert => alert.userId === userId);
  }

  /**
   * Get user's connected devices
   */
  async getUserDevices(userId: string): Promise<WearableDevice[]> {
    return Array.from(this.devices.values()).filter(device => device.userId === userId);
  }

  /**
   * Generate health report for consultation
   */
  async generateHealthReport(userId: string, days: number = 30): Promise<any> {
    const metrics = await this.getUserHealthMetrics(userId, days);
    const alerts = await this.getUserHealthAlerts(userId);

    if (metrics.length === 0) {
      return null;
    }

    const avgHeartRate = metrics.reduce((sum, m) => sum + (m.heartRate || 0), 0) / metrics.length;
    const avgBloodOxygen = metrics.reduce((sum, m) => sum + (m.bloodOxygen || 0), 0) / metrics.length;
    const totalSteps = metrics.reduce((sum, m) => sum + (m.steps || 0), 0);
    const avgSleep = metrics.reduce((sum, m) => sum + (m.sleepDuration || 0), 0) / metrics.length;

    return {
      userId,
      period: `Last ${days} days`,
      metrics: {
        averageHeartRate: Math.round(avgHeartRate),
        averageBloodOxygen: Math.round(avgBloodOxygen),
        totalSteps,
        averageSleepHours: Math.round(avgSleep / 60),
      },
      alerts: alerts.length,
      recommendation: this.generateHealthRecommendation({
        heartRate: avgHeartRate,
        bloodOxygen: avgBloodOxygen,
        steps: totalSteps / days,
        sleep: avgSleep / 60,
      }),
    };
  }

  /**
   * Generate health recommendation based on metrics
   */
  private generateHealthRecommendation(metrics: any): string {
    const recommendations: string[] = [];

    if (metrics.heartRate > 100) {
      recommendations.push('Seu ritmo cardíaco está elevado. Considere atividades de relaxamento.');
    }

    if (metrics.bloodOxygen < 95) {
      recommendations.push('Seu nível de oxigênio está baixo. Consulte um profissional de saúde.');
    }

    if (metrics.steps < 5000) {
      recommendations.push('Você está menos ativo. Tente aumentar sua atividade física diária.');
    }

    if (metrics.sleep < 7) {
      recommendations.push('Você está dormindo menos de 7 horas. Melhore sua higiene do sono.');
    }

    return recommendations.length > 0 
      ? recommendations.join(' | ')
      : 'Seus indicadores de saúde estão bons. Continue assim!';
  }

  /**
   * Get wearable integration statistics
   */
  async getWearableStatistics(): Promise<{
    totalConnectedDevices: number;
    devicesByType: Record<string, number>;
    activeUsers: number;
    lastSyncCount: number;
  }> {
    const devicesByType: Record<string, number> = {
      'apple-watch': 0,
      'fitbit': 0,
      'garmin': 0,
    };

    let activeUsers = 0;
    let lastSyncCount = 0;

    const devicesArray = Array.from(this.devices.values());
    for (const device of devicesArray) {
      devicesByType[device.type]++;
      if (device.lastSyncAt && Date.now() - device.lastSyncAt.getTime() < 24 * 60 * 60 * 1000) {
        lastSyncCount++;
      }
    }

    const uniqueUsers = new Set<string>();
    for (const device of Array.from(this.devices.values())) {
      uniqueUsers.add(device.userId);
    }
    activeUsers = uniqueUsers.size;

    return {
      totalConnectedDevices: this.devices.size,
      devicesByType,
      activeUsers,
      lastSyncCount,
    };
  }
}

export const wearableIntegrationService = new WearableIntegrationService();
