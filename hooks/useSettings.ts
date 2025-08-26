import { useState, useEffect } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  language: string;
  currency: string;
}

const defaultSettings: Settings = {
  theme: 'system',
  notificationsEnabled: true,
  biometricEnabled: false,
  language: 'en',
  currency: 'INR'
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const storedSettings = await AsyncStorage.getItem('user_settings');
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
      setError(null);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem('user_settings', JSON.stringify(updatedSettings));
      setSettings(updatedSettings);

      // Sync with server
      await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  };

  // Subscribe to real-time settings updates
  useRealtimeUpdates('settings_updated', (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  });

  return {
    settings,
    loading,
    error,
    updateSettings
  };
}
