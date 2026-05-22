import { useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import {
  DollarSign, Calendar, TrendingUp, TrendingDown,
  CheckCircle, Clock, FileText, ChevronDown, ChevronUp
} from 'lucide-react-native';

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:     { label: 'Nháp',          color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  CONFIRMED: { label: 'Đã xác nhận',   color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  PAID:      { label: 'Đã thanh toán', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

function PayslipCard({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[item.status] || statusConfig.DRAFT;
  const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';

  return (
    <View style={[styles.card, { borderColor: cfg.border }]}>
      {/* Header */}
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(!expanded)}>
        <View style={styles.monthRow}>
          <View style={styles.monthIcon}>
            <Calendar size={18} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.monthText}>Tháng {item.month}/{item.year}</Text>
            <Text style={styles.workDaysText}>{item.actualDays || 0}/{item.workingDays || 26} ngày công</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            {item.status === 'PAID'
              ? <CheckCircle size={12} color={cfg.color} />
              : <Clock size={12} color={cfg.color} />}
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </View>
      </TouchableOpacity>

      {/* Net Salary always visible */}
      <View style={styles.netRow}>
        <Text style={styles.netLabel}>Thực nhận</Text>
        <Text style={styles.netValue}>{fmt(item.netSalary)}</Text>
      </View>

      {/* Expanded breakdown */}
      {expanded && (
        <View style={styles.breakdown}>
          <View style={styles.divider} />
          <Text style={styles.breakdownTitle}>Chi tiết lương</Text>
          {[
            { label: 'Lương cơ bản',  val: item.baseSalary,  positive: true  },
            { label: 'Phụ cấp',       val: item.allowance,   positive: true  },
            { label: 'Thưởng',        val: item.bonus || 0,  positive: true  },
            { label: 'Khấu trừ',      val: item.deduction,   positive: false },
            { label: 'Thuế TNCN',     val: item.tax || 0,    positive: false },
          ].map((row, i) => (
            <View key={i} style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                {row.positive
                  ? <TrendingUp size={14} color="#16a34a" />
                  : <TrendingDown size={14} color="#ef4444" />}
                <Text style={styles.breakdownLabel}>{row.label}</Text>
              </View>
              <Text style={[styles.breakdownVal, { color: row.positive ? '#16a34a' : '#ef4444' }]}>
                {row.positive ? '+' : '-'}{fmt(row.val)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { fontWeight: 'bold', color: '#1e293b' }]}>Tổng thực nhận</Text>
            <Text style={[styles.breakdownVal, { color: '#2563eb', fontWeight: 'bold', fontSize: 16 }]}>{fmt(item.netSalary)}</Text>
          </View>
          {item.note && (
            <View style={styles.noteBox}>
              <FileText size={14} color="#64748b" />
              <Text style={styles.noteText}>{item.note}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default function PayslipsScreen() {
  const { data: payslipsData, isLoading, refetch } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: async () => {
      const res = await api.get('/payroll/my');
      return res.data?.data || res.data || [];
    }
  });

  const payslips = Array.isArray(payslipsData) ? payslipsData : [];
  const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';

  const latestPaid = payslips.find((p: any) => p.status === 'PAID');
  const totalReceived = payslips
    .filter((p: any) => p.status === 'PAID')
    .reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Phiếu lương</Text>
        <Text style={styles.subtitle}>Lịch sử tiền lương của bạn</Text>
      </View>

      {/* Summary Banner */}
      {latestPaid && (
        <View style={styles.summaryBanner}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Lần gần nhất nhận lương</Text>
            <Text style={styles.summaryMonth}>Tháng {latestPaid.month}/{latestPaid.year}</Text>
            <Text style={styles.summaryAmount}>{fmt(latestPaid.netSalary)}</Text>
          </View>
          <View style={styles.summaryRight}>
            <View style={styles.summaryIconBox}>
              <DollarSign size={28} color="#fff" />
            </View>
            <Text style={styles.summaryTotal}>Tổng YTD</Text>
            <Text style={styles.summaryTotalAmt}>{fmt(totalReceived)}</Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : payslips.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}><DollarSign size={32} color="#94a3b8" /></View>
          <Text style={styles.emptyTitle}>Chưa có phiếu lương</Text>
          <Text style={styles.emptyText}>Phiếu lương sẽ xuất hiện sau khi HR xử lý vào cuối tháng</Text>
        </View>
      ) : (
        <FlatList
          data={payslips}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PayslipCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },

  // Summary
  summaryBanner: { margin: 16, backgroundColor: '#2563eb', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  summaryLeft: { flex: 1 },
  summaryLabel: { color: '#bfdbfe', fontSize: 12, marginBottom: 4 },
  summaryMonth: { color: '#fff', fontSize: 14, opacity: 0.8 },
  summaryAmount: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  summaryRight: { alignItems: 'center' },
  summaryIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  summaryTotal: { color: '#bfdbfe', fontSize: 11 },
  summaryTotalAmt: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  workDaysText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },

  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  netLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  netValue: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },

  breakdown: { paddingHorizontal: 16, paddingBottom: 16 },
  breakdownTitle: { fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownLabel: { fontSize: 14, color: '#475569' },
  breakdownVal: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10, marginTop: 8 },
  noteText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 18 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
});
