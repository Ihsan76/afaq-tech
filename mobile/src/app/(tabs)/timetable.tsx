import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { api } from '@/lib/api';

const DAY_LABELS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

export default function TimetableScreen() {
  const [slots, setSlots] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSlots = async () => {
    try {
      const res = await api.get('/schools/timetable-slots/');
      setSlots(res.data.results || res.data);
    } catch {}
  };

  useEffect(() => { loadSlots(); }, []);

  return (
    <FlatList
      data={slots}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadSlots(); setRefreshing(false); }} />}
      contentContainerClassName="p-4"
      ListHeaderComponent={<Text className="text-xl font-bold mb-4">الجدول الدراسي</Text>}
      renderItem={({ item }) => (
        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row justify-between">
            <Text className="font-bold text-[#1e40af]">{item.subject_name}</Text>
            <Text className="text-xs text-gray-400">{DAY_LABELS[item.day_of_week - 1]}</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-1">{item.section_name} — {item.period_name}</Text>
          <Text className="text-xs text-gray-400 mt-1">{item.teacher_name || item.teacher_email}</Text>
          {item.room_name ? <Text className="text-xs text-gray-400">📍 {item.room_name}</Text> : null}
        </View>
      )}
      ListEmptyComponent={<Text className="text-center text-gray-400 mt-8">لا توجد حصص مسجلة</Text>}
    />
  );
}
