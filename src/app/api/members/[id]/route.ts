import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// リクエストバリデーションスキーマ
const updateMemberSchema = z.object({
  name: z.string().min(1, { message: '名前は必須です' }).optional(),
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }).optional(),
  status: z.enum(['active', 'trial', 'inactive', 'withdrawn']).optional(),
  role: z.enum(['admin', 'user']).optional(),
  plan: z.enum(['basic', 'premium']).optional(),
  customTrialPeriod: z.boolean().optional(),
  trialPeriodDays: z.number().min(1).max(90).optional(),
  autoDisable: z.boolean().optional(),
  webhookUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// モックユーザーデータ（実際の実装ではDBから取得）
const mockUsers = [
  {
    id: '1',
    name: '山田 太郎',
    email: 'yamada@example.com',
    status: 'active',
    role: 'admin',
    plan: 'premium',
    createdAt: new Date('2023-09-01T08:30:00Z'),
    lastLoginAt: new Date('2023-10-21T14:45:00Z'),
    image: null,
    lpCount: 12,
    conversionRate: 3.8,
    notes: '積極的にLPを作成しているユーザー',
  },
  {
    id: '2',
    name: '佐藤 花子',
    email: 'sato@example.com',
    status: 'trial',
    role: 'user',
    plan: 'basic',
    createdAt: new Date('2023-10-15T10:20:00Z'),
    lastLoginAt: new Date('2023-10-20T09:15:00Z'),
    image: null,
    lpCount: 3,
    conversionRate: 2.1,
    expirationDate: new Date('2023-10-29T23:59:59Z'),
    notes: 'お試し期間中のユーザー',
  },
  {
    id: '3',
    name: '鈴木 一郎',
    email: 'suzuki@example.com',
    status: 'inactive',
    role: 'user',
    plan: 'premium',
    createdAt: new Date('2023-08-05T11:40:00Z'),
    lastLoginAt: new Date('2023-09-10T16:30:00Z'),
    image: null,
    lpCount: 8,
    conversionRate: 1.5,
    notes: '支払い遅延のため一時的に無効化',
  },
  {
    id: '4',
    name: '田中 美子',
    email: 'tanaka@example.com',
    status: 'active',
    role: 'user',
    plan: 'basic',
    createdAt: new Date('2023-07-20T09:15:00Z'),
    lastLoginAt: new Date('2023-10-22T11:20:00Z'),
    image: null,
    lpCount: 5,
    conversionRate: 4.2,
    notes: '',
  },
  {
    id: '5',
    name: '伊藤 健太',
    email: 'ito@example.com',
    status: 'withdrawn',
    role: 'user',
    plan: 'basic',
    createdAt: new Date('2023-06-10T14:25:00Z'),
    lastLoginAt: new Date('2023-08-15T10:30:00Z'),
    image: null,
    lpCount: 2,
    conversionRate: 0.8,
    notes: '2023/08/15に退会処理済み',
  },
];

// GET /api/members/[id] - 会員詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    const { id } = params;

    // 実際の実装ではこのコメントを外す
    /*
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        // 必要に応じて関連データを含める
      },
    });
    */

    // モックデータから対象ユーザーを検索
    const user = mockUsers.find(user => user.id === id);

    if (!user) {
      return NextResponse.json(
        { error: '指定された会員は存在しません' },
        { status: 404 }
      );
    }

    // 成功レスポンスの返却
    return NextResponse.json(user);
  } catch (error) {
    console.error('会員詳細の取得エラー:', error);
    return NextResponse.json(
      { error: '会員詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PATCH /api/members/[id] - 会員情報を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // バリデーション
    const validationResult = updateMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // モックデータから対象ユーザーを検索
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: '指定された会員は存在しません' },
        { status: 404 }
      );
    }

    // 本番ではこのコードを使用
    /*
    // メールアドレスが変更される場合は重複確認
    if (data.email && data.email !== currentUser.email) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: data.email,
          id: { not: id }
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に他のユーザーに使用されています' },
          { status: 400 }
        );
      }
    }

    // 試用期間の更新（必要な場合）
    let expirationDate = undefined;
    if (data.status === 'trial') {
      if (data.customTrialPeriod && data.trialPeriodDays) {
        const date = new Date();
        date.setDate(date.getDate() + data.trialPeriodDays);
        expirationDate = date;
      } else if (!currentUser.expirationDate) {
        // ステータスがtrialになったが期限が設定されていない場合はデフォルト設定
        const date = new Date();
        date.setDate(date.getDate() + 14);
        expirationDate = date;
      }
    } else if (data.status && data.status !== 'trial') {
      // trialから他のステータスに変わった場合は期限をクリア
      expirationDate = null;
    }

    // 会員情報の更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        expirationDate,
      },
    });

    // アクティビティログの記録
    if (data.status && data.status !== currentUser.status) {
      await prisma.activityLog.create({
        data: {
          type: 'status_change',
          userId: id,
          details: { 
            oldStatus: currentUser.status, 
            newStatus: data.status,
            changedBy: session.user.id
          },
        },
      });
    }
    */

    // モック実装用の更新処理
    const user = { ...mockUsers[userIndex] };
    
    // 更新データの反映
    Object.assign(user, data);
    
    // 試用期間の更新（必要な場合）
    if (data.status === 'trial') {
      if (data.customTrialPeriod && data.trialPeriodDays) {
        const date = new Date();
        date.setDate(date.getDate() + data.trialPeriodDays);
        user.expirationDate = date;
      } else if (!user.expirationDate) {
        // ステータスがtrialになったが期限が設定されていない場合はデフォルト設定
        const date = new Date();
        date.setDate(date.getDate() + 14);
        user.expirationDate = date;
      }
    } else if (data.status && data.status !== 'trial') {
      // trialから他のステータスに変わった場合は期限をクリア
      user.expirationDate = undefined;
    }

    // モックデータの更新（実際の実装では不要）
    mockUsers[userIndex] = user;

    // 成功レスポンスの返却
    return NextResponse.json(user);
  } catch (error) {
    console.error('会員更新エラー:', error);
    return NextResponse.json(
      { error: '会員情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] - 会員を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    const { id } = params;

    // モックデータから対象ユーザーを検索
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: '指定された会員は存在しません' },
        { status: 404 }
      );
    }

    // 本番ではこのコードを使用
    /*
    // 会員の削除（または無効化）
    await prisma.user.update({
      where: { id },
      data: {
        status: 'withdrawn',
        // その他、削除に関連する処理
      },
    });

    // または実際に削除する場合
    // await prisma.user.delete({
    //   where: { id },
    // });

    // アクティビティログの記録
    await prisma.activityLog.create({
      data: {
        type: 'withdrawal',
        userId: id,
        details: { 
          deletedBy: session.user.id,
          deletedAt: new Date()
        },
      },
    });
    */

    // モック実装用の削除処理（実際の実装では不要）
    // ここでは削除ではなく、ステータスを'withdrawn'に変更
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      status: 'withdrawn',
    };

    // 成功レスポンスの返却
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('会員削除エラー:', error);
    return NextResponse.json(
      { error: '会員の削除に失敗しました' },
      { status: 500 }
    );
  }
}