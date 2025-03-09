'use client';

import { useAuth as useAuthContext } from '@/auth/providers/auth-provider';

// シンプルな認証フックのエクスポート
export const useAuth = useAuthContext;