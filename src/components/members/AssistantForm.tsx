'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Assistant } from './AssistantList';

type AssistantFormProps = {
  initialData?: Assistant;
  isEditing?: boolean;
};

export default function AssistantForm({ initialData, isEditing = false }: AssistantFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Assistant>>({
    name: '',
    title: '',
    description: '',
    systemPrompt: '',
    initialMessage: '',
    referenceDocuments: '',
  });

  // 編集モードの場合、初期データをフォームに設定
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        ...initialData,
      });
    }
  }, [isEditing, initialData]);

  // フォーム入力の変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (!formData.name || !formData.title || !formData.systemPrompt || !formData.initialMessage) {
      toast({
        title: '入力エラー',
        description: '必須項目を入力してください',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 新規作成または更新APIを呼び出し
      const url = isEditing
        ? `/api/assistants/${initialData?.id}`
        : '/api/assistants';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(isEditing 
          ? 'アシスタントの更新に失敗しました' 
          : 'アシスタントの作成に失敗しました');
      }

      toast({
        title: isEditing ? '更新完了' : '作成完了',
        description: isEditing
          ? 'アシスタントを更新しました'
          : 'アシスタントを作成しました',
      });

      // 成功したらアシスタント一覧ページに戻る
      router.push('/assistants');
      router.refresh();
    } catch (error) {
      console.error('アシスタント保存エラー:', error);
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">システム名（英数字）<span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                placeholder="システム内部で使用される名前（例: web-assistant）"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">半角英数字とハイフンのみ使用可</p>
            </div>
            <div>
              <Label htmlFor="title">表示名<span className="text-red-500">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="ユーザーに表示される名前（例: Webサイト・LP）"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="アシスタントの簡単な説明"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="systemPrompt">システムプロンプト<span className="text-red-500">*</span></Label>
            <Textarea
              id="systemPrompt"
              name="systemPrompt"
              value={formData.systemPrompt || ''}
              onChange={handleChange}
              placeholder="AIに対する基本的な指示（アシスタントの役割や制約）"
              rows={5}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">AIの振る舞いを定義する重要な指示です。詳細に記述してください。</p>
          </div>

          <div>
            <Label htmlFor="initialMessage">初期メッセージ<span className="text-red-500">*</span></Label>
            <Textarea
              id="initialMessage"
              name="initialMessage"
              value={formData.initialMessage || ''}
              onChange={handleChange}
              placeholder="会話開始時に表示される最初のメッセージ"
              rows={3}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="referenceDocuments">参考資料（JSON形式）</Label>
            <Textarea
              id="referenceDocuments"
              name="referenceDocuments"
              value={formData.referenceDocuments || ''}
              onChange={handleChange}
              placeholder='[{"title": "資料1", "content": "資料の内容..."}]'
              rows={5}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">JSON配列形式で入力してください。空欄でも構いません。</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? '更新' : '作成'}
          </Button>
        </div>
      </form>
    </Card>
  );
}