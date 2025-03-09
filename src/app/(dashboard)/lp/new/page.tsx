'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { createLP } from '@/lib/api/lp';

// LP Builder component
import LPBuilder from '@/components/lp-builder/LPBuilder';

// バリデーションスキーマ
const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'タイトルは3文字以上で入力してください' })
    .max(100, { message: 'タイトルは100文字以内で入力してください' }),
  description: z
    .string()
    .max(500, { message: '説明は500文字以内で入力してください' })
    .optional(),
});

export default function NewLPPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // フォーム設定
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // フォーム送信処理
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // LP作成APIを呼び出し
      const newLP = await createLP({
        title: values.title,
        description: values.description || null,
        status: 'draft',
        thumbnail: null,
      });

      toast({
        title: '作成完了',
        description: 'LPが作成されました。LP作成画面に移動します。',
      });

      // 成功したら新しいLPの編集画面に遷移
      router.push(`/lp/${newLP.id}/edit`);
    } catch (error) {
      console.error('LP作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'LPの作成に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push('/lp');
  };

  // AIビルダーで直接作成
  const createWithAI = async () => {
    try {
      setIsSubmitting(true);
      
      // フォームから現在のタイトルを取得
      const title = form.getValues('title');
      
      // タイトルとLP作成情報を使用してLPを作成
      const newLP = await createLP({
        title: title || '新規AI作成LP',
        description: 'AIビルダーで作成中のLP',
        status: 'draft',
        thumbnail: null,
      });

      toast({
        title: 'LP作成開始',
        description: `「${title || '新規LP'}」の作成を開始します`,
      });

      // 直接生成フェーズに移行（chatフェーズをスキップ）
      router.push(`/lp/${newLP.id}/edit/generate`);
    } catch (error) {
      console.error('LP作成エラー:', error);
      toast({
        title: 'エラー',
        description: 'LPの作成に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/lp')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">新規LP作成</h1>
          </div>
          
          <TabsList>
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="ai">AIビルダー</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="mt-0">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LP名</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: 新商品紹介LP"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          分かりやすいLP名を設定してください。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>説明（任意）</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="LPの目的や内容について簡単に説明してください"
                            className="min-h-32"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          このLPの目的やターゲットユーザーなどを記載すると、
                          AI生成の精度向上に役立ちます。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      キャンセル
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '作成中...' : 'LPを作成'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
          <Form {...form}>
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-lg border shadow-sm p-10">
                <h2 className="text-2xl font-bold mb-4 text-center">AIを使ってLPを作成</h2>
                <p className="text-muted-foreground mb-6 text-center">
                  AIビルダーを使用して、会話形式でLPを作成します。質問に答えるだけで、最適なLPが自動生成されます。
                </p>
                
                <div className="mb-8 max-w-lg mx-auto">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LP名</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例: 新サービス紹介LP"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          分かりやすいLP名を設定してください。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="text-center">
                  <Button
                    size="lg"
                    className="px-8 py-6 text-lg"
                    onClick={() => {
                      // タイトルがない場合はエラー表示
                      if (!form.getValues('title')) {
                        form.setError('title', { 
                          type: 'required', 
                          message: 'LP名を入力してください' 
                        });
                        return;
                      }
                      createWithAI();
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        作成中...
                      </>
                    ) : (
                      'AIビルダーで作成を開始'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}