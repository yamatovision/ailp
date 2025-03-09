'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/types/database';

// サーバーサイドでセッションを取得するアクション
export async function getServerSession() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('サーバーセッション取得エラー:', error);
    return null;
  }
}

// サーバーサイドでユーザー情報を取得するアクション
export async function getServerUser() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('サーバーユーザー取得エラー:', error);
    return null;
  }
}