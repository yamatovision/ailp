import { NextRequest, NextResponse } from 'next/server';
import { SectionGenerator, SectionGenerationOptions } from '@/lib/ai/section-generator';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  try {
    const options: SectionGenerationOptions = await req.json();
    
    // 必須パラメータのバリデーション
    if (!options.type || !options.content) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています (type, content)' },
        { status: 400 }
      );
    }
    
    // セクションのHTMLを生成
    const result = await SectionGenerator.generateSection(options);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating section:', error);
    
    return NextResponse.json(
      { error: 'セクション生成中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}