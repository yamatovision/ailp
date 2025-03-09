import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getUserSession } from '@/lib/utils';

// リクエストバリデーションスキーマ
const inviteSchema = z.object({
  emails: z.array(z.string().email({ message: '有効なメールアドレスを入力してください' })),
  role: z.enum(['admin', 'user']),
  plan: z.enum(['basic', 'premium']),
  status: z.enum(['active', 'trial']),
  customTrialPeriod: z.boolean().optional().default(false),
  trialPeriodDays: z.number().min(1).max(90).optional(),
  sendWelcomeEmail: z.boolean().optional().default(true),
  message: z.string().optional(),
});

// POST /api/members/invite - 会員を招待
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
    const validationResult = inviteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'バリデーションエラー', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 試用期間の計算（必要な場合）
    let expirationDate = null;
    if (data.status === 'trial') {
      if (data.customTrialPeriod && data.trialPeriodDays) {
        const date = new Date();
        date.setDate(date.getDate() + data.trialPeriodDays);
        expirationDate = date;
      } else {
        // デフォルトの試用期間（14日）
        const date = new Date();
        date.setDate(date.getDate() + 14);
        expirationDate = date;
      }
    }

    // 実際の実装ではここでメール送信などの処理を行う
    /*
    // 既存ユーザーのチェック
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: data.emails,
        },
      },
      select: {
        email: true,
      },
    });

    const existingEmails = existingUsers.map(user => user.email);
    const newEmails = data.emails.filter(email => !existingEmails.includes(email));

    if (existingEmails.length > 0) {
      console.log(`以下のメールアドレスは既に登録されています: ${existingEmails.join(', ')}`);
    }

    // 招待トークンの生成と保存
    const invites = [];
    for (const email of newEmails) {
      const token = crypto.randomUUID();
      
      const invite = await prisma.invitation.create({
        data: {
          email,
          token,
          role: data.role,
          plan: data.plan,
          status: data.status,
          expirationDate,
          message: data.message,
          createdBy: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日間有効
        },
      });
      
      invites.push(invite);
    }

    // メール送信
    if (data.sendWelcomeEmail && newEmails.length > 0) {
      for (const invite of invites) {
        await sendInvitationEmail({
          email: invite.email,
          token: invite.token,
          message: data.message,
          inviterName: session.user.name,
        });
      }
    }
    */

    // 成功レスポンスの返却
    return NextResponse.json({ 
      success: true, 
      count: data.emails.length,
      //existingCount: existingEmails.length,
      //newCount: newEmails.length
    });
    
  } catch (error) {
    console.error('招待エラー:', error);
    return NextResponse.json(
      { error: '招待の送信に失敗しました' },
      { status: 500 }
    );
  }
}