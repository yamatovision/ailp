import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { authOptions } from '@/lib/auth/auth-options';
import { analyzeDeviceData } from '@/lib/analysis/statistical-analysis';

interface Params {
  params: {
    componentId: string;
  };
}

/**
 * デバイス別分析データ取得API
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { componentId } = params;
    
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
    
    // コンポーネント確認
    const component = await prisma.lpComponent.findUnique({
      where: { id: componentId },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    });
    
    if (!component || component.project.userId !== user.id) {
      return NextResponse.json(
        { error: "コンポーネントが見つかりません" },
        { status: 404 }
      );
    }
    
    // テストイベント取得
    const events = await prisma.testEvent.findMany({
      where: {
        componentId,
      },
      include: {
        session: true,
      },
    });
    
    // デバイスデータの分析
    const deviceData = analyzeDeviceData(events);
    
    return NextResponse.json({
      success: true,
      data: deviceData,
    });
  } catch (error) {
    console.error("GET /api/analysis/device-data/[componentId] error:", error);
    return NextResponse.json(
      { error: "デバイス別データの取得に失敗しました" },
      { status: 500 }
    );
  }
}