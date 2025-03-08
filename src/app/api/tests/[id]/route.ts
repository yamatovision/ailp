import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

interface Params {
  params: {
    id: string;
  };
}

// テスト詳細取得
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
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
    
    // テスト情報取得
    const test = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
      include: {
        project: {
          select: {
            title: true,
            thumbnail: true,
          },
        },
        testResults: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
    
    if (!test) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト対象コンポーネント情報
    const componentIds = test.testedComponents as string[];
    
    const components = await prisma.lpComponent.findMany({
      where: {
        id: { in: componentIds },
      },
      include: {
        variants: true,
      },
    });
    
    return NextResponse.json({ 
      test,
      components,
    });
  } catch (error) {
    console.error("GET /api/tests/[id] error:", error);
    return NextResponse.json(
      { error: "テスト情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// テスト更新
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
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
      name,
      startDate,
      endDate,
      conversionGoal,
      testedComponents,
      status
    } = data;
    
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
    
    // テスト存在確認
    const existingTest = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
    });
    
    if (!existingTest) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト更新
    const updatedTest = await prisma.testSetting.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(conversionGoal && { conversionGoal }),
        ...(testedComponents && { testedComponents }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ 
      success: true,
      test: updatedTest,
    });
  } catch (error) {
    console.error("PATCH /api/tests/[id] error:", error);
    return NextResponse.json(
      { error: "テストの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// テスト削除
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    
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
    
    // テスト存在確認
    const existingTest = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
    });
    
    if (!existingTest) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト削除
    await prisma.testSetting.delete({
      where: { id },
    });
    
    return NextResponse.json({ 
      success: true,
      message: "テストが削除されました",
    });
  } catch (error) {
    console.error("DELETE /api/tests/[id] error:", error);
    return NextResponse.json(
      { error: "テストの削除に失敗しました" },
      { status: 500 }
    );
  }
}