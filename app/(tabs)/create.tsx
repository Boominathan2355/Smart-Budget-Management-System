import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, DollarSign, Calendar, FileText } from 'lucide-react-native';
import { CameraModal } from '@/components/create/CameraModal';
import { AmountInput } from '@/components/create/AmountInput';
import { CategoryPicker } from '@/components/create/CategoryPicker';
import { DatePicker } from '@/components/create/DatePicker';
import { DocumentUpload } from '@/components/create/DocumentUpload';

export default function CreateRequestScreen() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    expectedDate: new Date(),
    justification: '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  const categories = [
    'Equipment',
    'Supplies', 
    'Services',
    'Travel',
    'Training',
    'Maintenance',
    'Other'
  ];

  const handleSubmit = () => {
    // Validation logic
    if (!formData.title || !formData.amount || !formData.category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Submit request logic
    Alert.alert('Success', 'Budget request submitted successfully!');
  };

  const handleCameraCapture = (imageUri: string) => {
    setAttachments([...attachments, { type: 'image', uri: imageUri }]);
    setShowCamera(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Budget Request</Text>
        <Text style={styles.headerSubtitle}>Fill in the details for your budget request</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Request Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter a descriptive title"
            value={formData.title}
            onChangeText={(text) => setFormData({...formData, title: text})}
          />
        </View>

        {/* Amount Input */}
        <AmountInput
          value={formData.amount}
          onChangeText={(amount) => setFormData({...formData, amount})}
        />

        {/* Category Picker */}
        <CategoryPicker
          categories={categories}
          selectedCategory={formData.category}
          onSelectCategory={(category) => setFormData({...formData, category})}
        />

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide detailed description of the request"
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Justification Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Justification</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain why this request is necessary"
            value={formData.justification}
            onChangeText={(text) => setFormData({...formData, justification: text})}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Expected Date */}
        <DatePicker
          selectedDate={formData.expectedDate}
          onDateChange={(date) => setFormData({...formData, expectedDate: date})}
        />

        {/* Document Upload Section */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Supporting Documents</Text>
          <View style={styles.uploadSection}>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => setShowCamera(true)}
            >
              <Camera size={24} color="#2563eb" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton}>
              <Upload size={24} color="#2563eb" />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attachments List */}
        <DocumentUpload
          attachments={attachments}
          onRemoveAttachment={(index) => {
            setAttachments(attachments.filter((_, i) => i !== index));
          }}
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>
      </ScrollView>

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadSection: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});