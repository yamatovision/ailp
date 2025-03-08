'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase, getSession, getUser, signOut } from '@/lib/supabase';
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUserFromSession() {
      setIsLoading(true);
      
      // モックセッションのチェック
      const mockSessionData = sessionStorage.getItem('supabase.auth.token');
      if (mockSessionData) {
        try {
          const mockSession = JSON.parse(mockSessionData);
          if (mockSession?.currentSession?.user) {
            console.log('テストユーザーセッションを使用しています');
            setUser(mockSession.currentSession.user);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('モックセッションの解析エラー:', e);
        }
      }
      
      // 通常のセッション取得
      const { data, error } = await getSession();
      
      if (error) {
        console.error('Session error:', error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        const { data: userData } = await getUser();
        if (userData.user) {
          setUser(userData.user);
        }
      }
      
      setIsLoading(false);
    }

    loadUserFromSession();

    // リアルタイムの認証状態変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (!pathname.startsWith('/(auth)') && pathname !== '/') {
          router.push('/login');
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname]);

  async function logout() {
    await signOut();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);