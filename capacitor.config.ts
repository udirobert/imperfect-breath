import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "fun.imperfectform.brume",
  appName: "Brume",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    Camera: {
      permissions: ["camera"],
    },
    Device: {
      permissions: ["camera"],
    },
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#0f172a",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0f172a",
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    scheme: "Imperfect Breath",
  },
};

export default config;
