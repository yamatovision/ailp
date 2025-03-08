'use client';

import { useState } from 'react';
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
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'エラー',
          description: error.message,
        });
        return;
      }

      setIsSubmitted(true);
      
      toast({
        title: 'パスワードリセットリンクを送信しました',
        description: 'メールをご確認ください',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: '予期せぬエラーが発生しました',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4">
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium">パスワードリセットリンクを送信しました</h3>
          <p className="text-sm text-muted-foreground mt-2">
            ご登録のメールアドレスにパスワードリセットのリンクを送信しました。
            メールを確認し、リンクをクリックしてパスワードをリセットしてください。
          </p>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setIsSubmitted(false)}
        >
          メールアドレスを再入力
        </Button>
      </div>
    );
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '送信中...' : 'パスワードリセットリンクを送信'}
        </Button>
      </form>
    </Form>
  );
}