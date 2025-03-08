'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '@/lib/api/chat';

// LP構築状態の型定義
interface LPBuildState {
  lpId: string | null;
  title: string;
  chatMessages: Message[];
  lpContent: string;
  designStyle: string;
  designDescription: string;
  isComplete: {
    info: boolean;
    generate: boolean;
    design: boolean;
  };
}

// コンテキストの型
interface LPBuilderContextType {
  state: LPBuildState;
  setChatMessages: (messages: Message[]) => void;
  setLPContent: (content: string, style: string, description: string) => void;
  completePhase: (phase: 'info' | 'generate' | 'design') => void;
  resetState: () => void;
}

// 初期状態
const initialState: LPBuildState = {
  lpId: null,
  title: 'ランディングページ作成',
  chatMessages: [],
  lpContent: '',
  designStyle: '',
  designDescription: '',
  isComplete: {
    info: true, // チャットフェーズをスキップするため、初期値をtrueに設定
    generate: false,
    design: false
  }
};

// コンテキストの作成
const LPBuilderContext = createContext<LPBuilderContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function LPBuilderProvider({ 
  children, 
  initialLpId = null,
  initialTitle = 'ランディングページ作成'
}: { 
  children: ReactNode;
  initialLpId?: string | null;
  initialTitle?: string;
}) {
  const [state, setState] = useState<LPBuildState>({
    ...initialState,
    lpId: initialLpId,
    title: initialTitle
  });
  
  // チャットメッセージを保存
  const setChatMessages = (messages: Message[]) => {
    setState(prev => ({
      ...prev,
      chatMessages: messages
    }));
  };
  
  // LP生成コンテンツを保存
  const setLPContent = (content: string, style: string, description: string) => {
    setState(prev => ({
      ...prev,
      lpContent: content,
      designStyle: style,
      designDescription: description
    }));
  };
  
  // フェーズ完了マーク
  const completePhase = (phase: 'info' | 'generate' | 'design') => {
    setState(prev => ({
      ...prev,
      isComplete: {
        ...prev.isComplete,
        [phase]: true
      }
    }));
  };
  
  // 状態リセット
  const resetState = () => {
    setState({
      ...initialState,
      lpId: state.lpId,
      title: state.title
    });
  };
  
  // ローカルストレージへの保存/復元
  useEffect(() => {
    if (typeof window !== 'undefined' && state.lpId) {
      // 状態を保存
      localStorage.setItem(`lp_builder_${state.lpId}`, JSON.stringify(state));
    }
  }, [state]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && state.lpId) {
      // 状態を復元
      const savedState = localStorage.getItem(`lp_builder_${state.lpId}`);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setState(parsedState);
      }
    }
  }, []);
  
  return (
    <LPBuilderContext.Provider value={{ 
      state, 
      setChatMessages, 
      setLPContent, 
      completePhase, 
      resetState 
    }}>
      {children}
    </LPBuilderContext.Provider>
  );
}

// カスタムフック
export function useLPBuilder() {
  const context = useContext(LPBuilderContext);
  if (context === undefined) {
    throw new Error('useLPBuilder must be used within a LPBuilderProvider');
  }
  return context;
}