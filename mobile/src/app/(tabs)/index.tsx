import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await api.get('/schools/my-context/');
      setStats(res.data);
    } catch {}
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-[#1e40af] pt-12 pb-6 px-6 rounded-b-3xl">
        <Text className="text-white text-2xl font-bold">مرحباً، {user?.email}</Text>
        <Text className="text-white/70 mt-1">إدارة مدارس آفاق</Text>
      </View>

      <View className="px-6 mt-6 space-y-4">
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-gray-500 text-xs font-bold">المدارس</Text>
          <Text className="text-3xl font-extrabold mt-1">{stats?.schools_count || 0}</Text>
        </View>
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-gray-500 text-xs font-bold">الحضور اليوم</Text>
          <Text className="text-3xl font-extrabold mt-1 text-green-600">{stats?.today_present || 0}</Text>
        </View>
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-gray-500 text-xs font-bold">الغياب اليوم</Text>
          <Text className="text-3xl font-extrabold mt-1 text-red-500">{stats?.today_absent || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
