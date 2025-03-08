import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface Params {
  params: {
    id: string;
  };
}

// テストセッション一覧取得
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '50');
    const offset = Number(searchParams.get('offset') || '0');
    
    // テスト存在確認
    const testExists = await prisma.testSetting.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!testExists) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // セッション総数取得
    const totalCount = await prisma.testSession.count({
      where: { testId: id },
    });
    
    // セッション一覧取得
    const sessions = await prisma.testSession.findMany({
      where: { testId: id },
      include: {
        sessionEvents: {
          select: {
            eventType: true,
            timestamp: true,
          },
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
    });
    
    return NextResponse.json({
      sessions,
      meta: {
        total: totalCount,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("GET /api/tests/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "セッション一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規セッション作成
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
    // リクエストデータの取得
    const data = await request.json();
    const { browserSessionId, deviceType, assignedVariants } = data;
    
    if (!browserSessionId || !deviceType || !assignedVariants) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }
    
    // テスト存在確認
    const testExists = await prisma.testSetting.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!testExists) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // 既存セッション確認
    const existingSession = await prisma.testSession.findUnique({
      where: { browserSessionId },
    });
    
    // 既存セッションがない場合は新規作成
    if (!existingSession) {
      const session = await prisma.testSession.create({
        data: {
          testId: id,
          browserSessionId,
          deviceType,
          assignedVariants,
          startTime: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        session,
        isNew: true,
      });
    }
    
    // 既存セッションがある場合は更新
    const updatedSession = await prisma.testSession.update({
      where: { browserSessionId },
      data: {
        assignedVariants,
      },
    });
    
    return NextResponse.json({
      success: true,
      session: updatedSession,
      isNew: false,
    });
  } catch (error) {
    console.error("POST /api/tests/[id]/sessions error:", error);
    return NextResponse.json(
      { error: "セッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}