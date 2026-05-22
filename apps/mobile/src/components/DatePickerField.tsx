import { Platform, View, Text, StyleSheet, TextInput } from 'react-native';
import { Calendar } from 'lucide-react-native';

/**
 * DatePickerField — hoạt động trên cả Web (input type=date) và Native (TextInput)
 * Props:
 *   label: string
 *   value: string (YYYY-MM-DD)
 *   onChange: (val: string) => void
 *   required?: boolean
 *   minDate?: string (YYYY-MM-DD)
 */
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
  const fmtDisplay = (v: string) => {
    if (!v) return '';
    try {
      return new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return v;
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
          {/* @ts-ignore — web only */}
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

  // Native fallback — TextInput với gợi ý
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputWrap}>
        <Calendar size={16} color="#94a3b8" />
        <TextInput
          style={styles.nativeInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
        />
      </View>
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
});
