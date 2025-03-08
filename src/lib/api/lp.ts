// LP APIクライアント

type LP = {
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

// LPs一覧の取得
export async function getLPs(): Promise<LP[]> {
  try {
    // 開発用のモックデータ
    // 本番環境では実際のAPIを呼び出す
    return getMockLPs();
  } catch (error) {
    console.error('Error fetching LPs:', error);
    throw new Error('LPの取得に失敗しました');
  }
}

// 特定LPの取得
export async function getLP(id: string): Promise<LP> {
  try {
    // 開発用のモックデータ
    const lps = await getMockLPs();
    const lp = lps.find((lp) => lp.id === id);
    
    if (!lp) {
      throw new Error('LP not found');
    }
    
    return lp;
  } catch (error) {
    console.error(`Error fetching LP ${id}:`, error);
    throw new Error('LPの取得に失敗しました');
  }
}

// LP作成
export async function createLP(data: Omit<LP, 'id' | 'createdAt' | 'updatedAt'>): Promise<LP> {
  try {
    // 本番環境では実際のAPIを呼び出す
    // ここではモックレスポンスを返す
    const newLP = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 動的ストレージに追加
    dynamicLPs.push(newLP);
    
    return newLP;
  } catch (error) {
    console.error('Error creating LP:', error);
    throw new Error('LPの作成に失敗しました');
  }
}

// LP更新
export async function updateLP(id: string, data: Partial<Omit<LP, 'id' | 'createdAt' | 'updatedAt'>>): Promise<LP> {
  try {
    // 本番環境では実際のAPIを呼び出す
    // ここではモックレスポンスを返す
    const lp = await getLP(id);
    
    const updatedLP = {
      ...lp,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    // 動的ストレージを更新
    const index = dynamicLPs.findIndex(item => item.id === id);
    if (index !== -1) {
      dynamicLPs[index] = updatedLP;
    }
    
    return updatedLP;
  } catch (error) {
    console.error(`Error updating LP ${id}:`, error);
    throw new Error('LPの更新に失敗しました');
  }
}

// LP削除
export async function deleteLP(id: string): Promise<void> {
  try {
    // 本番環境では実際のAPIを呼び出す
    // 動的ストレージから削除
    const index = dynamicLPs.findIndex(lp => lp.id === id);
    if (index !== -1) {
      dynamicLPs.splice(index, 1);
    }
    console.log(`Deleting LP ${id}`);
  } catch (error) {
    console.error(`Error deleting LP ${id}:`, error);
    throw new Error('LPの削除に失敗しました');
  }
}

// LP複製
export async function duplicateLP(id: string): Promise<LP> {
  try {
    // 本番環境では実際のAPIを呼び出す
    const lp = await getLP(id);
    
    const duplicatedLP = {
      ...lp,
      id: Date.now().toString(),
      title: `${lp.title} (コピー)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      conversionRate: 0,
      views: 0,
      conversions: 0,
    };
    
    // 動的ストレージに追加
    dynamicLPs.push(duplicatedLP);
    
    return duplicatedLP;
  } catch (error) {
    console.error(`Error duplicating LP ${id}:`, error);
    throw new Error('LPの複製に失敗しました');
  }
}

// 開発時の動的データストレージ（ブラウザリロードでリセットされる）
let dynamicLPs: LP[] = [
  {
    id: '1',
    title: 'SaaS製品紹介LP',
    description: '新しいSaaS製品の紹介ランディングページ。主な機能と価格プランを紹介。',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?q=80&w=300&h=200&auto=format&fit=crop',
    createdAt: '2023-10-15T12:30:00Z',
    updatedAt: '2023-10-15T12:30:00Z',
    conversionRate: 3.2,
    views: 1250,
    conversions: 40,
  },
  {
    id: '2',
    title: 'メルマガ登録キャンペーン',
    description: '新規メルマガ購読者を増やすためのキャンペーンLP。無料PDFプレゼント付き。',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=300&h=200&auto=format&fit=crop',
    createdAt: '2023-10-20T09:15:00Z',
    updatedAt: '2023-10-20T09:15:00Z',
    conversionRate: 4.7,
    views: 850,
    conversions: 40,
  },
  {
    id: '3',
    title: '秋の特別セール',
    description: '期間限定の秋セールLP。すべての商品が20%オフ。',
    status: 'draft',
    thumbnail: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=300&h=200&auto=format&fit=crop',
    createdAt: '2023-10-25T15:45:00Z',
    updatedAt: '2023-10-25T15:45:00Z',
  },
  {
    id: '4',
    title: 'コーチングサービス販売',
    description: 'パーソナルコーチングサービスの販売LP。カスタマーの声を掲載。',
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=300&h=200&auto=format&fit=crop',
    createdAt: '2023-09-10T10:00:00Z',
    updatedAt: '2023-09-10T10:00:00Z',
    conversionRate: 2.8,
    views: 2100,
    conversions: 59,
  },
];

// モックLP一覧データ取得関数
async function getMockLPs(): Promise<LP[]> {
  // 開発時の動的モックデータを返す
  return dynamicLPs;
}