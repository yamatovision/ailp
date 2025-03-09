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
  designSystem?: any; // デザインシステム情報を追加
  sections?: any[]; // セクション情報を追加
  isComplete: {
    generate: boolean;
    structure: boolean; // 構造分析フェーズを必須に変更
    design: boolean;
  };
}

// コンテキストの型
interface LPBuilderContextType {
  state: LPBuildState;
  setChatMessages: (messages: Message[]) => void;
  setLPContent: (content: string, style: string, description: string) => void;
  setDesignSystem: (designSystem: any) => void; // デザインシステム設定関数を追加
  setSections: (sections: any[]) => void; // セクション設定関数を追加
  setTitle: (title: string) => void;  // タイトル設定関数を追加
  completePhase: (phase: 'generate' | 'structure' | 'design') => void;
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
  sections: [],
  isComplete: {
    generate: false,
    structure: false,
    design: false
  }
};

// コンテキストの作成
const LPBuilderContext = createContext<LPBuilderContextType | undefined>(undefined);

// プロバイダーコンポーネント
export function LPBuilderProvider({ 
  children, 
  initialLpId = null,
  initialTitle = 'ランディングページ作成',
  initialLpContent = ''
}: { 
  children: ReactNode;
  initialLpId?: string | null;
  initialTitle?: string;
  initialLpContent?: string;
}) {
  const [state, setState] = useState<LPBuildState>({
    ...initialState,
    lpId: initialLpId,
    title: initialTitle,
    lpContent: initialLpContent
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
  
  // セクションを設定
  const setSections = (sections: any[]) => {
    setState(prev => ({
      ...prev,
      sections
    }));
  };
  
  // デザインシステムを設定
  const setDesignSystem = (designSystem: any) => {
    setState(prev => ({
      ...prev,
      designSystem
    }));
    
    // LocalStorageにも保存（LPIDが存在する場合）
    if (typeof window !== 'undefined' && state.lpId) {
      try {
        // 最新のキャッシュIDを生成
        const cacheId = `design_system_cache_${Date.now()}`;
        localStorage.setItem(`design_system_latest_${state.lpId}`, cacheId);
        localStorage.setItem(cacheId, JSON.stringify(designSystem));
        
        // 旧形式の互換性のために残す
        localStorage.setItem(`design_system_full_${state.lpId}`, JSON.stringify(designSystem));
        
        console.log('デザインシステムをLocalStorageに保存:', state.lpId);
        
        // 他のコンポーネントに変更を通知するためのカスタムイベントを発行
        const event = new CustomEvent('designSystemUpdated', { 
          detail: { 
            lpId: state.lpId,
            designSystem
          } 
        });
        window.dispatchEvent(event);
      } catch (e) {
        console.error('デザインシステムの保存に失敗:', e);
      }
    }
  };
  
  // タイトルを設定
  const setTitle = (title: string) => {
    setState(prev => ({
      ...prev,
      title
    }));
  };
  
  // フェーズ完了マーク
  const completePhase = (phase: 'generate' | 'structure' | 'design') => {
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
  
  // ローカルストレージへの保存/復元 - 防止策としてデバウンスとクリティカルな変更のみ保存
  useEffect(() => {
    // ローカルストレージに保存するための条件
    if (typeof window !== 'undefined' && state.lpId) {
      // クリティカルな変更がない場合はスキップ
      // 保存によるちらつきを防ぐため、コンテンツの変更など重要な場合のみ保存する
      const saveTimeout = setTimeout(() => {
        try {
          // LocalStorageにはタイトルと基本設定だけを保存
          // セクションや詳細データはデータベースに保存されているため冗長
          const minimalState = {
            lpId: state.lpId,
            title: state.title,
            lpContent: state.lpContent,
            designStyle: state.designStyle,
            designDescription: state.designDescription,
            isComplete: state.isComplete
          };
          
          localStorage.setItem(`lp_builder_${state.lpId}`, JSON.stringify(minimalState));
          console.log('LPBuilderContext - Minimal state saved to localStorage');
        } catch (error) {
          console.error('LPBuilderContext - Error saving state to localStorage:', error);
        }
      }, 1000); // 1秒のデバウンス
      
      return () => clearTimeout(saveTimeout);
    }
  }, [state.title, state.lpContent, state.designStyle, state.designDescription, state.isComplete]);
  
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
      setDesignSystem,
      setSections,
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