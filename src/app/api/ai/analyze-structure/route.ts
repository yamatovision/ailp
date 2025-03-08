import { NextRequest, NextResponse } from 'next/server';
import { analyzeLPStructure } from '@/lib/ai/lp-generator';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  try {
    const { serviceInfo, targetAudience, goals } = await req.json();
    
    // 必須パラメータのバリデーション
    if (!serviceInfo || !targetAudience || !goals) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }
    
    // LPの構造を分析
    const sections = await analyzeLPStructure(serviceInfo, targetAudience, goals);
    
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error analyzing LP structure:', error);
    
    return NextResponse.json(
      { error: 'LP構造の分析中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}