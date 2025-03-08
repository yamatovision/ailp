import { NextRequest, NextResponse } from 'next/server';
import { generateAllSectionsHtml, Section } from '@/lib/ai/lp-generator';

export const maxDuration = 600; // 10分のタイムアウト (複数セクションの生成)

export async function POST(req: NextRequest) {
  try {
    const { sections } = await req.json();
    
    // 必須パラメータのバリデーション
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: '有効なセクション配列が必要です' },
        { status: 400 }
      );
    }
    
    // すべてのセクションのHTMLを並列生成
    const updatedSections = await generateAllSectionsHtml(sections as Section[]);
    
    return NextResponse.json({ sections: updatedSections });
  } catch (error) {
    console.error('Error generating all sections:', error);
    
    return NextResponse.json(
      { error: 'セクション生成中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}