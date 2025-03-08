'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

import BuilderHeader from './BuilderHeader';
import ChatInterface from './ChatInterface';
import LPGenerator from './LPGenerator';
import DesignPreview from './DesignPreview';

import { Message } from '@/lib/api/chat';

// フェーズの型
type BuildPhase = 'chat' | 'generate' | 'design';

interface LPBuilderProps {
  lpId?: string;
  title?: string;
}

export default function LPBuilder({ lpId, title = 'ランディングページ作成' }: LPBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState<BuildPhase>('chat');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [lpContent, setLpContent] = useState<string>('');
  const [designStyle, setDesignStyle] = useState<string>('');
  const [designDescription, setDesignDescription] = useState<string>('');
  
  // フェーズを変更するハンドラ
  const handlePhaseChange = (phase: BuildPhase) => {
    // 必要な情報がある場合のみフェーズを変更
    if (phase === 'generate' && chatMessages.length < 2) {
      toast({
        title: "入力が不足しています",
        description: "AIとの対話を続けて、LP作成に必要な情報を入力してください。",
        variant: "destructive",
      });
      return;
    }
    
    if (phase === 'design' && !lpContent) {
      toast({
        title: "LP生成が必要です",
        description: "LP生成を完了してからデザイン調整に進んでください。",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentPhase(phase);
  };
  
  // 戻るボタンのハンドラ
  const handleBack = () => {
    if (lpId) {
      router.push(`/lp/${lpId}`);
    } else {
      router.push('/lp');
    }
  };
  
  // 公開ボタンのハンドラ
  const handlePublish = () => {
    toast({
      title: "LPを公開しました",
      description: "LPが正常に公開されました。",
    });
    
    if (lpId) {
      router.push(`/lp/${lpId}`);
    } else {
      router.push('/lp');
    }
  };
  
  // チャット完了時のハンドラ
  const handleChatComplete = (messages: Message[]) => {
    setChatMessages(messages);
    setCurrentPhase('generate');
  };
  
  // LP生成時のハンドラ
  const handleLPGenerate = (content: string, style: string, description: string) => {
    setLpContent(content);
    setDesignStyle(style);
    setDesignDescription(description);
    setCurrentPhase('design');
  };
  
  // デザイン調整完了時のハンドラ
  const handleDesignComplete = () => {
    toast({
      title: "デザイン調整が完了しました",
      description: "保存するには「公開」ボタンをクリックしてください。",
    });
  };
  
  return (
    <div className="flex flex-col h-screen">
      <BuilderHeader
        title={title}
        currentPhase={currentPhase}
        onPhaseChange={handlePhaseChange}
        onBack={handleBack}
        onPublish={handlePublish}
      />
      
      <div className="flex-1 overflow-hidden">
        {currentPhase === 'chat' && (
          <ChatInterface
            initialMessages={chatMessages}
            onComplete={handleChatComplete}
          />
        )}
        
        {currentPhase === 'generate' && (
          <LPGenerator
            messages={chatMessages}
            onGenerate={handleLPGenerate}
          />
        )}
        
        {currentPhase === 'design' && (
          <DesignPreview
            onComplete={handleDesignComplete}
          />
        )}
      </div>
    </div>
  );
}