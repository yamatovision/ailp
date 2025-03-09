'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Edit2, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

// アシスタントの型定義
export type Assistant = {
  id: string;
  name: string;
  title: string;
  description?: string;
  systemPrompt: string;
  initialMessage: string;
  referenceDocuments?: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function AssistantList() {
  const { toast } = useToast();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // アシスタント一覧を取得
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/assistants');
        
        if (!response.ok) {
          throw new Error('アシスタント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setAssistants(data);
      } catch (error) {
        console.error('アシスタント情報取得エラー:', error);
        toast({
          title: 'エラー',
          description: 'アシスタント情報の取得に失敗しました',
          variant: 'destructive',
        });
        
        // 開発用ダミーデータ
        setAssistants([
          {
            id: 'dummy-1',
            name: 'web-assistant',
            title: 'Webサイト・LP',
            description: 'Webサイトやランディングページの文章作成',
            systemPrompt: 'LP・Webサイト向け文章作成モードです。商品・サービスの特徴、ターゲット層、訴求ポイントなどを教えてください。',
            initialMessage: 'こんにちは！Webサイトやランディングページの文章作成をお手伝いします。どのような内容についてサポートが必要ですか？',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'dummy-2',
            name: 'marketing-assistant',
            title: 'マーケティング',
            description: '広告文、メルマガ、セールスレター',
            systemPrompt: 'マーケティング文書作成モードです。広告文、メルマガ、セールスレターなどの目的やターゲット、訴求内容を教えてください。',
            initialMessage: 'マーケティング資料の作成をサポートします。ターゲット層や訴求ポイントを教えていただけますか？',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssistants();
  }, [toast]);

  // アシスタント削除処理
  const handleDelete = async (id: string) => {
    if (!confirm('このアシスタントを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/assistants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('アシスタントの削除に失敗しました');
      }

      // 成功したら一覧から削除
      setAssistants(assistants.filter(assistant => assistant.id !== id));
      
      toast({
        title: '削除完了',
        description: 'アシスタントを削除しました',
      });
    } catch (error) {
      console.error('アシスタント削除エラー:', error);
      toast({
        title: 'エラー',
        description: 'アシスタントの削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">アシスタント管理</h2>
        <Link href="/assistants/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : assistants.length === 0 ? (
        <div className="bg-gray-50 p-10 text-center rounded-lg">
          <p className="text-gray-500">アシスタントがまだ登録されていません</p>
          <Link href="/assistants/create">
            <Button variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              初めてのアシスタントを作成
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{assistant.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{assistant.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/assistants/${assistant.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(assistant.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-400">システムプロンプト:</p>
                <p className="text-xs mt-1 text-gray-600 line-clamp-2">{assistant.systemPrompt}</p>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-400">初期メッセージ:</p>
                <p className="text-xs mt-1 text-gray-600 line-clamp-2">{assistant.initialMessage}</p>
              </div>
              <div className="mt-4 pt-2 border-t text-xs text-gray-400">
                最終更新: {new Date(assistant.updatedAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}