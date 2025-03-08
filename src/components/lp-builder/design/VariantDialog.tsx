'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface VariantDialogProps {
  onClose: () => void;
  onCreateVariant: (prompt?: string) => void;
  sectionName: string;
  isModifying: boolean;
}

export default function VariantDialog({
  onClose,
  onCreateVariant,
  sectionName,
  isModifying
}: VariantDialogProps) {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">バリアントBの作成</h3>
          <p className="text-sm text-muted-foreground mb-4">
            <strong>{sectionName}</strong>の別バージョンを作成します。AIに指示を与えるか、AIにおまかせすることができます。
          </p>
          
          <Textarea
            placeholder="バリアントBの指示を入力... (例: 「より説得力のある表現にして」「違うレイアウトで」)"
            className="mb-4"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              キャンセル
            </Button>
            
            <Button
              variant="outline"
              className="bg-secondary/50 hover:bg-secondary/70"
              onClick={() => onCreateVariant()}
              disabled={isModifying}
            >
              AIにおまかせ
            </Button>
            
            <Button
              onClick={() => onCreateVariant(prompt)}
              disabled={isModifying}
            >
              {isModifying ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  生成中...
                </>
              ) : (
                'バリアントB作成'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}