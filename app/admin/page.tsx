import { AuthProvider } from '@/contexts/AuthContext';
import AdminLoginForm from './components/AdminLoginForm';

export default function AdminSystemLogin() {
  return (
    <AuthProvider>
      <AdminLoginForm />
    </AuthProvider>
  );
}
