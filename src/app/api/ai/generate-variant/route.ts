import { NextRequest, NextResponse } from 'next/server';
import { SectionGenerator } from '@/lib/ai/section-generator';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  try {
    const { originalHtml, sectionType, variantInstructions } = await req.json();
    
    // 必須パラメータのバリデーション
    if (!originalHtml || !sectionType) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています (originalHtml, sectionType)' },
        { status: 400 }
      );
    }
    
    // バリアントのHTMLを生成
    const variantHtml = await SectionGenerator.generateVariant(
      originalHtml,
      sectionType,
      variantInstructions
    );
    
    return NextResponse.json({ html: variantHtml });
  } catch (error) {
    console.error('Error generating variant:', error);
    
    return NextResponse.json(
      { error: 'バリアント生成中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}