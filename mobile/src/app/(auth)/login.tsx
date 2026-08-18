import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('خطأ', e?.response?.data?.detail || 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-8" style={{ background: 'linear-gradient(180deg, #1e40af, #3b82f6)' }}>
      <View className="bg-white/10 rounded-3xl p-8 backdrop-blur">
        <Text className="text-3xl font-bold text-white text-center mb-2">آفاق تكنولوجي</Text>
        <Text className="text-white/70 text-center mb-8">منصة إدارة المدارس</Text>

        <TextInput
          placeholder="البريد الإلكتروني"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-white/20 rounded-xl px-4 py-3 text-white mb-4"
        />
        <TextInput
          placeholder="كلمة المرور"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="bg-white/20 rounded-xl px-4 py-3 text-white mb-6"
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-white rounded-xl py-3 items-center"
        >
          {loading ? (
            <ActivityIndicator color="#1e40af" />
          ) : (
            <Text className="text-[#1e40af] font-bold text-lg">دخول</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
