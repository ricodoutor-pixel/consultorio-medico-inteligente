export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
    url?: string;
    hostname?: string;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: "br.com.plantayraiz.app",
  appName: "Planta y Raiz",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    cleartext: false,
    hostname: "plantayraiz.com.br",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#06150d",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    Camera: {
      // Configuração para captura clínica e triagem rPPG
      permissions: ["camera", "photos"],
    },
    BiometricAuth: {
      allowDeviceCredential: true,
      reason: "Autenticação biométrica para acesso seguro ao prontuário médico (LGPD)",
      title: "Planta y Raiz Segurança Clínica",
    },
    DeepLinks: {
      schemes: ["plantayraiz"],
      hosts: ["plantayraiz.com.br", "www.plantayraiz.com.br"],
    },
  },
};

export default config;
