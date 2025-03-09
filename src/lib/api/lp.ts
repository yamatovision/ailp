// LP APIクライアント

export type LP = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  conversionRate?: number;
  views?: number;
  conversions?: number;
};

export type Component = {
  id: string;
  projectId: string;
  componentType: string;
  position: number;
  aiPrompt?: string | null;
  aiParameters?: any | null;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
};

export type Variant = {
  id: string;
  componentId: string;
  variantType: string;
  htmlContent?: string | null;
  cssContent?: string | null;
  jsContent?: string | null;
  reactComponent?: string | null;
  metadata?: any | null;
  createdAt: string;
  updatedAt: string;
};

// パラメータ型
type GetLPsParams = {
  status?: string;
  search?: string;
  sortBy?: string;
  limit?: number;
  skip?: number;
};

// API呼び出し用ヘルパー関数
async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    // クライアントサイドでのみセッション取得
    let authToken;
    
    if (typeof window !== 'undefined') {
      try {
        // Supabase APIからセッションを取得
        const { supabase } = await import('@/lib/supabase');
        const { data } = await supabase.auth.getSession();
        
        if (data?.session?.access_token) {
          authToken = data.session.access_token;
        }
      } catch (e) {
        console.error('認証トークン取得エラー:', e);
      }
    }
    
    // リクエストオプション設定
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
      // Cookieを送信するために必須
      credentials: 'include',
    };
    
    // APIリクエストを実行
    const response = await fetch(url, fetchOptions);
    
    // 認証エラー処理
    if (response.status === 401) {
      // ログインページへリダイレクト
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=session_expired';
      }
      throw new Error('認証エラー: セッションの期限切れまたは無効です。再ログインしてください。');
    }
    
    // JSONレスポンス処理
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `APIエラー: ${response.status} ${response.statusText}`);
      }
      
      return data;
    } else {
      // JSON以外のレスポンス処理
      throw new Error(`APIがJSON以外のレスポンスを返しました: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// LPs一覧の取得
export async function getLPs(params?: GetLPsParams): Promise<{ lps: LP[], pagination: any }> {
  try {
    // URLパラメータの構築
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    
    const url = `/api/lp${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await fetchAPI<{ lps: LP[], pagination: any }>(url);
  } catch (error) {
    console.error('Error fetching LPs:', error);
    throw new Error('LPの取得に失敗しました');
  }
}

// 特定LPの取得
export async function getLP(id: string): Promise<LP> {
  try {
    const { lp } = await fetchAPI<{ lp: LP }>(`/api/lp/${id}`);
    return lp;
  } catch (error) {
    console.error(`Error fetching LP ${id}:`, error);
    throw new Error('LPの取得に失敗しました');
  }
}

// LP作成
export async function createLP(data: { title: string; description?: string; status?: string; thumbnail?: string }): Promise<LP> {
  try {
    const { lp } = await fetchAPI<{ lp: LP }>('/api/lp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return lp;
  } catch (error) {
    console.error('Error creating LP:', error);
    throw new Error('LPの作成に失敗しました');
  }
}

// LP更新
export async function updateLP(id: string, data: { title?: string; description?: string; status?: string; thumbnail?: string }): Promise<LP> {
  try {
    const { lp } = await fetchAPI<{ lp: LP }>(`/api/lp/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return lp;
  } catch (error) {
    console.error(`Error updating LP ${id}:`, error);
    throw new Error('LPの更新に失敗しました');
  }
}

// LP削除
export async function deleteLP(id: string): Promise<void> {
  try {
    await fetchAPI<{ success: boolean }>(`/api/lp/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting LP ${id}:`, error);
    throw new Error('LPの削除に失敗しました');
  }
}

// LP複製
export async function duplicateLP(id: string): Promise<LP> {
  try {
    const { lp } = await fetchAPI<{ lp: LP }>(`/api/lp/${id}?action=duplicate`, {
      method: 'POST',
    });
    
    return lp;
  } catch (error) {
    console.error(`Error duplicating LP ${id}:`, error);
    throw new Error('LPの複製に失敗しました');
  }
}

// コンポーネント一覧の取得
export async function getComponents(projectId: string): Promise<Component[]> {
  try {
    const { components } = await fetchAPI<{ components: Component[] }>(`/api/lp/${projectId}/components`);
    return components;
  } catch (error) {
    console.error(`Error fetching components for project ${projectId}:`, error);
    throw new Error('コンポーネントの取得に失敗しました');
  }
}

// コンポーネント作成
export async function createComponent(projectId: string, data: { componentType: string; position: number; aiPrompt?: string; aiParameters?: any }): Promise<Component> {
  try {
    const { component } = await fetchAPI<{ component: Component }>(`/api/lp/${projectId}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return component;
  } catch (error) {
    console.error(`Error creating component for project ${projectId}:`, error);
    throw new Error('コンポーネントの作成に失敗しました');
  }
}

// コンポーネント更新
export async function updateComponent(id: string, data: { componentType?: string; position?: number; aiPrompt?: string; aiParameters?: any }): Promise<Component> {
  try {
    const { component } = await fetchAPI<{ component: Component }>(`/api/components/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return component;
  } catch (error) {
    console.error(`Error updating component ${id}:`, error);
    throw new Error('コンポーネントの更新に失敗しました');
  }
}

// コンポーネント削除
export async function deleteComponent(id: string): Promise<void> {
  try {
    await fetchAPI<{ success: boolean }>(`/api/components/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting component ${id}:`, error);
    throw new Error('コンポーネントの削除に失敗しました');
  }
}

// コンポーネント位置の一括更新
export async function updateComponentPositions(projectId: string, components: { id: string; position: number }[]): Promise<void> {
  try {
    await fetchAPI<{ success: boolean }>(`/api/lp/${projectId}/components`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ components }),
    });
  } catch (error) {
    console.error(`Error updating component positions for project ${projectId}:`, error);
    throw new Error('コンポーネント位置の更新に失敗しました');
  }
}

// バリアント一覧の取得
export async function getVariants(componentId: string): Promise<Variant[]> {
  try {
    const { variants } = await fetchAPI<{ variants: Variant[] }>(`/api/components/${componentId}/variants`);
    return variants;
  } catch (error) {
    console.error(`Error fetching variants for component ${componentId}:`, error);
    throw new Error('バリアントの取得に失敗しました');
  }
}

// バリアント作成
export async function createVariant(componentId: string, data: { variantType: string; htmlContent?: string; cssContent?: string; jsContent?: string; reactComponent?: string; metadata?: any }): Promise<Variant> {
  try {
    const { variant } = await fetchAPI<{ variant: Variant }>(`/api/components/${componentId}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return variant;
  } catch (error) {
    console.error(`Error creating variant for component ${componentId}:`, error);
    throw new Error('バリアントの作成に失敗しました');
  }
}

// バリアント更新
export async function updateVariant(id: string, data: { variantType?: string; htmlContent?: string; cssContent?: string; jsContent?: string; reactComponent?: string; metadata?: any }): Promise<Variant> {
  try {
    const { variant } = await fetchAPI<{ variant: Variant }>(`/api/variants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return variant;
  } catch (error) {
    console.error(`Error updating variant ${id}:`, error);
    throw new Error('バリアントの更新に失敗しました');
  }
}

// バリアント削除
export async function deleteVariant(id: string): Promise<void> {
  try {
    await fetchAPI<{ success: boolean }>(`/api/variants/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting variant ${id}:`, error);
    throw new Error('バリアントの削除に失敗しました');
  }
}

// コンポーネントの全バリアント削除
export async function deleteAllVariants(componentId: string): Promise<void> {
  try {
    await fetchAPI<{ success: boolean }>(`/api/components/${componentId}/variants`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error deleting all variants for component ${componentId}:`, error);
    throw new Error('バリアントの削除に失敗しました');
  }
}

// LP統合生成API
export async function generateLP(data: { 
  serviceInfo: string;
  targetAudience: string;
  style?: string;
}): Promise<{ sections: any[], stats?: any }> {
  try {
    const result = await fetchAPI<{ sections: any[], stats?: any }>('/api/ai/generate-lp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return result;
  } catch (error) {
    console.error('Error generating LP:', error);
    throw new Error('LPの生成に失敗しました');
  }
}

// LP構造分析API
export async function analyzeStructure(data: { 
  serviceInfo: string;
  targetAudience?: string;
  goals?: string;
}): Promise<{ sections: any[], meta?: any }> {
  try {
    console.log('analyzeStructure: API呼び出し開始', data);
    
    const url = '/api/ai/analyze-structure';
    console.log('analyzeStructure: リクエスト先URL:', url);
    
    const result = await fetchAPI<{ sections: any[], meta?: any }>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log('analyzeStructure: API呼び出し成功', result);
    return result;
  } catch (error) {
    console.error('analyzeStructure: API呼び出しエラー:', error);
    throw new Error('LP構造の分析に失敗しました');
  }
}

// デザインシステム保存API
export async function saveDesignSystem(lpId: string, data: {
  designSystem: any;
  designStyle: string;
}): Promise<{ success: boolean; message: string; lp: any }> {
  try {
    console.log('saveDesignSystem: API呼び出し開始', { lpId, designStyle: data.designStyle });
    
    // デザインシステムが大きすぎる場合にログに出力しないようにする
    const isBigDesignSystem = JSON.stringify(data.designSystem).length > 1000;
    
    const url = `/api/lp/${lpId}/design-system`;
    const result = await fetchAPI<{ success: boolean; message: string; lp: any }>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log('saveDesignSystem: API呼び出し成功', isBigDesignSystem ? '(デザインシステムデータは大きいため非表示)' : result);
    
    // キャッシュを更新（ローカルストレージにも保存）
    if (typeof window !== 'undefined') {
      try {
        // リクエストごとに新しいキャッシュIDを生成
        const cacheId = `design_system_cache_${Date.now()}`;
        localStorage.setItem(`design_system_latest_${lpId}`, cacheId);
        localStorage.setItem(cacheId, JSON.stringify(data.designSystem));
        console.log('デザインシステムをキャッシュに保存しました');
      } catch (e) {
        console.error('キャッシュ保存エラー:', e);
      }
    }
    
    return result;
  } catch (error) {
    console.error('saveDesignSystem: API呼び出しエラー:', error);
    
    // エラーの詳細情報を確認
    let errorMessage = 'デザインシステムの保存に失敗しました';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    // オフライン時やネットワークエラー時の対策（リトライロジック）
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      // ネットワークエラーの場合、ローカルストレージに一時保存
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`design_system_pending_${lpId}`, JSON.stringify({
            designSystem: data.designSystem,
            designStyle: data.designStyle,
            timestamp: Date.now()
          }));
          console.warn('ネットワークエラー: デザインシステムを一時保存しました。オンライン時に再試行します。');
        } catch (e) {
          console.error('一時保存エラー:', e);
        }
      }
    }
    
    throw new Error(errorMessage);
  }
}

// デザインシステム取得API（キャッシュ戦略付き）
export async function getDesignSystem(lpId: string): Promise<{ designSystem: any; designStyle: string }> {
  // 先にローカルストレージから取得を試みる（最新のキャッシュがあれば）
  if (typeof window !== 'undefined') {
    try {
      const latestCacheId = localStorage.getItem(`design_system_latest_${lpId}`);
      if (latestCacheId) {
        const cachedData = localStorage.getItem(latestCacheId);
        if (cachedData) {
          const designSystem = JSON.parse(cachedData);
          const designStyle = localStorage.getItem(`design_system_style_${lpId}`) || 'corporate';
          console.log('キャッシュからデザインシステムを取得しました');
          return { designSystem, designStyle };
        }
      }
      
      // 保留中のデータがあるか確認（オフライン時に保存された可能性）
      const pendingData = localStorage.getItem(`design_system_pending_${lpId}`);
      if (pendingData) {
        const { designSystem, designStyle, timestamp } = JSON.parse(pendingData);
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        
        // 2時間以内のデータなら使用
        if (timestamp > twoHoursAgo) {
          console.log('保留中のデザインシステムデータを取得しました');
          // 保留データを使用しつつ、APIからも最新データを取得（バックグラウンドで）
          setTimeout(() => {
            fetchFromAPI().catch(e => console.error('バックグラウンド更新エラー:', e));
          }, 0);
          return { designSystem, designStyle };
        }
      }
    } catch (e) {
      console.error('キャッシュ取得エラー:', e);
    }
  }
  
  // APIから取得
  return await fetchFromAPI();
  
  // APIからデータを取得する内部関数
  async function fetchFromAPI(): Promise<{ designSystem: any; designStyle: string }> {
    try {
      console.log('getDesignSystem: API呼び出し開始', { lpId });
      
      const url = `/api/lp/${lpId}/design-system`;
      const result = await fetchAPI<{ designSystem: any; designStyle: string }>(url, {
        method: 'GET',
      });
      
      console.log('getDesignSystem: API呼び出し成功');
      
      // キャッシュを更新
      if (typeof window !== 'undefined' && result.designSystem) {
        try {
          // 新しいキャッシュIDを生成
          const cacheId = `design_system_cache_${Date.now()}`;
          localStorage.setItem(`design_system_latest_${lpId}`, cacheId);
          localStorage.setItem(cacheId, JSON.stringify(result.designSystem));
          localStorage.setItem(`design_system_style_${lpId}`, result.designStyle);
          console.log('デザインシステムをキャッシュに保存しました');
          
          // 保留中のデータがあれば削除
          localStorage.removeItem(`design_system_pending_${lpId}`);
        } catch (e) {
          console.error('キャッシュ保存エラー:', e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('getDesignSystem: API呼び出しエラー:', error);
      
      // エラーの詳細情報を確認
      let errorMessage = 'デザインシステムの取得に失敗しました';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }
}