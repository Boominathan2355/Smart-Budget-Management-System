import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { DollarSign } from 'lucide-react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function AmountInput({ value, onChangeText }: AmountInputProps) {
  const formatAmount = (text: string) => {
    // Remove non-numeric characters except decimal point
    const numericText = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericText.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return numericText;
  };

  const handleAmountChange = (text: string) => {
    const formattedText = formatAmount(text);
    onChangeText(formattedText);
  };

  const displayAmount = value ? `₹${parseFloat(value).toLocaleString('en-IN')}` : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Request Amount *</Text>
      
      <View style={styles.inputContainer}>
        <View style={styles.iconContainer}>
          <DollarSign size={20} color="#6b7280" />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={value}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
        />
      </View>
      
      {value && (
        <Text style={styles.formattedAmount}>
          {displayAmount}
        </Text>
      )}
      
      <Text style={styles.hint}>
        Enter the exact amount you need for this request
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  iconContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  formattedAmount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 8,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});