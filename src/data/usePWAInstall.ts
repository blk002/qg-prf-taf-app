import { useCallback, useEffect, useState } from 'react';
import { formatLocalIsoDate } from '../domain/weeklyPlannerEngine';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const REMINDER_ENABLED_KEY = 'qg_prf_taf_reminder_enabled_v1';
const REMINDER_LAST_FIRED_KEY = 'qg_prf_taf_reminder_last_date_v1';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useTrainingReminders(
  preferredStartMin: number,
  todayWorkoutTitle: string | null,
  isDoneToday: boolean
) {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(() =>
    isSupported ? Notification.permission : 'denied'
  );

  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(REMINDER_ENABLED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const fireNotification = useCallback(
    (title: string, body: string) => {
      if (!isSupported || Notification.permission !== 'granted') return false;
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'qg-prf-taf-reminder',
        });
        return true;
      } catch {
        return false;
      }
    },
    [isSupported]
  );

  const toggleEnabled = useCallback(async () => {
    if (!isSupported) return { ok: false, message: 'Notificações não suportadas neste navegador.' };

    if (enabled) {
      setEnabled(false);
      try {
        localStorage.setItem(REMINDER_ENABLED_KEY, 'false');
      } catch {
        // ignore
      }
      return { ok: true, message: 'Lembretes diários desativados.' };
    }

    let currentPerm = Notification.permission;
    if (currentPerm === 'default') {
      currentPerm = await Notification.requestPermission();
      setPermission(currentPerm);
    }

    if (currentPerm !== 'granted') {
      return {
        ok: false,
        message: 'Permissão de notificação negada. Libere nas configurações do navegador.',
      };
    }

    setEnabled(true);
    try {
      localStorage.setItem(REMINDER_ENABLED_KEY, 'true');
    } catch {
      // ignore
    }
    return { ok: true, message: 'Lembrete diário ativado no seu horário preferencial.' };
  }, [enabled, isSupported]);

  const sendTestReminder = useCallback(() => {
    if (!isSupported) return { ok: false, message: 'Notificações não suportadas neste navegador.' };
    if (Notification.permission !== 'granted') {
      return { ok: false, message: 'Ative os lembretes primeiro para conceder permissão.' };
    }
    const ok = fireNotification(
      'QG da PRF • Hora do Treino',
      todayWorkoutTitle
        ? `Sessão prevista de hoje: ${todayWorkoutTitle}. Bora pontuar no TAF!`
        : 'Mantenha a constância no seu preparo físico para o TAF da PRF.'
    );
    return ok
      ? { ok: true, message: 'Lembrete de teste enviado.' }
      : { ok: false, message: 'Não foi possível disparar a notificação neste ambiente.' };
  }, [fireNotification, isSupported, todayWorkoutTitle]);

  useEffect(() => {
    if (!enabled || !isSupported || permission !== 'granted' || isDoneToday) return;

    const checkSchedule = () => {
      const now = new Date();
      const todayIso = formatLocalIsoDate(now);
      const nowMin = now.getHours() * 60 + now.getMinutes();

      try {
        if (localStorage.getItem(REMINDER_LAST_FIRED_KEY) === todayIso) return;
      } catch {
        return;
      }

      // Fire within a 30-minute window from the preferred start time
      if (nowMin >= preferredStartMin && nowMin <= preferredStartMin + 30 && todayWorkoutTitle) {
        const sent = fireNotification(
          'QG da PRF • Lembrete de Treino',
          `Hoje é dia de ${todayWorkoutTitle}. Abra o QG para iniciar.`
        );
        if (sent) {
          try {
            localStorage.setItem(REMINDER_LAST_FIRED_KEY, todayIso);
          } catch {
            // ignore
          }
        }
      }
    };

    checkSchedule();
    const id = window.setInterval(checkSchedule, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, fireNotification, isDoneToday, isSupported, permission, preferredStartMin, todayWorkoutTitle]);

  return {
    isSupported,
    permission,
    enabled,
    toggleEnabled,
    sendTestReminder,
  };
}
