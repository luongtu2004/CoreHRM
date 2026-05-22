import { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../src/lib/api';
import { CheckSquare, Clock, Calendar, ChevronRight, CheckCircle, Circle, AlertTriangle } from 'lucide-react-native';

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: 'Thấp',    color: '#16a34a', bg: '#f0fdf4' },
  MEDIUM: { label: 'Trung bình', color: '#d97706', bg: '#fef3c7' },
  HIGH:   { label: 'Cao',    color: '#ea580c', bg: '#fff7ed' },
  URGENT: { label: 'Khẩn cấp', color: '#ef4444', bg: '#fef2f2' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  TODO:        { label: 'Cần làm',   color: '#64748b', icon: Circle },
  IN_PROGRESS: { label: 'Đang làm',  color: '#2563eb', icon: Clock },
  DONE:        { label: 'Hoàn thành', color: '#16a34a', icon: CheckCircle },
};

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [feedback, setFeedback] = useState('');

  const { data: userData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data?.data || res.data;
    }
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks?limit=1000');
      return res.data?.data?.data || res.data?.data || [];
    }
  });

  const markDoneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}`, { status: 'DONE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      Alert.alert('✅', 'Đã đánh dấu hoàn thành!');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      Alert.alert('✅', 'Đã cập nhật công việc!');
      setSelectedTask(null);
      setFeedback('');
    }
  });

  const handleUpdateTask = (status: string) => {
    if (!selectedTask) return;
    let newDesc = selectedTask.description || '';
    if (feedback.trim()) {
      const replierName = userData?.name || 'Nhân viên';
      newDesc += `\n\n[${replierName}]: ${feedback.trim()}`;
    }
    updateTaskMutation.mutate({ id: selectedTask.id, data: { status, description: newDesc } });
  };

  const allTasks = Array.isArray(tasksData) ? tasksData : [];
  const tasks = allTasks.filter((t: any) => t.assignedTo === userData?.id);
  const filtered = filter ? tasks.filter((t: any) => t.status === filter) : tasks;

  const stats = {
    todo: tasks.filter((t: any) => t.status === 'TODO').length,
    inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
    done: tasks.filter((t: any) => t.status === 'DONE').length,
  };

  const renderItem = ({ item }: { item: any }) => {
    const pri = priorityConfig[item.priority] || priorityConfig.MEDIUM;
    const st  = statusConfig[item.status]    || statusConfig.TODO;
    const StIcon = st.icon;
    const isDone = item.status === 'DONE';
    return (
      <TouchableOpacity 
        style={[styles.card, isDone && styles.cardDone]} 
        activeOpacity={0.7}
        onPress={() => setSelectedTask(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.priorityTag, { backgroundColor: pri.bg }]}>
            <AlertTriangle size={12} color={pri.color} />
            <Text style={[styles.priorityText, { color: pri.color }]}>{pri.label}</Text>
          </View>
          <View style={styles.statusTag}>
            <StIcon size={14} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>
        </View>

        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{item.title}</Text>
        {item.description && (
          <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.cardFooter}>
          {item.dueDate && (
            <View style={styles.footerItem}>
              <Calendar size={13} color="#94a3b8" />
              <Text style={styles.footerText}>Hạn: {new Date(item.dueDate).toLocaleDateString('vi-VN')}</Text>
            </View>
          )}
          {item.assignee && (
            <View style={styles.footerItem}>
              <View style={styles.miniAvatar}>
                <Text style={styles.miniAvatarText}>{item.assignee?.name?.charAt(0)}</Text>
              </View>
              <Text style={styles.footerText}>{item.assignee?.name}</Text>
            </View>
          )}
          {item.status !== 'DONE' && (
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => markDoneMutation.mutate(item.id)}
              disabled={markDoneMutation.isPending}
            >
              <CheckCircle size={16} color="#16a34a" />
              <Text style={styles.doneBtnText}>Xong</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Công việc</Text>
        <Text style={styles.subtitle}>Danh sách nhiệm vụ của bạn</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statItem, filter === '' && styles.statActive]} onPress={() => setFilter('')}>
          <Text style={[styles.statNum, filter === '' && styles.statNumActive]}>{tasks.length}</Text>
          <Text style={styles.statLbl}>Tất cả</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statItem, filter === 'TODO' && styles.statActive]} onPress={() => setFilter('TODO')}>
          <Text style={[styles.statNum, filter === 'TODO' && styles.statNumActive]}>{stats.todo}</Text>
          <Text style={styles.statLbl}>Cần làm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statItem, filter === 'IN_PROGRESS' && styles.statActive]} onPress={() => setFilter('IN_PROGRESS')}>
          <Text style={[styles.statNum, filter === 'IN_PROGRESS' && styles.statNumActive]}>{stats.inProgress}</Text>
          <Text style={styles.statLbl}>Đang làm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statItem, filter === 'DONE' && styles.statActive]} onPress={() => setFilter('DONE')}>
          <Text style={[styles.statNum, filter === 'DONE' && styles.statNumActive]}>{stats.done}</Text>
          <Text style={styles.statLbl}>Xong</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <CheckSquare size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Không có công việc</Text>
          <Text style={styles.emptyText}>Bạn không có nhiệm vụ nào trong danh mục này</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      )}

      {/* Task Details Modal */}
      <Modal visible={!!selectedTask} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Chi tiết công việc</Text>
              <TouchableOpacity onPress={() => { setSelectedTask(null); setFeedback(''); }} style={{ padding: 4 }}>
                <Text style={{ fontSize: 24, color: '#94a3b8' }}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 }}>{selectedTask?.title}</Text>
              
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={[styles.priorityTag, { backgroundColor: priorityConfig[selectedTask?.priority || 'MEDIUM']?.bg }]}>
                  <Text style={[styles.priorityText, { color: priorityConfig[selectedTask?.priority || 'MEDIUM']?.color }]}>{priorityConfig[selectedTask?.priority || 'MEDIUM']?.label}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }]}>
                  <Text style={[styles.statusText, { color: statusConfig[selectedTask?.status || 'TODO']?.color }]}>{statusConfig[selectedTask?.status || 'TODO']?.label}</Text>
                </View>
              </View>

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 4 }}>Mô tả:</Text>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 20 }}>{selectedTask?.description || 'Không có mô tả'}</Text>
              
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>Thêm phản hồi / báo cáo:</Text>
              <TextInput
                style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 14, marginBottom: 20 }}
                placeholder="Nhập tiến độ hoặc phản hồi..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {feedback.trim().length > 0 ? (
                  <TouchableOpacity disabled={updateTaskMutation.isPending} style={{ flex: 1, backgroundColor: '#2563eb', padding: 14, borderRadius: 12, alignItems: 'center', opacity: updateTaskMutation.isPending ? 0.5 : 1 }} onPress={() => handleUpdateTask(selectedTask.status)}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Gửi phản hồi</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {selectedTask?.status !== 'IN_PROGRESS' && selectedTask?.status !== 'DONE' && (
                      <TouchableOpacity disabled={updateTaskMutation.isPending} style={{ flex: 1, backgroundColor: '#eff6ff', padding: 14, borderRadius: 12, alignItems: 'center', opacity: updateTaskMutation.isPending ? 0.5 : 1 }} onPress={() => handleUpdateTask('IN_PROGRESS')}>
                        <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Đang làm</Text>
                      </TouchableOpacity>
                    )}
                    {selectedTask?.status !== 'DONE' && (
                      <TouchableOpacity disabled={updateTaskMutation.isPending} style={{ flex: 1, backgroundColor: '#16a34a', padding: 14, borderRadius: 12, alignItems: 'center', opacity: updateTaskMutation.isPending ? 0.5 : 1 }} onPress={() => handleUpdateTask('DONE')}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Hoàn thành</Text>
                      </TouchableOpacity>
                    )}
                    {selectedTask?.status === 'DONE' && (
                      <View style={{ flex: 1, padding: 14, alignItems: 'center' }}>
                        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Gõ nội dung để gửi thêm phản hồi</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, marginHorizontal: 4 },
  statActive: { backgroundColor: '#eff6ff' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#64748b' },
  statNumActive: { color: '#2563eb' },
  statLbl: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  cardDone: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priorityTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  taskTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskDesc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 10 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: '#94a3b8' },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontSize: 10, color: '#2563eb', fontWeight: 'bold' },
  doneBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  doneBtnText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
});
