"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { Download, Share, PlusSquare, Smartphone, Check, X, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<void>;
  showIosModal: boolean;
  setShowIosModal: (show: boolean) => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  isInstallable: false,
  isIOS: false,
  promptInstall: async () => {},
  showIosModal: false,
  setShowIosModal: () => {},
});

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New update available
                  console.log("[PWA] New version available");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration failed:", err);
        });
    }

    // 2. Check if already installed / standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    if (isAppleDevice && !isStandalone) {
      setIsInstallable(true);
    }

    // 4. Capture beforeinstallprompt for Chrome / Android / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("GoFare installed! Added to your home screen.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (isInstalled) {
      toast.info("GoFare is already installed on your device!");
      return;
    }

    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("Installing GoFare to your device...");
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      // Fallback instruction if browser doesn't support automatic prompt
      setShowIosModal(true);
    }
  }

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        isInstallable,
        isIOS,
        promptInstall,
        showIosModal,
        setShowIosModal,
      }}
    >
      {children}
      <IosInstallModal isOpen={showIosModal} onClose={() => setShowIosModal(false)} isIOS={isIOS} />
    </PwaContext.Provider>
  );
}

// ---------------------------------------------------------
// Install App Button (used in Navbar, Headers, or Footers)
// ---------------------------------------------------------
export function InstallAppButton({ className = "" }: { className?: string }) {
  const { isInstalled, promptInstall } = usePwa();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs opacity-90 ${className}`}
        aria-label="Install GoFare App"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 ${className}`}
        title="GoFare is running as an installed app"
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        <span>Installed</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => promptInstall()}
      className={`inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-600 ${className}`}
      aria-label="Install GoFare App"
    >
      <Download className="h-3.5 w-3.5" />
      <span>Install App</span>
    </button>
  );
}

// ---------------------------------------------------------
// Mobile Banner (prompts users at the bottom of the screen)
// ---------------------------------------------------------
export function MobileInstallBanner() {
  const { isInstalled, promptInstall } = usePwa();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Only show if not installed and not dismissed in the current session
    const isDismissed = sessionStorage.getItem("gofare-pwa-dismissed");
    if (!isDismissed && !isInstalled) {
      setDismissed(false);
    }
  }, [isInstalled]);

  if (!mounted || dismissed || isInstalled) return null;

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("gofare-pwa-dismissed", "1");
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm animate-fade-up">
      <div className="relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-xs">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Install GoFare App</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Fast, fullscreen & works offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => promptInstall()}
            className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-700 active:scale-95 dark:bg-brand-500"
          >
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// iOS & Manual Installation Instruction Modal
// ---------------------------------------------------------
function IosInstallModal({
  isOpen,
  onClose,
  isIOS,
}: {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Install GoFare on your phone</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install as a native Progressive Web App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isIOS ? (
          /* iOS Step-by-Step Instructions */
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-sm dark:bg-brand-950/60 dark:text-brand-400">
                1
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-white">Tap the Share button</p>
                <p className="mt-0.5">
                  At the bottom bar in Safari, tap the <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200"><Share className="h-3 w-3 mr-1 inline" /> Share</span> icon.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-sm dark:bg-brand-950/60 dark:text-brand-400">
                2
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-white">Choose "Add to Home Screen"</p>
                <p className="mt-0.5">
                  Scroll down the share options and tap <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-semibold text-slate-800 dark:text-slate-200"><PlusSquare className="h-3 w-3 mr-1 inline" /> Add to Home Screen</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-sm dark:bg-brand-950/60 dark:text-brand-400">
                3
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-medium text-slate-900 dark:text-white">Confirm by tapping "Add"</p>
                <p className="mt-0.5">
                  Tap <span className="font-semibold text-brand-600 dark:text-brand-400">Add</span> in the top right corner. The app icon will appear directly on your home screen!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <span className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                <ArrowDown className="h-3.5 w-3.5 mr-1 animate-bounce" /> Tap Safari share bar below
              </span>
            </div>
          </div>
        ) : (
          /* General Android / Desktop Instructions */
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-medium text-slate-900 dark:text-white">To install on Android or Desktop:</p>
              <p>1. Open your browser menu (the three dots <span className="font-bold">⋮</span> in Chrome or Edge).</p>
              <p>2. Select <span className="font-semibold text-brand-600 dark:text-brand-400">"Install app"</span> or <span className="font-semibold text-brand-600 dark:text-brand-400">"Add to Home screen"</span>.</p>
              <p>3. Confirm the prompt to launch GoFare in full-screen standalone mode!</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
