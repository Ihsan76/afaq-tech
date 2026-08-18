import { Redirect, Tabs } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { Text } from 'react-native';

export default function TabsLayout() {
  const { user } = useAuthStore();
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1e40af' }}>
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tabs.Screen name="timetable" options={{ title: 'الجدول', tabBarIcon: () => <Text>📅</Text> }} />
      <Tabs.Screen name="grades" options={{ title: 'الدرجات', tabBarIcon: () => <Text>📊</Text> }} />
      <Tabs.Screen name="chat" options={{ title: 'المحادثات', tabBarIcon: () => <Text>💬</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'الملف', tabBarIcon: () => <Text>👤</Text> }} />
    </Tabs>
  );
}
