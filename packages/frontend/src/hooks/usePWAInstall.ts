import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      console.log("[PWA] Already installed (standalone mode)");
      setIsInstalled(true);
      return;
    }

    console.log("[PWA] Registering beforeinstallprompt listener");

    const handler = (e: Event) => {
      console.log("[PWA] beforeinstallprompt fired");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      console.log("[PWA] App installed successfully");
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener("appinstalled", installedHandler);

    navigator.serviceWorker?.ready.then((reg) => {
      console.log("[PWA] SW ready, scope:", reg.scope);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    console.log("[PWA] Showing install prompt");
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    console.log("[PWA] Install prompt result:", result.outcome);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    canInstall: deferredPrompt !== null,
    triggerInstall,
    isInstalled,
  };
}
