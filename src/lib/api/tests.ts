/**
 * A/Bテスト関連のAPI呼び出し関数
 */

// テスト一覧を取得
export async function getTests() {
  const response = await fetch('/api/tests');
  
  if (!response.ok) {
    throw new Error('テスト一覧の取得に失敗しました');
  }
  
  return response.json();
}

// テスト詳細を取得
export async function getTestById(testId: string) {
  const response = await fetch(`/api/tests/${testId}`);
  
  if (!response.ok) {
    throw new Error('テスト情報の取得に失敗しました');
  }
  
  return response.json();
}

// 新規テストを作成
export async function createTest(data: {
  projectId: string;
  name: string;
  startDate?: Date | null;
  endDate?: Date | null;
  conversionGoal: string;
  testedComponents: string[];
}) {
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('テストの作成に失敗しました');
  }
  
  return response.json();
}

// テスト情報を更新
export async function updateTest(testId: string, data: {
  name?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  conversionGoal?: string;
  testedComponents?: string[];
  status?: 'scheduled' | 'running' | 'completed' | 'stopped';
}) {
  const response = await fetch(`/api/tests/${testId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('テストの更新に失敗しました');
  }
  
  return response.json();
}

// テストを削除
export async function deleteTest(testId: string) {
  const response = await fetch(`/api/tests/${testId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('テストの削除に失敗しました');
  }
  
  return response.json();
}

// テスト開始
export async function startTest(testId: string) {
  return updateTest(testId, { status: 'running' });
}

// テスト停止
export async function stopTest(testId: string) {
  return updateTest(testId, { status: 'stopped' });
}

// テスト完了
export async function completeTest(testId: string) {
  return updateTest(testId, { status: 'completed' });
}

// 勝者バリアントを適用
export async function applyWinner(testId: string, componentId: string, variantId: string) {
  const response = await fetch(`/api/tests/${testId}/apply-winner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      componentId,
      variantId,
    }),
  });
  
  if (!response.ok) {
    throw new Error('勝者バリアントの適用に失敗しました');
  }
  
  return response.json();
}

// テストのセッション一覧を取得
export async function getTestSessions(testId: string, options?: {
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  
  const url = `/api/tests/${testId}/sessions${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('テストセッションの取得に失敗しました');
  }
  
  return response.json();
}

// イベント一覧を取得
export async function getTestEvents(testId: string, options?: {
  limit?: number;
  offset?: number;
  eventType?: string;
  componentId?: string;
  sessionId?: string;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.eventType) params.append('eventType', options.eventType);
  if (options?.componentId) params.append('componentId', options.componentId);
  if (options?.sessionId) params.append('sessionId', options.sessionId);
  
  const url = `/api/tests/${testId}/events${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('イベント一覧の取得に失敗しました');
  }
  
  return response.json();
}