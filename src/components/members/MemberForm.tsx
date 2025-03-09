'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '@prisma/client';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Trash, AlertTriangle } from 'lucide-react';

// ユーザータイプの拡張（実際の実装ではprismaスキーマを拡張するべき）
type UserWithStatus = User & {
  status: 'active' | 'trial' | 'inactive' | 'withdrawn';
  role: 'admin' | 'user';
  plan: 'basic' | 'premium';
  lastLoginAt?: Date | null;
  notes?: string | null;
};

// フォームのバリデーションスキーマ
const formSchema = z.object({
  name: z.string().min(1, { message: '名前は必須です' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  status: z.enum(['active', 'trial', 'inactive', 'withdrawn']),
  role: z.enum(['admin', 'user']),
  plan: z.enum(['basic', 'premium']),
  customTrialPeriod: z.boolean().default(false),
  trialPeriodDays: z.number().min(1).max(90).optional(),
  autoDisable: z.boolean().default(true),
  webhookUrl: z.string().url({ message: '有効なURLを入力してください' }).optional().or(z.literal('')),
  notes: z.string().optional(),
});

// ユーザー名の頭文字取得用の関数
const getInitials = (name: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

interface MemberFormProps {
  user?: UserWithStatus;
  onSuccess?: () => void;
}

export function MemberForm({ user, onSuccess }: MemberFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // フォームの初期化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      status: user?.status || 'active',
      role: user?.role || 'user',
      plan: user?.plan || 'basic',
      customTrialPeriod: false,
      trialPeriodDays: 14,
      autoDisable: true,
      webhookUrl: '',
      notes: user?.notes || '',
    },
  });

  // カスタム試用期間の有効状態を監視
  const customTrialPeriod = form.watch('customTrialPeriod');
  
  // フォーム送信ハンドラ
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // 実際の実装ではここでAPIを呼び出す
      console.log('提出されたフォーム値:', values);
      
      // 成功メッセージを表示
      toast({
        title: user ? '会員情報が更新されました' : '会員が登録されました',
        description: `${values.name} (${values.email})`,
      });
      
      // 成功コールバックを呼び出す
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('保存エラー:', error);
      
      toast({
        title: '保存に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 会員削除ハンドラ
  const handleDeleteMember = async () => {
    try {
      setIsSubmitting(true);
      
      // 実際の実装ではここでAPIを呼び出す
      console.log('会員削除:', user?.id);
      
      // 成功メッセージを表示
      toast({
        title: '会員が削除されました',
        description: `${user?.name} (${user?.email})`,
      });
      
      // ダイアログを閉じる
      setDeleteDialogOpen(false);
      
      // 成功コールバックを呼び出す
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('削除エラー:', error);
      
      toast({
        title: '削除に失敗しました',
        description: 'エラーが発生しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{user ? '会員情報編集' : '新規会員登録'}</CardTitle>
                <CardDescription>
                  {user ? '会員情報を更新します' : '新しい会員を登録します'}
                </CardDescription>
              </div>
              {user && (
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback>{getInitials(user.name || '')}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 名前フィールド */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名前</FormLabel>
                    <FormControl>
                      <Input placeholder="名前" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* メールアドレスフィールド */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メールアドレス</FormLabel>
                    <FormControl>
                      <Input placeholder="example@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ステータスフィールド */}
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
                        <SelectItem value="active">有効</SelectItem>
                        <SelectItem value="trial">お試し</SelectItem>
                        <SelectItem value="inactive">無効</SelectItem>
                        <SelectItem value="withdrawn">退会</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 権限フィールド */}
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
            
            {/* 試用期間設定（statusがtrialの場合のみ表示） */}
            {form.watch('status') === 'trial' && (
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
                          個別の試用期間を設定します（デフォルト: 14日）
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
                
                <FormField
                  control={form.control}
                  name="autoDisable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>試用期限切れ後に自動的に無効化</FormLabel>
                        <FormDescription>
                          試用期間終了時に自動的にステータスを「無効」に変更します
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
              </div>
            )}
            
            {/* ウェブフックURL */}
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ウェブフックURL（オプション）</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/webhook" {...field} />
                  </FormControl>
                  <FormDescription>
                    ステータス変更時に通知を受け取るURLを設定します
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* メモフィールド */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メモ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="会員に関するメモや備考を入力してください"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            {user ? (
              <>
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button" disabled={isSubmitting}>
                      <Trash className="mr-2 h-4 w-4" />
                      削除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>会員を削除しますか？</AlertDialogTitle>
                      <AlertDialogDescription>
                        この操作は取り消せません。会員を削除すると、すべてのデータが失われます。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteMember();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            削除中...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            削除する
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      登録
                    </>
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}