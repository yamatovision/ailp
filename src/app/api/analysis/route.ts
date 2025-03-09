import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import { analyzeTestResults } from '@/lib/analysis/statistical-analysis';

/**
 * テスト分析データ取得API
 */
export async function GET(request: Request) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // URLからテストIDを取得
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json(
        { error: "テストIDが必要です" },
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
    
    // テスト設定と結果取得
    const test = await prisma.testSetting.findUnique({
      where: { 
        id: testId,
        userId: user.id,
      },
      include: {
        testResults: true,
        components: true,
      },
    });
    
    if (!test) {
      return NextResponse.json(
        { error: "テストが見つかりません" },
        { status: 404 }
      );
    }
    
    // 分析データの生成
    const analysisData = await analyzeTestResults(test);
    
    return NextResponse.json({
      success: true,
      data: analysisData,
    });
  } catch (error) {
    console.error("GET /api/analysis error:", error);
    return NextResponse.json(
      { error: "分析データの取得に失敗しました" },
      { status: 500 }
    );
  }
}