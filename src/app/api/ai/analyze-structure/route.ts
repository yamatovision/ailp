import { NextRequest, NextResponse } from 'next/server';
import { analyzeLPStructure } from '@/lib/ai/lp-generator';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  console.log('analyze-structure API: リクエスト受信');
  
  try {
    const body = await req.json();
    console.log('analyze-structure API: リクエストボディ:', body);
    
    const { serviceInfo, targetAudience, goals } = body;
    
    // 必須パラメータのバリデーション
    if (!serviceInfo) {
      console.log('analyze-structure API: 必須パラメータ不足');
      return NextResponse.json(
        { error: '必須パラメータが不足しています (serviceInfo)' },
        { status: 400 }
      );
    }
    
    // LPの構造を分析
    console.log('analyze-structure API: 構造分析を開始');
    const sections = await analyzeLPStructure(
      serviceInfo, 
      targetAudience || '', 
      goals || 'コンバージョン率の向上'
    );
    console.log('analyze-structure API: 構造分析完了', sections.length + '個のセクションを生成');
    
    const response = { 
      sections,
      meta: {
        totalSections: sections.length,
        serviceInfo: serviceInfo.substring(0, 100) + '...',
        analysisTimestamp: new Date().toISOString()
      }
    };
    
    console.log('analyze-structure API: レスポンス返却準備完了');
    return NextResponse.json(response);
  } catch (error) {
    console.error('analyze-structure API: エラー発生:', error);
    
    return NextResponse.json(
      { error: 'LP構造の分析中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}