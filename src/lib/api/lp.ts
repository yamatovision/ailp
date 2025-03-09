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