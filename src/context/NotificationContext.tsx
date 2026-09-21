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
  // Study Target & Streak metrics
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
  completedToday: number;
  studyStreakDays: number;
  alerts: InAppAlert[];
  unreadAlertsCount: number;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  notifyExamCompleted: (examTitle: string, score: number, total: number, percentage: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupported = false; // Background browser push replaced with lightweight in-app notifications
  const permission: NotificationPermission = 'default';

  // Daily Study Target (default: 2 exams per day)
  const [dailyGoal, setDailyGoalState] = useState<number>(() => {
    const saved = localStorage.getItem('study_daily_goal');
    return saved ? Math.max(1, Number(saved) || 2) : 2;
  });

  const setDailyGoal = (goal: number) => {
    const valid = Math.max(1, Math.min(10, goal));
    setDailyGoalState(valid);
    localStorage.setItem('study_daily_goal', String(valid));
  };

  // Completed Today & Streak
  const [completedToday, setCompletedToday] = useState<number>(() => {
    const lastDate = localStorage.getItem('study_last_completed_date');
    const todayStr = new Date().toDateString();
    if (lastDate === todayStr) {
      return Number(localStorage.getItem('study_today_count') || 0);
    }
    return 0;
  });

  const [studyStreakDays, setStudyStreakDays] = useState<number>(() => {
    return Math.max(1, Number(localStorage.getItem('study_streak_days') || 1));
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
    addInAppAlert('In-App Alerts Active', 'Study reminders and test score updates appear in your alerts center.', 'success');
    return true;
  };

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      addInAppAlert(title, options?.body || '', 'info');
    },
    [addInAppAlert]
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

      // Update today's completed count
      const todayStr = new Date().toDateString();
      const lastDate = localStorage.getItem('study_last_completed_date');
      let newCount = 1;
      if (lastDate === todayStr) {
        newCount = Number(localStorage.getItem('study_today_count') || 0) + 1;
      }
      localStorage.setItem('study_last_completed_date', todayStr);
      localStorage.setItem('study_today_count', String(newCount));
      setCompletedToday(newCount);

      // Check streak
      if (lastDate !== todayStr) {
        const streak = Number(localStorage.getItem('study_streak_days') || 0) + 1;
        localStorage.setItem('study_streak_days', String(streak));
        setStudyStreakDays(streak);
      }
    },
    [addInAppAlert]
  );

  const setDailyReminder = (enabled: boolean, time: string) => {
    setDailyReminderEnabled(enabled);
    setDailyReminderTime(time);
    localStorage.setItem('study_reminder_enabled', String(enabled));
    localStorage.setItem('study_reminder_time', time);

    if (enabled) {
      addInAppAlert(
        'Study Reminder Configured',
        `Daily target scheduled for ${time}. Time to stay consistent!`,
        'reminder'
      );
    }
  };

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
        dailyGoal,
        setDailyGoal,
        completedToday,
        studyStreakDays,
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
