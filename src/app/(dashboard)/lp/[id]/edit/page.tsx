'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { getLP, updateLP } from '@/lib/api/lp';

// 基本編集フォーム用
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, {
    message: 'タイトルは必須です。',
  }),
  description: z.string().optional(),
  status: z.enum(['draft', 'active']),
  thumbnail: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// LPの型定義
type LP = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  conversionRate?: number;
  views?: number;
  conversions?: number;
};

export default function EditLPPage({ params, searchParams }: { params: { id: string }, searchParams?: { tab?: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams?.tab === 'builder' ? 'builder' : 'basic');
  const [lpData, setLpData] = useState<LP | null>(null);

  // フォーム初期化
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      thumbnail: '',
    },
  });

  // AIビルダーを選択した場合は、直接生成フェーズにリダイレクト
  useEffect(() => {
    if (activeTab === 'builder') {
      router.push(`/lp/${params.id}/edit/generate`);
    }
  }, [activeTab, params.id, router]);

  // LPデータの読み込み
  useEffect(() => {
    const fetchLP = async () => {
      try {
        setLoading(true);
        const data = await getLP(params.id);
        setLpData(data);
        
        // フォームに値を設定
        form.reset({
          title: data.title,
          description: data.description || '',
          status: data.status as 'draft' | 'active',
          thumbnail: data.thumbnail || '',
        });
      } catch (error) {
        console.error('LPの読み込みに失敗しました:', error);
        toast({
          title: 'エラー',
          description: 'LPの読み込みに失敗しました。',
          variant: 'destructive',
        });
        router.push('/lp');
      } finally {
        setLoading(false);
      }
    };

    fetchLP();
  }, [params.id, form, toast, router]);

  // フォーム送信処理
  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      await updateLP(params.id, {
        title: data.title,
        description: data.description,
        status: data.status,
        thumbnail: data.thumbnail,
      });
      
      toast({
        title: '保存完了',
        description: 'LPを更新しました。',
      });
      
      router.push(`/lp/${params.id}`);
    } catch (error) {
      console.error('LPの更新に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'LPの更新に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href={`/lp/${params.id}`} className="inline-flex items-center mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">LP編集</h1>
          </div>
          
          <TabsList>
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="builder">AIビルダー</TabsTrigger>
          </TabsList>
          
          {activeTab === 'basic' && (
            <Button 
              type="submit" 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          )}
        </div>

        <TabsContent value="basic" className="mt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル</FormLabel>
                      <FormControl>
                        <Input placeholder="LP名を入力してください" {...field} />
                      </FormControl>
                      <FormDescription>
                        LPの目的や内容が分かりやすいタイトルを設定してください。
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
                      <FormLabel>説明</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="LPの説明や目的などを入力してください"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        このLPの目的や内容を簡潔に説明してください。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ステータス</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="ステータスを選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">下書き</SelectItem>
                          <SelectItem value="active">公開</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        LPの公開状態を設定します。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>サムネイル画像URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        LPのサムネイル画像URLを設定してください。（空白の場合はデフォルト画像が使用されます）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => router.push(`/lp/${params.id}`)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}