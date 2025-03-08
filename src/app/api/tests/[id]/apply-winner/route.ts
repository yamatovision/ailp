import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';

interface Params {
  params: {
    id: string;
  };
}

// 勝者バリアントを適用する
export async function POST(request: Request, { params }: Params) {
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
    const { componentId, variantId } = data;
    
    if (!componentId || !variantId) {
      return NextResponse.json(
        { error: "コンポーネントIDとバリアントIDが必要です" },
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
    
    // テスト存在確認
    const testSetting = await prisma.testSetting.findUnique({
      where: { 
        id,
        userId: user.id,
      },
      include: {
        project: {
          select: {
            id: true,
          },
        },
      },
    });
    
    if (!testSetting) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // コンポーネント確認
    const component = await prisma.lpComponent.findUnique({
      where: { 
        id: componentId,
        projectId: testSetting.project.id,
      },
    });
    
    if (!component) {
      return NextResponse.json(
        { error: "コンポーネントが見つかりません" },
        { status: 404 }
      );
    }
    
    // バリアント確認
    const variant = await prisma.componentVariant.findUnique({
      where: { 
        id: variantId,
        componentId: componentId,
      },
    });
    
    if (!variant) {
      return NextResponse.json(
        { error: "バリアントが見つかりません" },
        { status: 404 }
      );
    }
    
    // テスト結果の更新
    const testResult = await prisma.testResult.findFirst({
      where: {
        testId: id,
        componentId: componentId,
      },
    });
    
    if (testResult) {
      await prisma.testResult.update({
        where: { id: testResult.id },
        data: {
          winningVariant: variant.variantType,
          appliedToProduction: true,
          appliedAt: new Date(),
        },
      });
    }
    
    // テスト履歴の作成
    await prisma.testHistory.create({
      data: {
        componentId: componentId,
        variantA: testResult?.variantAData || {},
        variantB: testResult?.variantBData || {},
        primaryMetric: 'conversionRate',
        winner: variant.variantType,
        winningFactor: variant.variantType === 'a' ? '元のデザインが効果的' : '新しいバリアントが改善',
      },
    });
    
    // 勝者バリアントをベースとなるバリアントとして設定
    // (ここでは単純に、すべてのバリアントAを選択されたバリアントの内容に更新)
    if (variant.variantType === 'b') {
      // バリアントBが勝者の場合は、バリアントAをBの内容で上書き
      const variantA = await prisma.componentVariant.findFirst({
        where: {
          componentId: componentId,
          variantType: 'a',
        },
      });
      
      if (variantA) {
        await prisma.componentVariant.update({
          where: { id: variantA.id },
          data: {
            htmlContent: variant.htmlContent,
            cssContent: variant.cssContent,
            jsContent: variant.jsContent,
            reactComponent: variant.reactComponent,
            metadata: variant.metadata,
            updatedAt: new Date(),
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "勝者バリアントを適用しました",
      appliedAt: new Date(),
    });
  } catch (error) {
    console.error("POST /api/tests/[id]/apply-winner error:", error);
    return NextResponse.json(
      { error: "勝者バリアントの適用に失敗しました" },
      { status: 500 }
    );
  }
}