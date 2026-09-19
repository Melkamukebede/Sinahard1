import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  setDailyReminder: (enabled: boolean, time: string) => void;
  alerts: InAppAlert[];
  unreadAlertsCount: number;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  notifyExamCompleted: (examTitle: string, score: number, total: number, percentage: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    return isSupported ? Notification.permission : 'denied';
  });

  const [dailyReminderEnabled, setDailyReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('study_reminder_enabled') === 'true';
  });

  const [dailyReminderTime, setDailyReminderTime] = useState<string>(() => {
    return localStorage.getItem('study_reminder_time') || '18:00';
  });

  const [alerts, setAlerts] = useState<InAppAlert[]>(() => {
    const saved = localStorage.getItem('app_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'welcome-alert',
        title: 'Welcome to Sinahard Pro!',
        body: 'Prepare for tests with interactive practice, step-by-step LaTeX math explanations, and AI prompt tools.',
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('app_alerts', JSON.stringify(alerts.slice(0, 20)));
  }, [alerts]);

  const addInAppAlert = useCallback((title: string, body: string, type: InAppAlert['type'] = 'info') => {
    const newAlert: InAppAlert = {
      id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title,
      body,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        new Notification('Sinahard Pro', {
          body: 'Push notifications activated! We will notify you about study reminders and test results.',
          icon: '/favicon.ico',
        });
        addInAppAlert('Notifications Activated', 'You will now receive study reminders and exam updates.', 'success');
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Could not request notification permission:', err);
      return false;
    }
  };

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      // Always add to in-app notification center
      addInAppAlert(title, options?.body || '', 'info');

      // Send browser push notification if permitted
      if (isSupported && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options,
          });
        } catch (err) {
          console.warn('Browser notification error:', err);
        }
      }
    },
    [isSupported, addInAppAlert]
  );

  const notifyExamCompleted = useCallback(
    (examTitle: string, score: number, total: number, percentage: number) => {
      const isPassed = percentage >= 70;
      const title = isPassed ? `🎉 Passed: ${examTitle}!` : `Exam Completed: ${examTitle}`;
      const body = `You scored ${score}/${total} (${percentage}%). ${
        isPassed ? 'Outstanding work! Keep up the momentum!' : 'Review your incorrect answers to improve your score!'
      }`;
      const type: InAppAlert['type'] = isPassed ? 'success' : 'warning';

      addInAppAlert(title, body, type);

      if (isSupported && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }
      }
    },
    [isSupported, addInAppAlert]
  );

  const setDailyReminder = (enabled: boolean, time: string) => {
    setDailyReminderEnabled(enabled);
    setDailyReminderTime(time);
    localStorage.setItem('study_reminder_enabled', String(enabled));
    localStorage.setItem('study_reminder_time', time);

    if (enabled) {
      addInAppAlert(
        'Study Reminder Configured',
        `Daily reminder set for ${time}. Time to stay consistent!`,
        'reminder'
      );
      if (isSupported && Notification.permission !== 'granted') {
        requestPermission();
      }
    }
  };

  // Background check for daily reminder
  useEffect(() => {
    if (!dailyReminderEnabled) return;

    const checkReminder = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      const lastSentDate = localStorage.getItem('last_reminder_sent_date');
      const todayStr = now.toDateString();

      if (currentTime === dailyReminderTime && lastSentDate !== todayStr) {
        localStorage.setItem('last_reminder_sent_date', todayStr);
        sendNotification('Time for Daily Practice! 📚', {
          body: "Stay on track for your exams. Take a 10-minute quiz on Sinahard Pro today!",
        });
      }
    };

    const interval = setInterval(checkReminder, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [dailyReminderEnabled, dailyReminderTime, sendNotification]);

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isSupported,
        requestPermission,
        sendNotification,
        dailyReminderEnabled,
        dailyReminderTime,
        setDailyReminder,
        alerts,
        unreadAlertsCount,
        markAlertAsRead,
        clearAllAlerts,
        notifyExamCompleted,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
