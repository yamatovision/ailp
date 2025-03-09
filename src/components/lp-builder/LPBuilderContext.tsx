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
  setTitle: (title: string) => void;  // タイトル設定関数を追加
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
  
  // タイトルを設定
  const setTitle = (title: string) => {
    setState(prev => ({
      ...prev,
      title
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
      console.log('LPBuilderContext - State saved to localStorage:', state);
    }
  }, [state]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && state.lpId) {
      // URLからフラグを確認（強制リロード用）
      const searchParams = new URLSearchParams(window.location.search);
      const forceLoad = searchParams.get('forceLoad') === 'true';
      
      // 状態を復元
      const savedState = localStorage.getItem(`lp_builder_${state.lpId}`);
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          console.log('LPBuilderContext - Loading state from localStorage:', parsedState);
          
          // 設計画面に移動前の特別処理
          if (window.location.pathname.includes('/edit/design')) {
            // LP内容やフラグの強制設定
            const forceLoad = window.location.search.includes('forceLoad=true');
            const hasCookie = document.cookie.includes(`lpbuilder_${state.lpId}=true`);
            
            // LPデータからデフォルト値を抽出
            let fallbackContent = '';
            try {
              // descriptionからLP内容を抽出（APIから取得したデータを利用）
              const descMatch = /# LP内容の概要\s*([\s\S]*)/i.exec(parsedState.description || '');
              if (descMatch && descMatch[1]) {
                fallbackContent = descMatch[1].trim();
                console.log('LPBuilderContext - Extracted content from description');
              }
            } catch (e) {
              console.error('Error extracting content', e);
            }
            
            // 強制的に必要なデータを設定
            if (!parsedState.lpContent && fallbackContent) {
              parsedState.lpContent = fallbackContent;
              console.log('LPBuilderContext - Forced content from description');
            }
            
            if (!parsedState.designStyle) {
              parsedState.designStyle = 'corporate';
              console.log('LPBuilderContext - Forced default design style');
            }
            
            // 常に生成フェーズを完了済みにする
            parsedState.isComplete = {
              ...parsedState.isComplete,
              info: true,
              generate: true
            };
            
            console.log('LPBuilderContext - Force updated state for design page:', parsedState);
            
            // LocalStorageも更新
            localStorage.setItem(`lp_builder_${state.lpId}`, JSON.stringify(parsedState));
          }
          
          setState(parsedState);
        } catch (error) {
          console.error('LPBuilderContext - Error parsing saved state:', error);
        }
      }
    }
  }, []);
  
  return (
    <LPBuilderContext.Provider value={{ 
      state, 
      setChatMessages, 
      setLPContent,
      setTitle, 
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