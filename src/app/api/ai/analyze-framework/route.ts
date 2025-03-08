import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithFrameworks } from '@/lib/ai/framework-analyzer';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  try {
    const { serviceInfo, targetAudience } = await req.json();
    
    // 必須パラメータのバリデーション
    if (!serviceInfo || !targetAudience) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }
    
    // マーケティングフレームワーク分析を実行
    const analysis = await analyzeWithFrameworks(serviceInfo, targetAudience);
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing with marketing frameworks:', error);
    
    return NextResponse.json(
      { error: 'マーケティングフレームワーク分析中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}