import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, Globe, Moon, Download, CircleHelp as HelpCircle, LogOut, ChevronRight, FileText } from 'lucide-react-native';
import { useSettings } from '../../hooks/useSettings';

export default function SettingsScreen() {
  const { settings, updateSettings, loading } = useSettings();

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  const settingSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile Settings',
          value: '',
          onPress: () => console.log('Profile settings'),
        },
        {
          icon: Shield,
          label: 'Security & Privacy',
          value: '',
          onPress: () => console.log('Security settings'),
        },
      ],
    },
    {
      title: 'App Preferences',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          value: settings.notificationsEnabled,
          onPress: () => updateSettings({ notificationsEnabled: !settings.notificationsEnabled }),
          type: 'switch',
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          value: settings.theme === 'dark',
          onPress: () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
          type: 'switch',
        },
        {
          icon: Shield,
          label: 'Biometric Login',
          value: settings.biometricEnabled,
          onPress: () => updateSettings({ biometricEnabled: !settings.biometricEnabled }),
          type: 'switch',
        },
        {
          icon: Globe,
          label: 'Language',
          value: settings.language === 'en' ? 'English' : settings.language.toUpperCase(),
          onPress: () => updateSettings({ language: settings.language === 'en' ? 'hi' : 'en' }),
        },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        {
          icon: Download,
          label: 'Download Reports',
          value: '',
          onPress: () => console.log('Download reports'),
        },
        {
          icon: Download,
          label: 'Sync Data',
          value: '',
          onPress: () => console.log('Sync data'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          value: '',
          onPress: () => console.log('Help'),
        },
        {
          icon: FileText,
          label: 'Terms & Privacy',
          value: '',
          onPress: () => console.log('Terms'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => (
    <TouchableOpacity 
      key={item.label}
      style={styles.settingItem}
      onPress={item.onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIcon}>
          <item.icon size={20} color="#6b7280" />
        </View>
        <Text style={styles.settingLabel}>{item.label}</Text>
      </View>
      
      <View style={styles.settingItemRight}>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onPress}
            trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
            thumbColor={item.value ? '#ffffff' : '#f3f4f6'}
          />
        ) : (
          <>
            {item.value ? (
              <Text style={styles.settingValue}>{item.value}</Text>
            ) : null}
            <ChevronRight size={16} color="#9ca3af" />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Smart Budget v1.0.0</Text>
          <Text style={styles.versionSubtext}>Built for Educational Excellence</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  versionInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});