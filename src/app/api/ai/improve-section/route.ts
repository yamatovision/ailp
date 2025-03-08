import { NextRequest, NextResponse } from 'next/server';
import { SectionGenerator } from '@/lib/ai/section-generator';

export const maxDuration = 300; // 5分のタイムアウト

export async function POST(req: NextRequest) {
  try {
    const { existingHtml, improvementInstructions, sectionType } = await req.json();
    
    // 必須パラメータのバリデーション
    if (!existingHtml || !improvementInstructions || !sectionType) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています (existingHtml, improvementInstructions, sectionType)' },
        { status: 400 }
      );
    }
    
    // セクションを改善
    const improvedHtml = await SectionGenerator.improveSection(
      existingHtml,
      improvementInstructions,
      sectionType
    );
    
    return NextResponse.json({ html: improvedHtml });
  } catch (error) {
    console.error('Error improving section:', error);
    
    return NextResponse.json(
      { error: 'セクション改善中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}