import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await api.get('/chat/conversations/');
      setConversations(res.data.results || res.data);
    } catch {}
  };

  useEffect(() => { loadConversations(); }, []);

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadConversations(); setRefreshing(false); }} />}
      contentContainerClassName="p-4"
      ListHeaderComponent={<Text className="text-xl font-bold mb-4">المحادثات</Text>}
      renderItem={({ item }) => {
        const other = item.participants_detail?.find((p: any) => p.id !== user?.id);
        return (
          <TouchableOpacity className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between">
              <Text className="font-bold">{other?.name || other?.email || 'غير معروف'}</Text>
              {item.unread_count > 0 && (
                <View className="bg-[#1e40af] rounded-full w-6 h-6 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{item.unread_count}</Text>
                </View>
              )}
            </View>
            {item.last_message && (
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>{item.last_message.content}</Text>
            )}
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={<Text className="text-center text-gray-400 mt-8">لا توجد محادثات بعد</Text>}
    />
  );
}
