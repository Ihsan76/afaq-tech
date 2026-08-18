import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50 p-6">
      <View className="bg-white rounded-2xl p-6 shadow-sm items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-[#1e40af]/20 items-center justify-center mb-4">
          <Text className="text-[#1e40af] text-3xl font-bold">{user?.email?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text className="text-lg font-bold">{user?.email}</Text>
        <Text className="text-sm text-gray-500 mt-1">{user?.role}</Text>
      </View>

      <TouchableOpacity onPress={handleLogout} className="bg-red-500 rounded-xl py-3 items-center">
        <Text className="text-white font-bold">تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}
