import { User } from '@prisma/client';

// ユーザータイプの拡張
export type UserWithStatus = User & {
  status: 'active' | 'trial' | 'inactive' | 'withdrawn';
  role: 'admin' | 'user';
  plan: 'basic' | 'premium';
  lastLoginAt?: Date | null;
  notes?: string | null;
  lpCount?: number;
  conversionRate?: number;
  expirationDate?: Date | null;
};

// 会員一覧取得のためのパラメータ
interface GetMembersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  orderBy?: string;
  direction?: 'asc' | 'desc';
}

// 会員一覧のレスポンス型
interface GetMembersResponse {
  data: UserWithStatus[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 会員作成・更新のパラメータ
interface MemberData {
  name: string;
  email: string;
  status: 'active' | 'trial' | 'inactive' | 'withdrawn';
  role: 'admin' | 'user';
  plan: 'basic' | 'premium';
  customTrialPeriod?: boolean;
  trialPeriodDays?: number;
  autoDisable?: boolean;
  webhookUrl?: string;
  notes?: string;
}

// 招待パラメータ
interface InviteData {
  emails: string[];
  role: 'admin' | 'user';
  plan: 'basic' | 'premium';
  status: 'active' | 'trial';
  customTrialPeriod?: boolean;
  trialPeriodDays?: number;
  sendWelcomeEmail?: boolean;
  message?: string;
}

// 会員一覧を取得する
export async function getMembers(params: GetMembersParams = {}): Promise<GetMembersResponse> {
  // URLパラメータの構築
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.orderBy) queryParams.append('orderBy', params.orderBy);
  if (params.direction) queryParams.append('direction', params.direction);

  // APIリクエスト
  const response = await fetch(`/api/members?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('会員一覧の取得に失敗しました');
  }

  return await response.json();
}

// 会員詳細を取得する
export async function getMember(id: string): Promise<UserWithStatus> {
  const response = await fetch(`/api/members/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('会員情報の取得に失敗しました');
  }

  return await response.json();
}

// 会員を作成する
export async function createMember(data: MemberData): Promise<UserWithStatus> {
  const response = await fetch('/api/members', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('会員の作成に失敗しました');
  }

  return await response.json();
}

// 会員情報を更新する
export async function updateMember(id: string, data: Partial<MemberData>): Promise<UserWithStatus> {
  const response = await fetch(`/api/members/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('会員情報の更新に失敗しました');
  }

  return await response.json();
}

// 会員を削除する
export async function deleteMember(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/members/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('会員の削除に失敗しました');
  }

  return await response.json();
}

// 招待メールを送信する
export async function inviteMembers(data: InviteData): Promise<{ success: boolean; count: number }> {
  const response = await fetch('/api/members/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('招待メールの送信に失敗しました');
  }

  return await response.json();
}

// 会員アクティビティを取得する
export async function getMemberActivities(memberId?: string, limit?: number): Promise<any[]> {
  // URLパラメータの構築
  const queryParams = new URLSearchParams();
  if (memberId) queryParams.append('memberId', memberId);
  if (limit) queryParams.append('limit', limit.toString());

  const response = await fetch(`/api/members/activities?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('アクティビティの取得に失敗しました');
  }

  return await response.json();
}