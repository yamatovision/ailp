import { NextRequest, NextResponse } from 'next/server';
import { analyzeLPStructure } from '@/lib/ai/framework-analyzer';
import { generateAllSectionsHtml } from '@/lib/ai/section-generator';

export const maxDuration = 600; // 10分のタイムアウト (統合フロー)

export async function POST(req: NextRequest) {
  try {
    const { serviceInfo, targetAudience, style } = await req.json();
    
    // 必須パラメータのバリデーション
    if (!serviceInfo || !targetAudience) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています (serviceInfo, targetAudience)' },
        { status: 400 }
      );
    }
    
    // 1. LPの構造を分析
    console.log('Step 1: Analyzing LP structure...');
    const sections = await analyzeLPStructure(serviceInfo, targetAudience, style || '');
    
    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: 'LP構造の分析に失敗しました。有効なセクションが生成されませんでした。' },
        { status: 500 }
      );
    }
    
    // 2. すべてのセクションのHTMLを生成
    console.log(`Step 2: Generating HTML for ${sections.length} sections...`);
    const sectionsWithHtml = await generateAllSectionsHtml(sections);
    
    // 3. 結果を返す（構造とHTMLコードを含む）
    return NextResponse.json({ 
      sections: sectionsWithHtml,
      // 統計情報を追加
      stats: {
        sectionCount: sectionsWithHtml.length,
        generatedCount: sectionsWithHtml.filter(s => s.html).length,
        sectionTypes: sectionsWithHtml.map(s => s.type)
      }
    });
  } catch (error) {
    console.error('Error in LP generation process:', error);
    
    return NextResponse.json(
      { error: 'LP生成中にエラーが発生しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}