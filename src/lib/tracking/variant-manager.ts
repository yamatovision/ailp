/**
 * バリアント管理ユーティリティ
 * ABテストのバリアント割り当て、取得、制御を管理するユーティリティ
 */

import { getOrCreateSession, getComponentVariant, updateSessionVariant, SessionInfo } from './session';

// バリアント情報の型定義
export interface VariantInfo {
  id: string;
  componentId: string;
  variant: 'a' | 'b';
  html: string;
  css?: string;
  js?: string;
}

// バリアント割り当ての型定義
export interface VariantAssignment {
  componentId: string;
  variant: 'a' | 'b';
  forced: boolean;
}

/**
 * すべてのコンポーネントのバリアント割り当てを一度に取得
 */
export function getAllVariantAssignments(componentIds: string[]): Record<string, 'a' | 'b'> {
  const assignments: Record<string, 'a' | 'b'> = {};
  
  for (const componentId of componentIds) {
    assignments[componentId] = getComponentVariant(componentId);
  }
  
  return assignments;
}

/**
 * 特定のコンポーネントのバリアント情報を取得
 * バリアントデータはAPIから取得する必要があるため、APIレスポンスのキャッシュを利用
 */
export function getVariantContent(
  componentId: string,
  variant: 'a' | 'b',
  componentsData: any[] // コンポーネントデータの型はAPIレスポンスに依存
): string | null {
  try {
    // 対象のコンポーネントを探す
    const component = componentsData.find(c => c.id === componentId);
    if (!component) {
      console.error(`Component not found: ${componentId}`);
      return null;
    }
    
    // バリアントAはコンポーネント本体のHTMLを使用
    if (variant === 'a') {
      return component.html || null;
    }
    
    // バリアントBは専用のバリアントデータから取得
    if (component.variants && component.variants.length > 0) {
      const variantB = component.variants.find((v: any) => v.variant === 'b');
      if (variantB) {
        return variantB.html || null;
      }
    }
    
    // バリアントBがない場合はバリアントAを返す（フォールバック）
    return component.html || null;
  } catch (error) {
    console.error('Error getting variant content:', error);
    return null;
  }
}

/**
 * バリアントの割り当て率を更新（ABテスト分析に基づく自動最適化などに使用）
 * この関数はまだサーバー側での実装が必要
 */
export function updateVariantDistribution(
  componentId: string,
  distribution: { a: number, b: number } // 割合（合計が1になる）
): Promise<boolean> {
  // ここではクライアント側からの呼び出しはAPIを使用する想定
  // 実際には管理者権限などの確認が必要
  return fetch(`/api/components/${componentId}/distribution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(distribution)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        return true;
      }
      throw new Error(data.error || 'Failed to update variant distribution');
    })
    .catch(error => {
      console.error('Error updating variant distribution:', error);
      return false;
    });
}

/**
 * すべてのセッションのバリアント割り当てを強制的に指定のバリアントに設定（緊急時用）
 * この関数はサーバー側での実装が必要（管理者権限のAPI）
 */
export function forceGlobalVariant(variant: 'a' | 'b'): Promise<boolean> {
  // ここでは管理者権限チェックとAPI呼び出しが必要
  // 実装は別途サーバーサイドで行う
  return fetch('/api/tests/force-variant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        return true;
      }
      throw new Error(data.error || 'Failed to force global variant');
    })
    .catch(error => {
      console.error('Error forcing global variant:', error);
      return false;
    });
}

/**
 * 現在のURLにバリアントパラメータを追加して共有用URLを生成
 */
export function generateSharingUrl(
  componentId: string, 
  variant: 'a' | 'b',
  includeAllVariants = false
): string {
  if (typeof window === 'undefined') {
    return '';
  }
  
  const url = new URL(window.location.href);
  
  if (includeAllVariants) {
    // 現在のセッションのすべてのバリアント割り当てをURLに含める
    const session = getOrCreateSession();
    Object.entries(session.variants).forEach(([id, v]) => {
      url.searchParams.set(`variant_${id}`, v);
    });
  } else {
    // 指定されたコンポーネントのバリアントのみをURLに含める
    url.searchParams.set(`variant_${componentId}`, variant);
  }
  
  return url.toString();
}

/**
 * バリアント表示を強制的に切り替える（プレビュー機能用）
 */
export function switchVariantForPreview(
  componentId: string,
  variant: 'a' | 'b'
): void {
  // セッションを更新
  updateSessionVariant(componentId, variant);
  
  // URLパラメータも更新（ページリロードなしでURL状態を同期）
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set(`variant_${componentId}`, variant);
    
    // 履歴に追加（ページをリロードせずにURLを更新）
    window.history.pushState({}, '', url.toString());
  }
}

/**
 * コンバージョン目標のバリアント別達成率を計算（クライアント側集計用）
 */
export interface ConversionStats {
  a: {
    views: number;
    conversions: number;
    rate: number;
  };
  b: {
    views: number;
    conversions: number;
    rate: number;
  };
  improvement: number; // Bの改善率 (負の値ならAの方が良い)
  significantDifference: boolean; // 統計的有意差があるか
}

/**
 * クライアント側でのバリアント情報のローカルストレージへの保存
 * (デバッグや一時的なデータ保持用)
 */
export function saveVariantDataLocally(
  componentId: string,
  variantData: any
): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const storageKey = `variant_data_${componentId}`;
    localStorage.setItem(storageKey, JSON.stringify(variantData));
  } catch (error) {
    console.error('Error saving variant data locally:', error);
  }
}

/**
 * ローカルに保存したバリアント情報の取得
 */
export function getLocalVariantData(componentId: string): any {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const storageKey = `variant_data_${componentId}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting local variant data:', error);
    return null;
  }
}