import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// リクエストバリデーションスキーマ
const createMemberSchema = z.object({
  name: z.string().min(1, { message: '名前は必須です' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  status: z.enum(['active', 'trial', 'inactive', 'withdrawn']),
  role: z.enum(['admin', 'user']),
  plan: z.enum(['basic', 'premium']),
  customTrialPeriod: z.boolean().optional(),
  trialPeriodDays: z.number().min(1).max(90).optional(),
  autoDisable: z.boolean().optional(),
  webhookUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});


// GET /api/members - 会員一覧を取得
export async function GET(request: NextRequest) {
  try {
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || null;
    const search = searchParams.get('search') || '';
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const direction = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';

    // Prismaでデータベースから会員を取得
    const where: any = {};

    // ステータスフィルター
    if (status) {
      where.status = status;
    }

    // 検索フィルター
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 会員数の取得
    const total = await prisma.user.count({ where });

    // 会員一覧の取得
    const users = await prisma.user.findMany({
      where,
      orderBy: {
        [orderBy]: direction,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // ページネーション
    const totalPages = Math.ceil(total / limit);

    // レスポンスの返却
    return NextResponse.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
    
  } catch (error) {
    console.error('会員一覧の取得エラー:', error);
    return NextResponse.json(
      { error: '会員一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/members - 新規会員を作成
export async function POST(request: NextRequest) {
  try {
    // 認証セッションを取得
    const session = await getUserSession(request, cookies, supabase, createRouteHandlerClient);
    
    if (!session) {
      return NextResponse.json({ error: '認証に失敗しました。再ログインしてください。' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    const validationResult = createMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // 試用期間の計算（必要な場合）
    let expirationDate = null;
    if (data.status === 'trial' && data.customTrialPeriod && data.trialPeriodDays) {
      const date = new Date();
      date.setDate(date.getDate() + data.trialPeriodDays);
      expirationDate = date;
    } else if (data.status === 'trial') {
      // デフォルトの試用期間（14日）
      const date = new Date();
      date.setDate(date.getDate() + 14);
      expirationDate = date;
    }

    // 新規会員の作成
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        status: data.status,
        role: data.role,
        plan: data.plan,
        expirationDate,
        notes: data.notes,
      },
    });

    // アクティビティログの記録（実際の実装ではこのコメントを外す）
    /*
    await prisma.activityLog.create({
      data: {
        type: 'registration',
        userId: newUser.id,
        details: { createdBy: session.user.id },
      },
    });
    */

    // 成功レスポンスの返却
    return NextResponse.json(newUser, { status: 201 });
    
  } catch (error) {
    console.error('会員作成エラー:', error);
    return NextResponse.json(
      { error: '会員の作成に失敗しました' },
      { status: 500 }
    );
  }
}