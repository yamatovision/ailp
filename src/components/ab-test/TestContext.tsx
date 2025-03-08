'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// テスト構築状態の型定義
interface TestState {
  testId: string | null;
  projectId: string;
  testName: string;
  startDate: Date | null;
  endDate: Date | null;
  conversionGoal: string;
  testedComponents: string[];
  status: 'scheduled' | 'running' | 'completed' | 'stopped';
  selectedVariants: Record<string, 'a' | 'b'>;
}

// コンテキストの型
interface TestContextType {
  state: TestState;
  setTestSettings: (settings: Partial<TestState>) => void;
  addTestedComponent: (componentId: string) => void;
  removeTestedComponent: (componentId: string) => void;
  startTest: () => Promise<void>;
  stopTest: () => Promise<void>;
  resetState: () => void;
}

// 初期状態
const initialState: TestState = {
  testId: null,
  projectId: '',
  testName: 'A/Bテスト',
  startDate: null,
  endDate: null,
  conversionGoal: 'form_submit',
  testedComponents: [],
  status: 'scheduled',
  selectedVariants: {}
};

// コンテキスト作成
const TestContext = createContext<TestContextType | undefined>(undefined);

export function TestProvider({
  children,
  initialProjectId,
  initialTestId = null
}: {
  children: ReactNode;
  initialProjectId: string;
  initialTestId?: string | null;
}) {
  const [state, setState] = useState<TestState>({
    ...initialState,
    projectId: initialProjectId,
    testId: initialTestId
  });
  
  // テスト設定を更新
  const setTestSettings = (settings: Partial<TestState>) => {
    setState(prev => ({
      ...prev,
      ...settings
    }));
  };
  
  // テスト対象コンポーネントを追加
  const addTestedComponent = (componentId: string) => {
    setState(prev => ({
      ...prev,
      testedComponents: [...prev.testedComponents, componentId]
    }));
  };
  
  // テスト対象コンポーネントを削除
  const removeTestedComponent = (componentId: string) => {
    setState(prev => ({
      ...prev,
      testedComponents: prev.testedComponents.filter(id => id !== componentId)
    }));
  };
  
  // テスト開始
  const startTest = async () => {
    try {
      const response = await fetch('/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: state.testId,
          projectId: state.projectId,
          testName: state.testName,
          startDate: state.startDate,
          endDate: state.endDate,
          conversionGoal: state.conversionGoal,
          testedComponents: state.testedComponents
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setState(prev => ({
          ...prev,
          testId: data.testId,
          status: 'running'
        }));
      }
    } catch (error) {
      console.error('Failed to start test:', error);
    }
  };
  
  // テスト停止
  const stopTest = async () => {
    try {
      const response = await fetch(`/api/tests/${state.testId}/stop`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        setState(prev => ({
          ...prev,
          status: 'stopped'
        }));
      }
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };
  
  // 状態リセット
  const resetState = () => {
    setState({
      ...initialState,
      projectId: state.projectId
    });
  };
  
  // ローカルストレージへの保存/復元
  useEffect(() => {
    if (typeof window !== 'undefined' && state.projectId) {
      localStorage.setItem(`ab_test_${state.projectId}`, JSON.stringify(state));
    }
  }, [state]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && state.projectId) {
      const savedState = localStorage.getItem(`ab_test_${state.projectId}`);
      if (savedState) {
        setState(JSON.parse(savedState));
      }
    }
    
    // 初期テストIDがある場合、テスト情報を取得
    if (initialTestId) {
      fetchTestDetails(initialTestId);
    }
  }, [initialProjectId, initialTestId]);
  
  const fetchTestDetails = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}`);
      const data = await response.json();
      
      if (data.test) {
        setState(prev => ({
          ...prev,
          testId: data.test.id,
          testName: data.test.name,
          startDate: new Date(data.test.startDate),
          endDate: data.test.endDate ? new Date(data.test.endDate) : null,
          conversionGoal: data.test.conversionGoal,
          testedComponents: data.test.testedComponents,
          status: data.test.status
        }));
      }
    } catch (error) {
      console.error('Failed to fetch test details:', error);
    }
  };
  
  return (
    <TestContext.Provider value={{
      state,
      setTestSettings,
      addTestedComponent,
      removeTestedComponent,
      startTest,
      stopTest,
      resetState
    }}>
      {children}
    </TestContext.Provider>
  );
}

// カスタムフック
export function useTest() {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
}