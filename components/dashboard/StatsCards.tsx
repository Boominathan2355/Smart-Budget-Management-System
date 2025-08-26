import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Clock, CircleCheck as CheckCircle, TrendingUp } from 'lucide-react-native';
import { createBoxShadow } from '../../utils/shadow';
import { useStatsData } from '../../hooks/useStatsData';

export function StatsCards() {
  const { totalRequests, pendingRequests, approvedRequests, totalBudget } = useStatsData();
  
  const stats = [
    {
      id: '1',
      title: 'Total Requests',
      value: totalRequests.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: FileText,
      color: '#3b82f6',
    },
    {
      id: '2',
      title: 'Pending Approval',
      value: pendingRequests.toString(),
      change: '-5%',
      changeType: 'negative',
      icon: Clock,
      color: '#f59e0b',
    },
    {
      id: '3',
      title: 'Approved',
      value: approvedRequests.toString(),
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      id: '4',
      title: 'Budget Utilized',
      value: `₹${(totalBudget / 100000).toFixed(1)}L`,
      change: '+15%',
      changeType: 'positive',
      icon: TrendingUp,
      color: '#8b5cf6',
    },
  ];

  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <TouchableOpacity 
          key={stat.id}
          style={[
            styles.card,
            index % 2 === 0 ? styles.cardLeft : styles.cardRight
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
            <stat.icon size={24} color={stat.color} />
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.cardValue}>{stat.value}</Text>
            <Text style={styles.cardTitle}>{stat.title}</Text>
            <View style={styles.changeContainer}>
              <Text 
                style={[
                  styles.changeText,
                  stat.changeType === 'positive' ? styles.changePositive : styles.changeNegative
                ]}
              >
                {stat.change}
              </Text>
              <Text style={styles.changePeriod}>vs last month</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: '47%',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardLeft: {
    marginRight: 6,
  },
  cardRight: {
    marginLeft: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardContent: {
    gap: 2,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changePositive: {
    color: '#10b981',
  },
  changeNegative: {
    color: '#ef4444',
  },
  changePeriod: {
    fontSize: 12,
    color: '#9ca3af',
  },
});