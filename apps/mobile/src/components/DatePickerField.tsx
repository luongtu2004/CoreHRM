import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

export default function DatePickerField({
  label,
  value,
  onChange,
  required = false,
  minDate,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  minDate?: string;
}) {
  const [show, setShow] = useState(false);

  const fmtDisplay = (v: string) => {
    if (!v) return 'YYYY-MM-DD';
    try {
      return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return v;
    }
  };

  const currentDate = value ? new Date(value) : new Date();

  const handleNativeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>
          {label}{required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={styles.inputWrap}>
          <Calendar size={16} color="#94a3b8" />
          {/* @ts-ignore */}
          <input
            type="date"
            value={value}
            min={minDate || new Date().toISOString().split('T')[0]}
            onChange={(e: any) => onChange(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: value ? '#1e293b' : '#94a3b8',
              backgroundColor: 'transparent',
              marginLeft: 8,
              cursor: 'pointer',
              fontFamily: 'inherit',
            } as any}
          />
        </View>
      </View>
    );
  }

  // Native fallback — DateTimePicker
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity 
        style={styles.inputWrap} 
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Calendar size={16} color="#94a3b8" />
        <Text style={[styles.nativeInput, !value && { color: '#94a3b8' }]}>
          {fmtDisplay(value)}
        </Text>
      </TouchableOpacity>

      {show && (
        <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
          {Platform.OS === 'ios' && (
            <View style={styles.iosHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.iosDoneText}>Xong</Text>
              </TouchableOpacity>
            </View>
          )}
          <DateTimePicker
            value={currentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minDate ? new Date(minDate) : undefined}
            onChange={handleNativeChange}
            textColor="#1e293b"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  required: { color: '#ef4444' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  nativeInput: { flex: 1, fontSize: 15, color: '#1e293b', marginLeft: 8 },
  iosPickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iosDoneText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 15,
  }
});
