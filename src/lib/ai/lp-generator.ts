import { getCompletion, getBatchCompletions } from '../../server/ai/claude-client';
import { 
  SYSTEM_PROMPTS, 
  getSectionPrompt, 
  getStructureAnalysisPrompt,
  getFrameworkAnalysisPrompt, 
  getVariantGenerationPrompt 
} from '../../server/ai/prompt-templates';

// 型定義を別ファイルからインポート
import { 
  Section, 
  SectionType, 
  ComponentName, 
  LPStructure,
  SECTION_TYPE_TO_COMPONENT
} from '@/types/structure';

/**
 * ユーザー入力からLPの構造（セクション）を分析する
 */
export async function analyzeLPStructure(
  serviceInfo: string,
  targetAudience: string,
  goals: string
): Promise<Section[]> {
  try {
    // プロンプトを作成
    const prompt = getStructureAnalysisPrompt(serviceInfo, targetAudience, goals);
    
    // Claude APIに構造分析を依頼
    const response = await getCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPTS.STRUCTURE_ANALYZER,
      temperature: 0.7,
    });
    
    // レスポンスをJSONとしてパース
    let structureData;
    try {
      // JSON文字列を抽出（```json...```形式の場合も対応）
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response];
      
      const jsonStr = jsonMatch[1].trim();
      structureData = JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      throw new Error('AIのレスポンスをJSONとして解析できませんでした');
    }
    
    // レスポンスから適切な形式でセクション配列を構築
    let sections: Section[] = [];
    
    // 新しいAPIレスポンス形式に対応
    if (structureData.sections && Array.isArray(structureData.sections)) {
      // 新しいフォーマット: {sections: [{...}, {...}]}
      sections = structureData.sections.map((section: any) => {
        // 各セクションを標準化
        const type = (section.type || 'custom').toLowerCase() as SectionType;
        const componentName = section.componentName || SECTION_TYPE_TO_COMPONENT[type] || 'Custom';
        
        return {
          id: section.id || `section-${section.position || 0}`,
          type,
          componentName: componentName as ComponentName,
          title: section.title || `${componentName} Section`,
          content: section.content || '',
          position: section.position || 0,
          isTestable: section.isTestable !== undefined ? section.isTestable : true
        };
      });
      
      // 位置情報でソート
      sections.sort((a, b) => a.position - b.position);
    } else if (Array.isArray(structureData)) {
      // 直接配列の場合（古い形式への対応）
      sections = structureData.map((section: any, index: number) => {
        const type = (section.type || 'custom').toLowerCase() as SectionType;
        return {
          id: `section-${index}`,
          type,
          componentName: SECTION_TYPE_TO_COMPONENT[type] || 'Custom',
          title: section.title || `セクション ${index + 1}`,
          content: section.content || section.description || '',
          position: index,
          isTestable: true
        };
      });
    } else {
      // その他のケース（古い形式への対応）
      sections = Object.entries(structureData).map(([key, value], index) => {
        const sectionData = value as any;
        const type = key.toLowerCase() as SectionType;
        return {
          id: `section-${index}`,
          type,
          componentName: SECTION_TYPE_TO_COMPONENT[type] || 'Custom',
          title: sectionData.title || key,
          content: sectionData.content || sectionData.description || JSON.stringify(sectionData),
          position: index,
          isTestable: true
        };
      });
    }
    
    // セクションがない場合はエラー
    if (sections.length === 0) {
      throw new Error('AIが有効なセクション構造を生成できませんでした');
    }
    
    return sections;
  } catch (error) {
    console.error('Error analyzing LP structure:', error);
    throw error;
  }
}

/**
 * マーケティングフレームワークに基づいた分析を行う
 */
export async function analyzeMarketingFramework(
  serviceInfo: string,
  targetAudience: string
): Promise<any> {
  try {
    const prompt = getFrameworkAnalysisPrompt(serviceInfo, targetAudience);
    
    const response = await getCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPTS.FRAMEWORK_ANALYZER,
      temperature: 0.7,
    });
    
    // JSONレスポンスを抽出
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                      response.match(/```\s*([\s\S]*?)\s*```/) || 
                      [null, response];
    
    try {
      const jsonStr = jsonMatch[1].trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Failed to parse framework analysis response:', error);
      return { rawResponse: response };
    }
  } catch (error) {
    console.error('Error analyzing marketing framework:', error);
    throw error;
  }
}

/**
 * 個別のセクションのHTMLコードを生成する
 */
export async function generateSectionHtml(section: Section): Promise<string> {
  try {
    const sectionPrompt = getSectionPrompt(section.type, section.content);
    
    const response = await getCompletion(sectionPrompt, {
      systemPrompt: SYSTEM_PROMPTS.SECTION_GENERATOR,
      temperature: 0.7,
    });
    
    // HTMLコードブロックを抽出
    const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/) || 
                      response.match(/```\s*([\s\S]*?)\s*```/) || 
                      [null, response];
    
    return htmlMatch[1].trim();
  } catch (error) {
    console.error(`Error generating HTML for section ${section.id}:`, error);
    throw error;
  }
}

/**
 * 複数のセクションを並列で生成する
 */
export async function generateAllSectionsHtml(sections: Section[]): Promise<Section[]> {
  try {
    // 各セクションごとにプロンプトを準備
    const prompts = sections.map(section => ({
      id: section.id,
      prompt: getSectionPrompt(section.type, section.content),
      systemPrompt: SYSTEM_PROMPTS.SECTION_GENERATOR,
    }));
    
    // バッチリクエストを実行
    const responses = await getBatchCompletions(prompts, {
      temperature: 0.7,
    });
    
    // 結果を元のセクション配列に適用
    const updatedSections = [...sections];
    
    responses.forEach(response => {
      if (response.content && !response.error) {
        const sectionIndex = updatedSections.findIndex(s => s.id === response.id);
        if (sectionIndex !== -1) {
          // HTMLコードブロックを抽出
          const htmlMatch = response.content.match(/```html\s*([\s\S]*?)\s*```/) || 
                            response.content.match(/```\s*([\s\S]*?)\s*```/) || 
                            [null, response.content];
          
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            html: htmlMatch[1].trim(),
          };
        }
      }
    });
    
    return updatedSections;
  } catch (error) {
    console.error('Error generating all sections HTML:', error);
    throw error;
  }
}

/**
 * 既存セクションのA/Bバリアントを生成する
 */
export async function generateSectionVariant(section: Section): Promise<string> {
  if (!section.html) {
    throw new Error('元のセクションのHTMLが必要です');
  }
  
  try {
    const prompt = getVariantGenerationPrompt(section.html, section.type);
    
    const response = await getCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPTS.VARIANT_GENERATOR,
      temperature: 0.8, // バリアントのほうが若干高い温度を使用
    });
    
    // HTMLコードブロックを抽出
    const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/) || 
                      response.match(/```\s*([\s\S]*?)\s*```/) || 
                      [null, response];
    
    return htmlMatch[1].trim();
  } catch (error) {
    console.error(`Error generating variant for section ${section.id}:`, error);
    throw error;
  }
}

/**
 * 複数セクションのバリアントを並列で生成する
 */
export async function generateAllSectionVariants(sections: Section[]): Promise<Section[]> {
  try {
    // HTMLが既に生成されているセクションのみを対象とする
    const sectionsWithHtml = sections.filter(section => section.html);
    
    // 各セクションごとにプロンプトを準備
    const prompts = sectionsWithHtml.map(section => ({
      id: section.id,
      prompt: getVariantGenerationPrompt(section.html!, section.type),
      systemPrompt: SYSTEM_PROMPTS.VARIANT_GENERATOR,
    }));
    
    // バッチリクエストを実行
    const responses = await getBatchCompletions(prompts, {
      temperature: 0.8,
    });
    
    // 結果を元のセクション配列に適用
    const updatedSections = [...sections];
    
    responses.forEach(response => {
      if (response.content && !response.error) {
        const sectionIndex = updatedSections.findIndex(s => s.id === response.id);
        if (sectionIndex !== -1) {
          // HTMLコードブロックを抽出
          const htmlMatch = response.content.match(/```html\s*([\s\S]*?)\s*```/) || 
                            response.content.match(/```\s*([\s\S]*?)\s*```/) || 
                            [null, response.content];
          
          updatedSections[sectionIndex] = {
            ...updatedSections[sectionIndex],
            variantHtml: htmlMatch[1].trim(),
          };
        }
      }
    });
    
    return updatedSections;
  } catch (error) {
    console.error('Error generating all section variants:', error);
    throw error;
  }
}

/**
 * AIを使用してセクションのコンテンツを改善する
 */
export async function improveSectionContent(
  section: Section,
  improvementPrompt: string
): Promise<Section> {
  try {
    const prompt = `以下のLPセクションを改善してください。

セクションタイプ: ${section.type}
現在のコンテンツ:
${section.content}

改善の指示:
${improvementPrompt}

改善されたコンテンツを返してください。`;

    const response = await getCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPTS.IMPROVEMENT_ADVISOR,
      temperature: 0.7,
    });
    
    // 改善されたコンテンツを元のセクションに適用
    return {
      ...section,
      content: response,
      // htmlとvariantHtmlは再生成が必要なのでリセット
      html: undefined,
      variantHtml: undefined,
    };
  } catch (error) {
    console.error(`Error improving section ${section.id}:`, error);
    throw error;
  }
}

/**
 * LP全体のHTMLを組み立てる
 */
export function assembleLPHtml(sections: Section[], isVariant: boolean = false): string {
  const htmlSections = sections.map(section => {
    const sectionHtml = isVariant && section.variantHtml ? section.variantHtml : section.html;
    if (!sectionHtml) return '';
    
    return `<!-- ${section.type}: ${section.title} -->
${sectionHtml}`;
  });
  
  const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${htmlSections.join('\n\n')}
</body>
</html>
`;
  
  return fullHtml;
}