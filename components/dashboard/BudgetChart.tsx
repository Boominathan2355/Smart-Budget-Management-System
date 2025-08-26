import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function BudgetChart() {
  const budgetData = {
    allocated: 5000000, // ₹50L
    utilized: 2800000,  // ₹28L
    pending: 450000,    // ₹4.5L
    remaining: 1750000, // ₹17.5L
  };

  const utilizationPercentage = (budgetData.utilized / budgetData.allocated) * 100;
  const pendingPercentage = (budgetData.pending / budgetData.allocated) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Department Budget Overview</Text>
      
      <View style={styles.chartContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${utilizationPercentage}%`,
                  backgroundColor: '#10b981'
                }
              ]} 
            />
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${pendingPercentage}%`,
                  backgroundColor: '#f59e0b',
                  left: `${utilizationPercentage}%`
                }
              ]} 
            />
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Utilized</Text>
            <Text style={styles.legendValue}>₹{(budgetData.utilized / 100000).toFixed(1)}L</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Pending</Text>
            <Text style={styles.legendValue}>₹{(budgetData.pending / 100000).toFixed(1)}L</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e5e7eb' }]} />
            <Text style={styles.legendText}>Remaining</Text>
            <Text style={styles.legendValue}>₹{(budgetData.remaining / 100000).toFixed(1)}L</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Annual Budget</Text>
          <Text style={styles.summaryAmount}>₹{(budgetData.allocated / 100000)}L</Text>
          <Text style={styles.summaryPercentage}>
            {utilizationPercentage.toFixed(1)}% utilized
          </Text>
        </View>
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
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    position: 'absolute',
    top: 0,
    borderRadius: 4,
  },
  legend: {
    gap: 12,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summary: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  summaryPercentage: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 2,
  },
});