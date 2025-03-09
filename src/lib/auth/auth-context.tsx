'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  ReactNode,
  useState 
} from 'react';
import { useAuthStore } from './auth-store';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // storeから状態を取得
  const {
    user,
    isLoading,
    isAuthenticated,
    initialize,
    logout: storeLogout
  } = useAuthStore();
  
  // storeの初期化フラグ
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // コンポーネントマウント時にstoreを初期化
  useEffect(() => {
    if (!isInitialized) {
      initialize().then(() => {
        setIsInitialized(true);
        console.log('認証ストア初期化完了');
      });
    }
  }, [initialize, isInitialized]);

  // ログアウト関数
  async function logout() {
    const result = await storeLogout();
    if (result.success) {
      router.push('/login');
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated, 
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);