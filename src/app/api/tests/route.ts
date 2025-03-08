import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

// テスト一覧取得
export async function GET() {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }
    
    // ユーザーのテスト一覧を取得
    const tests = await prisma.testSetting.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json({ tests });
  } catch (error) {
    console.error("GET /api/tests error:", error);
    return NextResponse.json(
      { error: "テスト一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 新規テスト作成
export async function POST(request: Request) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // リクエストデータの取得
    const data = await request.json();
    const { 
      projectId, 
      name, 
      startDate, 
      endDate, 
      conversionGoal, 
      testedComponents 
    } = data;
    
    if (!projectId || !name || !conversionGoal || !testedComponents) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }
    
    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }
    
    // プロジェクト確認
    const project = await prisma.lpProject.findUnique({
      where: { 
        id: projectId,
        userId: user.id,
      },
    });
    
    if (!project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト作成
    const test = await prisma.testSetting.create({
      data: {
        projectId,
        userId: user.id,
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        conversionGoal,
        testedComponents,
        status: 'scheduled',
      },
    });
    
    return NextResponse.json({ 
      success: true,
      test,
    });
  } catch (error) {
    console.error("POST /api/tests error:", error);
    return NextResponse.json(
      { error: "テストの作成に失敗しました" },
      { status: 500 }
    );
  }
}