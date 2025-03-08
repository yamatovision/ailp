// ユーザータイプ
export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// LPプロジェクトタイプ
export interface ILpProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'testing' | 'ended';
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

// LPコンポーネントタイプ
export interface ILpComponent {
  id: string;
  projectId: string;
  componentType: string;
  position: number;
  aiPrompt?: string;
  aiParameters?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// コンポーネントバリアントタイプ
export interface IComponentVariant {
  id: string;
  componentId: string;
  variantType: 'a' | 'b';
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
  reactComponent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// テスト設定タイプ
export interface ITestSetting {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  conversionGoal: string;
  testedComponents: string[];
  status: 'scheduled' | 'running' | 'completed' | 'stopped';
  createdAt: Date;
  updatedAt: Date;
}

// テスト結果タイプ
export interface ITestResult {
  id: string;
  testId: string;
  componentId: string;
  timestamp: Date;
  variantAData: {
    visitors: number;
    conversions: number;
    conversionRate: number;
    timeSpent?: number;
  };
  variantBData: {
    visitors: number;
    conversions: number;
    conversionRate: number;
    timeSpent?: number;
  };
  improvement?: number;
  confidence?: number;
  isSignificant: boolean;
  winningVariant?: 'a' | 'b' | null;
  keyInsights?: string[];
  deviceData?: {
    desktop: {
      variantA: { visitors: number; conversions: number; conversionRate: number };
      variantB: { visitors: number; conversions: number; conversionRate: number };
      winner?: 'a' | 'b' | null;
    };
    mobile: {
      variantA: { visitors: number; conversions: number; conversionRate: number };
      variantB: { visitors: number; conversions: number; conversionRate: number };
      winner?: 'a' | 'b' | null;
    };
  };
  winningFactors?: string;
  appliedToProduction: boolean;
  appliedAt?: Date;
}

// APIレスポンスタイプ
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ページネーションタイプ
export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}