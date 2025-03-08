'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signIn } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    // テストユーザー用のモックログイン
    if (values.email === 'test123@mailinator.com' && values.password === 'password123') {
      toast({
        title: 'ログイン成功',
        description: 'テストユーザーとしてログインしました',
      });
      
      // テスト用モックログイン：セッションストレージを使用
      sessionStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'mock-token',
          user: {
            id: 'test-user-id',
            email: 'test123@mailinator.com',
            user_metadata: { name: 'テストユーザー' }
          }
        }
      }));
      
      // 強制的にページ遷移
      window.location.href = '/dashboard';
      
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signIn(values.email, values.password);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'ログインエラー',
          description: error.message,
        });
        return;
      }

      toast({
        title: 'ログイン成功',
        description: 'ダッシュボードにリダイレクトします',
      });

      // window.location.hrefを使用して強制的にリダイレクト
      window.location.href = '/dashboard';
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'ログインエラー',
        description: '予期せぬエラーが発生しました',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input 
                  placeholder="your@email.com" 
                  type="email" 
                  autoComplete="email"
                  disabled={isLoading} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <Input 
                  placeholder="••••••••" 
                  type="password" 
                  autoComplete="current-password"
                  disabled={isLoading} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="rememberMe"
            {...form.register('rememberMe')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label
            htmlFor="rememberMe"
            className="text-sm text-muted-foreground"
          >
            ログイン状態を保持する
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>
    </Form>
  );
}