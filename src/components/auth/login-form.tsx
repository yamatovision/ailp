'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/auth/hooks/use-auth';

const formSchema = z.object({
  email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('メールアドレスの形式が正しくありません'),
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります'),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const result = await login(values.email, values.password);

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'ログインエラー',
          description: result.error || 'ログインに失敗しました',
        });
        return;
      }

      toast({
        title: 'ログイン成功',
        description: 'ダッシュボードにリダイレクトします',
      });

      // リダイレクト先の取得（ミドルウェアからのクエリパラメータ）
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      
      // window.location.hrefを使用して完全にリロード
      // Next.jsのルーターではなく直接リダイレクト
      window.location.href = redirectPath;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'ログインエラー',
        description: '予期せぬエラーが発生しました',
      });
    } finally {
      setIsSubmitting(false);
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
                  disabled={isSubmitting || isLoading} 
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
                  disabled={isSubmitting || isLoading} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>
    </Form>
  );
}