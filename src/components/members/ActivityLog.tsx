'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, UserMinus, Mail, Settings, Edit, 
  PieChart, FileText, Activity, Check, AlertTriangle 
} from 'lucide-react';

// アクティビティのタイプ
type ActivityType = 
  | 'registration' 
  | 'login' 
  | 'status_change' 
  | 'plan_change'
  | 'email_sent'
  | 'lp_created'
  | 'test_started'
  | 'test_completed'
  | 'settings_updated'
  | 'withdrawal';

// アクティビティの詳細情報
interface ActivityItem {
  id: string;
  type: ActivityType;
  userId: string;
  userName?: string;
  userEmail?: string;
  userImage?: string | null;
  timestamp: Date;
  details?: {
    [key: string]: any;
  };
}

// アクティビティタイプごとの表示設定
const activityConfig: Record<ActivityType, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
}> = {
  registration: {
    icon: <UserPlus className="h-4 w-4" />,
    label: '登録',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  login: {
    icon: <Check className="h-4 w-4" />,
    label: 'ログイン',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  status_change: {
    icon: <Edit className="h-4 w-4" />,
    label: 'ステータス変更',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  plan_change: {
    icon: <Settings className="h-4 w-4" />,
    label: 'プラン変更',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  email_sent: {
    icon: <Mail className="h-4 w-4" />,
    label: 'メール送信',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  lp_created: {
    icon: <FileText className="h-4 w-4" />,
    label: 'LP作成',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  test_started: {
    icon: <Activity className="h-4 w-4" />,
    label: 'テスト開始',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
  },
  test_completed: {
    icon: <PieChart className="h-4 w-4" />,
    label: 'テスト完了',
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
  },
  settings_updated: {
    icon: <Settings className="h-4 w-4" />,
    label: '設定更新',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
  },
  withdrawal: {
    icon: <UserMinus className="h-4 w-4" />,
    label: '退会',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
};

// 日付フォーマット用の関数
const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// ユーザー名の頭文字取得用の関数
const getInitials = (name: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

// アクティビティ内容の表示用テキスト生成
const getActivityText = (activity: ActivityItem) => {
  switch (activity.type) {
    case 'registration':
      return 'アカウントが登録されました';
    case 'login':
      return 'ログインしました';
    case 'status_change':
      return `ステータスが ${activity.details?.oldStatus} から ${activity.details?.newStatus} に変更されました`;
    case 'plan_change':
      return `プランが ${activity.details?.oldPlan} から ${activity.details?.newPlan} に変更されました`;
    case 'email_sent':
      return `${activity.details?.subject || 'メール'} が送信されました`;
    case 'lp_created':
      return `新しいLP "${activity.details?.lpTitle}" が作成されました`;
    case 'test_started':
      return `"${activity.details?.testName}" テストが開始されました`;
    case 'test_completed':
      return `"${activity.details?.testName}" テストが完了しました`;
    case 'settings_updated':
      return 'アカウント設定が更新されました';
    case 'withdrawal':
      return 'アカウントが退会しました';
    default:
      return '不明なアクティビティ';
  }
};

// モックデータ - 実際の実装では削除してAPI呼び出しに置き換え
const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'registration',
    userId: '1',
    userName: '山田 太郎',
    userEmail: 'yamada@example.com',
    userImage: null,
    timestamp: new Date('2023-09-01T08:30:00Z'),
  },
  {
    id: '2',
    type: 'login',
    userId: '1',
    userName: '山田 太郎',
    userEmail: 'yamada@example.com',
    userImage: null,
    timestamp: new Date('2023-10-21T14:45:00Z'),
  },
  {
    id: '3',
    type: 'lp_created',
    userId: '1',
    userName: '山田 太郎',
    userEmail: 'yamada@example.com',
    userImage: null,
    timestamp: new Date('2023-10-22T10:15:00Z'),
    details: {
      lpTitle: 'サマーキャンペーンLP',
      lpId: 'lp-123',
    },
  },
  {
    id: '4',
    type: 'test_started',
    userId: '1',
    userName: '山田 太郎',
    userEmail: 'yamada@example.com',
    userImage: null,
    timestamp: new Date('2023-10-23T09:30:00Z'),
    details: {
      testName: 'ヘッダーA/Bテスト',
      testId: 'test-456',
    },
  },
  {
    id: '5',
    type: 'status_change',
    userId: '2',
    userName: '佐藤 花子',
    userEmail: 'sato@example.com',
    userImage: null,
    timestamp: new Date('2023-10-20T11:20:00Z'),
    details: {
      oldStatus: 'active',
      newStatus: 'trial',
      changedBy: 'admin',
    },
  },
];

interface ActivityLogProps {
  userId?: string; // 特定ユーザーのアクティビティに絞る場合は指定
  limit?: number; // 表示上限
}

export function ActivityLog({ userId, limit = 10 }: ActivityLogProps) {
  // ユーザーIDが指定されている場合はそのユーザーのアクティビティのみ表示
  const activities = userId 
    ? mockActivities.filter(activity => activity.userId === userId)
    : mockActivities;

  // 日付順に降順ソート（新しい順）して表示上限に制限
  const sortedActivities = [...activities]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">アクティビティログ</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedActivities.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">
            アクティビティの記録がありません
          </p>
        ) : (
          <div className="space-y-4">
            {sortedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${activityConfig[activity.type].bgColor}`}>
                  <div className={activityConfig[activity.type].color}>
                    {activityConfig[activity.type].icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {!userId && activity.userName && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.userImage || ''} alt={activity.userName} />
                          <AvatarFallback>{getInitials(activity.userName)}</AvatarFallback>
                        </Avatar>
                      )}
                      <p className="text-sm font-medium">
                        {!userId && activity.userName ? `${activity.userName} ` : ''}
                        {getActivityText(activity)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activityConfig[activity.type].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}