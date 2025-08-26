import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, FileText, Users, ChartBar as BarChart3 } from 'lucide-react-native';
import { router } from 'expo-router';

export function QuickActions() {
  const actions = [
    {
      id: '1',
      title: 'New Request',
      subtitle: 'Create budget request',
      icon: Plus,
      color: '#3b82f6',
      onPress: () => router.push('/(tabs)/create'),
    },
    {
      id: '2',
      title: 'My Requests',
      subtitle: 'Track your requests',
      icon: FileText,
      color: '#10b981',
      onPress: () => router.push('/(tabs)/requests'),
    },
    {
      id: '3',
      title: 'Approvals',
      subtitle: 'Pending approvals',
      icon: Users,
      color: '#f59e0b',
      onPress: () => router.push('/(tabs)/approvals'),
    },
    {
      id: '4',
      title: 'Reports',
      subtitle: 'View analytics',
      icon: BarChart3,
      color: '#8b5cf6',
      onPress: () => console.log('Reports'),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity 
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
              <action.icon size={24} color={action.color} />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 2,
  },
});