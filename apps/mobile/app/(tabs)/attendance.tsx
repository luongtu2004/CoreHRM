import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Platform, RefreshControl, TextInput
} from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import api from '../../src/lib/api';
import { Clock, MapPin, LogIn, LogOut, CheckCircle, Timer, Camera, X } from 'lucide-react-native';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:     { label: 'Đúng giờ',  color: '#16a34a', bg: '#f0fdf4' },
  LATE:        { label: 'Đi muộn',   color: '#d97706', bg: '#fef3c7' },
  EARLY_LEAVE: { label: 'Về sớm',    color: '#ea580c', bg: '#fff7ed' },
  ABSENT:      { label: 'Vắng mặt', color: '#ef4444', bg: '#fef2f2' },
};

type Mode = 'check-in' | 'check-out';

export default function AttendanceScreen() {
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [captureMode, setCaptureMode] = useState<Mode>('check-in');
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [noteText, setNoteText] = useState('');

  // Xin quyền location khi mở màn hình
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');
    })();
  }, []);

  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance/my');
      return res.data?.data || res.data || [];
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const records = Array.isArray(attendanceData) ? attendanceData : [];
  const todayRecord = records.find((r: any) =>
    new Date(r.createdAt).toDateString() === new Date().toDateString()
  );
  const totalPresent = records.filter((r: any) => r.status === 'PRESENT').length;
  const totalLate    = records.filter((r: any) => r.status === 'LATE').length;
  const totalDays    = records.length;

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const calcHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return null;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  // Mở camera để chụp ảnh
  const openCamera = async (mode: Mode) => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Cần quyền Camera', 'Vui lòng cấp quyền camera để chấm công bằng ảnh selfie.');
        return;
      }
    }
    if (!locationGranted) {
      Alert.alert('Cần quyền Vị trí', 'Vui lòng cấp quyền vị trí để xác nhận bạn đang ở văn phòng.');
      return;
    }
    setCaptureMode(mode);
    setCameraVisible(true);
  };

  // Helper: lấy GPS với timeout để không bị treo mãi
  const getGPSWithTimeout = (timeoutMs = 10000): Promise<Location.LocationObject | null> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);

      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((loc) => { clearTimeout(timer); resolve(loc); })
        .catch(() => { clearTimeout(timer); resolve(null); });
    });
  };

  // Chụp ảnh & gửi API
  const handleCapture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Lỗi', 'Camera chưa sẵn sàng, thử lại.');
      return;
    }
    setUploading(true);
    setUploadStep('📸 Đang chụp ảnh...');
    try {
      // 1. Chụp ảnh
      let photo: { uri: string } | null = null;
      try {
        photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: false });
      } catch (e: any) {
        throw new Error(`Không chụp được ảnh: ${e?.message || 'lỗi camera'}`);
      }
      if (!photo?.uri) throw new Error('Ảnh trống, thử lại.');

      // 2. Nén ảnh (nếu lỗi thì dùng ảnh gốc)
      setUploadStep('🗜️ Đang xử lý ảnh...');
      let finalUri = photo.uri;
      try {
        const compressed = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = compressed.uri;
      } catch {
        // Bỏ qua lỗi nén, dùng ảnh gốc
      }

      // 3. Lấy GPS với timeout 10s
      setUploadStep('📍 Đang lấy vị trí GPS...');
      const loc = await getGPSWithTimeout(10000);
      const latitude = loc?.coords?.latitude ?? null;
      const longitude = loc?.coords?.longitude ?? null;

      // 3b. Reverse geocoding → tên địa điểm (không cần API key)
      let locationName: string | null = null;
      if (latitude !== null && longitude !== null) {
        try {
          const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo && geo.length > 0) {
            const g = geo[0];
            console.log('📍 Geocode result:', g);
            
            // Lọc ra các thành phần có nghĩa, tránh lặp lặp
            const parts = [];
            if (g.name && g.name !== g.street) parts.push(g.name);
            if (g.street) parts.push(g.street);
            if (g.subregion || g.district) parts.push(g.subregion || g.district);
            if (g.city || g.region) parts.push(g.city || g.region);
            
            // Xóa phần tử trùng lặp và nối lại
            locationName = Array.from(new Set(parts)).filter(Boolean).slice(0, 3).join(', ');
          }
        } catch {
          // Bỏ qua nếu reverse geocoding lỗi
        }
      }

      // 4. Build FormData
      setUploadStep('☁️ Đang gửi lên server...');
      const formData = new FormData();
      if (latitude !== null) formData.append('lat', String(latitude));
      if (longitude !== null) formData.append('lng', String(longitude));
      if (locationName) formData.append('location', locationName);
      if (noteText.trim()) formData.append('note', noteText.trim());
      (formData as any).append('photo', {
        uri: finalUri,
        name: 'selfie.jpg',
        type: 'image/jpeg',
      });

      // 5. Gọi API
      const endpoint = captureMode === 'check-in' ? '/attendance/check-in' : '/attendance/check-out';
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCameraVisible(false);
      // Đợi refresh data xong mới tắt popup/loading để UI chớp cập nhật ngay
      await queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      Alert.alert('✅ Thành công', captureMode === 'check-in' ? 'Đã chấm công vào!' : 'Đã chấm công ra!');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Lỗi không xác định';
      Alert.alert('❌ Lỗi chấm công', msg);
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ─── Camera Modal ─── */}
      <Modal visible={cameraVisible} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          {/* Camera không có children - dùng absolute positioning cho overlay */}
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

          {/* Header overlay - nằm ngoài CameraView */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity style={styles.cameraCloseBtn} onPress={() => setCameraVisible(false)}>
              <X size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>
              {captureMode === 'check-in' ? '📸 Selfie Chấm công vào' : '📸 Selfie Chấm công ra'}
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Khung oval guide - nằm ngoài CameraView */}
          <View style={styles.ovalGuideWrapper}>
            <View style={styles.ovalGuide} />
            <Text style={styles.ovalHint}>Căn mặt vào khung</Text>
          </View>

          {/* Note input overlay */}
          <View style={{ position: 'absolute', bottom: 165, left: 20, right: 20 }}>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Ghi chú (lý do đi muộn, ra sớm...)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{
                backgroundColor: 'rgba(0,0,0,0.45)',
                color: '#fff',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 13,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
              }}
            />
          </View>

          {/* Nút chụp - nằm ngoài CameraView */}
          <View style={styles.captureWrapper}>
            {uploading ? (
              <View style={styles.captureBtn}>
                <ActivityIndicator color="#fff" size="large" />
              </View>
            ) : (
              <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )}
            <Text style={styles.captureHint}>
              {uploading ? (uploadStep || 'Đang xử lý...') : 'Bấm để chụp & chấm công'}
            </Text>
          </View>
        </View>
      </Modal>

      {/* ─── Main Content ─── */}
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor="#2563eb" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chấm công</Text>
          <Text style={styles.subtitle}>GPS + Ảnh xác thực</Text>
        </View>

        {/* Today Card */}
        <View style={styles.section}>
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View style={styles.todayIconBox}><Clock size={20} color="#2563eb" /></View>
              <View>
                <Text style={styles.todayTitle}>Hôm nay</Text>
                <Text style={styles.todayDate}>
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                </Text>
              </View>
              {todayRecord && (
                <View style={[styles.statusPill, { backgroundColor: statusConfig[todayRecord.status]?.bg || '#f8fafc' }]}>
                  <Text style={[styles.statusPillText, { color: statusConfig[todayRecord.status]?.color || '#64748b' }]}>
                    {statusConfig[todayRecord.status]?.label || todayRecord.status}
                  </Text>
                </View>
              )}
            </View>

            {/* Thời gian vào/ra */}
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <View style={styles.timeIconRow}>
                  <LogIn size={16} color="#16a34a" />
                  <Text style={styles.timeLabel}>Giờ vào</Text>
                </View>
                <Text style={[styles.timeValue, { color: '#16a34a' }]}>{fmt(todayRecord?.checkIn ?? todayRecord?.createdAt)}</Text>
                {todayRecord?.photoIn && (
                  <Image source={{ uri: todayRecord.photoIn }} style={styles.selfieThumb} contentFit="cover" />
                )}
              </View>
              <View style={styles.timeDivider} />
              <View style={styles.timeBlock}>
                <View style={styles.timeIconRow}>
                  <LogOut size={16} color="#ef4444" />
                  <Text style={styles.timeLabel}>Giờ ra</Text>
                </View>
                <Text style={[styles.timeValue, { color: todayRecord?.checkOut ? '#ef4444' : '#94a3b8' }]}>
                  {fmt(todayRecord?.checkOut)}
                </Text>
                {todayRecord?.photoOut && (
                  <Image source={{ uri: todayRecord.photoOut }} style={styles.selfieThumb} contentFit="cover" />
                )}
              </View>
            </View>

            {/* Vị trí - hiển thị tên địa điểm hoặc tọa độ */}
            {(todayRecord?.locationIn || todayRecord?.checkInLat) && (
              <View style={styles.gpsRow}>
                <MapPin size={13} color="#16a34a" />
                <Text style={styles.gpsText} numberOfLines={1}>
                  {todayRecord.locationIn
                    ? todayRecord.locationIn
                    : `${todayRecord.checkInLat?.toFixed(4)}, ${todayRecord.checkInLng?.toFixed(4)}`
                  }
                </Text>
              </View>
            )}

            {/* Action buttons */}
            {!todayRecord ? (
              <TouchableOpacity style={styles.checkInBtn} onPress={() => openCamera('check-in')}>
                <Camera size={20} color="#fff" />
                <Text style={styles.checkBtnText}>Chụp ảnh & Chấm công vào</Text>
              </TouchableOpacity>
            ) : !todayRecord.checkOut ? (
              <TouchableOpacity style={styles.checkOutBtn} onPress={() => openCamera('check-out')}>
                <Camera size={20} color="#fff" />
                <Text style={styles.checkBtnText}>Chụp ảnh & Chấm công ra</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.doneBox}>
                <CheckCircle size={20} color="#16a34a" />
                <Text style={styles.doneText}>
                  Hoàn thành · {calcHours(todayRecord.checkIn ?? todayRecord.createdAt, todayRecord.checkOut)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.statVal, { color: '#16a34a' }]}>{totalPresent}</Text>
            <Text style={styles.statLbl}>Đúng giờ</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Text style={[styles.statVal, { color: '#d97706' }]}>{totalLate}</Text>
            <Text style={styles.statLbl}>Đi muộn</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.statVal, { color: '#2563eb' }]}>{totalDays}</Text>
            <Text style={styles.statLbl}>Tổng ngày</Text>
          </View>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lịch sử chấm công</Text>
          {isLoading ? <ActivityIndicator color="#2563eb" style={{ margin: 20 }} /> : (
            records.slice(0, 20).map((r: any) => {
              const cfg = statusConfig[r.status] || { label: r.status, color: '#64748b', bg: '#f8fafc' };
              return (
                <View key={r.id} style={styles.historyCard}>
                  <View style={[styles.historyDot, { backgroundColor: cfg.color }]} />
                  <View style={styles.historyContent}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {new Date(r.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </Text>
                      <View style={[styles.historyBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.historyBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    <View style={styles.historyTimes}>
                      <View style={styles.historyTimeItem}>
                        <LogIn size={14} color="#16a34a" />
                        <Text style={styles.historyTimeText}>{fmt(r.checkIn ?? r.createdAt)}</Text>
                      </View>
                      <Text style={styles.historyArrow}>→</Text>
                      <View style={styles.historyTimeItem}>
                        <LogOut size={14} color="#ef4444" />
                        <Text style={styles.historyTimeText}>{fmt(r.checkOut)}</Text>
                      </View>
                      {r.checkOut && (
                        <View style={styles.historyTimeItem}>
                          <Timer size={14} color="#64748b" />
                          <Text style={[styles.historyTimeText, { color: '#2563eb', fontWeight: '600' }]}>
                            {calcHours(r.checkIn ?? r.createdAt, r.checkOut)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Selfie thumbnails in history */}
                    {(r.photoIn || r.photoOut) && (
                      <View style={styles.historyPhotos}>
                        {r.photoIn && <Image source={{ uri: r.photoIn }} style={styles.historyPhoto} contentFit="cover" />}
                        {r.photoOut && <Image source={{ uri: r.photoOut }} style={styles.historyPhoto} contentFit="cover" />}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
          {records.length === 0 && !isLoading && (
            <View style={styles.emptyBox}>
              <Clock size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có lịch sử chấm công</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  // Camera
  cameraContainer: { flex: 1, backgroundColor: '#000', flexDirection: 'column' },
  cameraHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  cameraCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  cameraTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ovalGuideWrapper: { alignItems: 'center', marginTop: 20 },
  ovalGuide: { width: 220, height: 280, borderRadius: 140, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', borderStyle: 'dashed' },
  ovalHint: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 12 },
  captureWrapper: { alignItems: 'center', position: 'absolute', bottom: 60, left: 0, right: 0 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  captureHint: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 14 },
  // Main
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 3 },
  section: { padding: 16 },
  todayCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
  todayHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  todayIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  todayTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  todayDate: { fontSize: 13, color: '#64748b' },
  statusPill: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  timeRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', paddingVertical: 16, marginBottom: 16 },
  timeBlock: { flex: 1, alignItems: 'center', gap: 6 },
  timeDivider: { width: 1, backgroundColor: '#f1f5f9' },
  timeIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeLabel: { fontSize: 12, color: '#64748b' },
  timeValue: { fontSize: 24, fontWeight: 'bold' },
  selfieThumb: { width: 56, height: 56, borderRadius: 12, marginTop: 4, borderWidth: 2, borderColor: '#e2e8f0' },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  gpsText: { fontSize: 11, color: '#94a3b8' },
  checkInBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkOutBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  doneBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, backgroundColor: '#f0fdf4', borderRadius: 16 },
  doneText: { color: '#16a34a', fontWeight: '600', fontSize: 15 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 4 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 24, fontWeight: 'bold' },
  statLbl: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  historyCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  historyContent: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#334155' },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  historyBadgeText: { fontSize: 11, fontWeight: '600' },
  historyTimes: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  historyTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyTimeText: { fontSize: 13, color: '#475569' },
  historyArrow: { color: '#cbd5e1', fontSize: 14 },
  historyPhotos: { flexDirection: 'row', gap: 8, marginTop: 8 },
  historyPhoto: { width: 52, height: 52, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});
