import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { api } from '@/lib/api';

export default function GradesScreen() {
  const [grades, setGrades] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadGrades = async () => {
    try {
      const res = await api.get('/schools/grade-entries/');
      setGrades(res.data.results || res.data);
    } catch {}
  };

  useEffect(() => { loadGrades(); }, []);

  return (
    <FlatList
      data={grades}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadGrades(); setRefreshing(false); }} />}
      contentContainerClassName="p-4"
      ListHeaderComponent={<Text className="text-xl font-bold mb-4">الدرجات</Text>}
      renderItem={({ item }) => {
        const pct = item.percentage || (item.category_max_score ? (item.score / item.category_max_score * 100) : 0);
        return (
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="font-bold">{item.category_name}</Text>
              <Text className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {pct.toFixed(1)}%
              </Text>
            </View>
            <Text className="text-sm text-gray-500 mt-1">{item.score} / {item.category_max_score}</Text>
          </View>
        );
      }}
      ListEmptyComponent={<Text className="text-center text-gray-400 mt-8">لا توجد درجات بعد</Text>}
    />
  );
}
