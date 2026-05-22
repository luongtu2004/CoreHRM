import { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../src/lib/api';
import { Bell, Check, Clock, Info, ShieldAlert, ArrowLeft, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.data || res.data || [];
    },
    refetchInterval: 3000,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.patch('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const deleteAll = useMutation({
    mutationFn: async () => api.delete('/notifications/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const notifications = Array.isArray(notificationsData) ? notificationsData : [];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'LEAVE_REQUEST': return <Clock size={20} color="#d97706" />;
      case 'PAYROLL': return <Info size={20} color="#2563eb" />;
      case 'SYSTEM': return <ShieldAlert size={20} color="#ef4444" />;
      default: return <Bell size={20} color="#64748b" />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Thông báo</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={styles.readAll}>Đọc hết</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteAll.mutate()}>
            <Text style={styles.deleteAll}>Xóa hết</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Bell size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => {
                if (!item.isRead) markAsRead.mutate(item.id);
              }}
            >
              <View style={[styles.iconBox, !item.isRead && { backgroundColor: '#fff' }]}>
                {renderIcon(item.type)}
              </View>
              <View style={styles.content}>
                <Text style={[styles.titleText, !item.isRead && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.message} numberOfLines={2}>{item.content}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
              </View>
              {item.isRead ? (
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => deleteNotification.mutate(item.id)}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              ) : (
                <View style={styles.dot} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%', maxWidth: 480, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  readAll: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  deleteAll: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 12 },
  cardUnread: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  titleText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  titleUnread: { color: '#1e293b', fontWeight: 'bold' },
  message: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb' },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { color: '#94a3b8', fontSize: 14 }
});
