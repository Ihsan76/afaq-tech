import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function AuthLayout() {
  const { user } = useAuthStore();
  if (user) return <Redirect href="/(tabs)" />;
  return null;
}
