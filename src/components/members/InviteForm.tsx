'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, Users, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  emails: z.string().min(1, { message: 'メールアドレスを入力してください' }),
  role: z.enum(['admin', 'user']),
  plan: z.enum(['basic', 'premium']),
  status: z.enum(['active', 'trial']),
  customTrialPeriod: z.boolean().default(false),
  trialPeriodDays: z.number().min(1).max(90).optional(),
  sendWelcomeEmail: z.boolean().default(true),
  message: z.string().optional(),
});

export function InviteForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // フォームの初期化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: '',
      role: 'user',
      plan: 'basic',
      status: 'trial',
      customTrialPeriod: false,
      trialPeriodDays: 14,
      sendWelcomeEmail: true,
      message: '',
    },
  });

  // カスタム試用期間の有効状態を監視
  const customTrialPeriod = form.watch('customTrialPeriod');
  const status = form.watch('status');
  
  // フォーム送信ハンドラ
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // メールアドレスを配列に変換（カンマ、スペース、改行で区切る）
      const emailList = values.emails
        .split(/[,\s]+/)
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      // 実際の実装ではここでAPIを呼び出す
      console.log('招待フォーム提出：', { ...values, emails: emailList });
      
      // 成功メッセージを表示
      toast({
        title: '招待が送信されました',
        description: `${emailList.length}人のユーザーに招待メールを送信しました`,
      });
      
      // フォームをリセット
      form.reset();
      
      // 遅延してリダイレクト
      setTimeout(() => {
        router.push('/members');
      }, 2000);
      
    } catch (error) {
      console.error('招待エラー:', error);
      
      toast({
        title: '招待の送信に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // フォームのリセット
  const handleReset = () => {
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>会員を招待</CardTitle>
            <CardDescription>
              新しいメンバーに招待メールを送信します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* メールアドレスフィールド */}
            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例: user1@example.com, user2@example.com"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    複数のメールアドレスはカンマ、スペース、または改行で区切ってください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ロールフィールド */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>権限</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="権限を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">一般ユーザー</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      招待する全員に同じ権限が設定されます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* プランフィールド */}
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>プラン</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="プランを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basic">ベーシック</SelectItem>
                        <SelectItem value="premium">プレミアム</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* ステータスフィールド */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>初期ステータス</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="ステータスを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">有効</SelectItem>
                      <SelectItem value="trial">お試し</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* 試用期間設定（statusがtrialの場合のみ表示） */}
            {status === 'trial' && (
              <div className="border rounded-md p-4 space-y-4">
                <h3 className="font-medium">試用期間設定</h3>
                
                <FormField
                  control={form.control}
                  name="customTrialPeriod"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>カスタム試用期間を設定</FormLabel>
                        <FormDescription>
                          システムのデフォルト設定（14日）を上書きします
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {customTrialPeriod && (
                  <FormField
                    control={form.control}
                    name="trialPeriodDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>試用期間日数</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={90}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          1〜90日の範囲で設定できます
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
            
            {/* ウェルカムメール設定 */}
            <FormField
              control={form.control}
              name="sendWelcomeEmail"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      ウェルカムメールを送信する
                    </FormLabel>
                    <FormDescription>
                      招待と同時にウェルカムメールを送信します
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {/* メッセージフィールド */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>カスタムメッセージ（オプション）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="招待メールに含める追加メッセージを入力してください"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    招待メールに含める個人的なメッセージ
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                リセット
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/members')}
                disabled={isSubmitting}
              >
                <Users className="mr-2 h-4 w-4" />
                会員一覧
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  招待を送信
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}