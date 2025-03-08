import { Section, SectionType } from './lp-generator';
import { getCompletion } from '../../server/ai/claude-client';
import { SYSTEM_PROMPTS, getSectionPrompt } from '../../server/ai/prompt-templates';

/**
 * 特定タイプのセクションに対するコード生成オプション
 */
export interface SectionGenerationOptions {
  type: SectionType;
  content: string;
  customPrompt?: string;
  styleOptions?: {
    colorScheme?: string;  // 'light', 'dark', 'colorful', 'monochrome', 等
    layoutStyle?: string;  // 'centered', 'asymmetric', 'grid', 'card', 等
    fontStyle?: string;    // 'modern', 'classic', 'playful', 'serious', 等
    animationLevel?: string; // 'none', 'subtle', 'moderate', 'dynamic', 等
  };
}

/**
 * セクションコードの生成結果
 */
export interface SectionGenerationResult {
  html: string;
  css?: string;
  js?: string;
  metadata?: {
    usedComponents: string[];
    imageCount: number;
    estimatedLoadTime: string;
  };
}

/**
 * セクションコードの生成器クラス
 */
export class SectionGenerator {
  
  /**
   * セクションタイプに基づいてHTMLを生成
   */
  static async generateSection(options: SectionGenerationOptions): Promise<SectionGenerationResult> {
    try {
      // カスタムプロンプトがある場合はそれを使用し、なければデフォルトプロンプトを取得
      let prompt = options.customPrompt || getSectionPrompt(options.type, options.content);
      
      // スタイルオプションがある場合は追加
      if (options.styleOptions) {
        const styleOptions = options.styleOptions;
        const stylePrompt = `
スタイル要件:
${styleOptions.colorScheme ? `- カラースキーム: ${styleOptions.colorScheme}` : ''}
${styleOptions.layoutStyle ? `- レイアウトスタイル: ${styleOptions.layoutStyle}` : ''}
${styleOptions.fontStyle ? `- フォントスタイル: ${styleOptions.fontStyle}` : ''}
${styleOptions.animationLevel ? `- アニメーションレベル: ${styleOptions.animationLevel}` : ''}
`;
        prompt += `\n${stylePrompt}`;
      }
      
      // AIモデルにプロンプトを送信
      const response = await getCompletion(prompt, {
        systemPrompt: SYSTEM_PROMPTS.SECTION_GENERATOR,
        temperature: 0.7,
      });
      
      // HTMLコードブロックを抽出
      const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response];
      
      // 結果を返す
      return {
        html: htmlMatch[1].trim(),
        metadata: {
          usedComponents: extractComponentNames(htmlMatch[1]),
          imageCount: countImageTags(htmlMatch[1]),
          estimatedLoadTime: estimateLoadTime(htmlMatch[1]),
        }
      };
    } catch (error) {
      console.error(`Error generating section for type ${options.type}:`, error);
      throw error;
    }
  }
  
  /**
   * 既存のHTMLセクションを改善または修正
   */
  static async improveSection(
    existingHtml: string, 
    improvementInstructions: string,
    sectionType: SectionType
  ): Promise<string> {
    try {
      const prompt = `以下のHTMLセクションを改善してください。

セクションタイプ: ${sectionType}

現在のHTML:
\`\`\`html
${existingHtml}
\`\`\`

改善の指示:
${improvementInstructions}

Tailwind CSSクラスを使用し、レスポンシブ設計を維持してください。
改善されたHTMLコード全体を返してください。`;

      const response = await getCompletion(prompt, {
        systemPrompt: SYSTEM_PROMPTS.IMPROVEMENT_ADVISOR,
        temperature: 0.7,
      });
      
      // HTMLコードブロックを抽出
      const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response];
      
      return htmlMatch[1].trim();
    } catch (error) {
      console.error('Error improving section:', error);
      throw error;
    }
  }
  
  /**
   * 既存のセクションに基づいてA/Bバリアントを生成
   */
  static async generateVariant(
    originalHtml: string, 
    sectionType: SectionType,
    variantInstructions?: string
  ): Promise<string> {
    try {
      // バリアント生成のためのプロンプト
      let prompt = `以下はLPの${sectionType}セクションの元のHTMLコードです。このセクションのA/Bテスト用バリアントを生成してください。

元のHTML:
\`\`\`html
${originalHtml}
\`\`\`

A/Bテストで効果的な違いを持つバリアントを生成してください。`;

      // 追加の指示がある場合は含める
      if (variantInstructions) {
        prompt += `\n\n具体的な指示：\n${variantInstructions}`;
      } else {
        prompt += `\n\n以下の点を変更検討してください：
1. ヘッドラインのメッセージング
2. 視覚的要素のレイアウト
3. CTAボタンの文言やデザイン
4. コンテンツの提示方法`;
      }

      prompt += `\n\n元のセクションとは明確に異なる、しかし同じ目的を達成できるバリアントHTMLコードを生成してください。
生成したコードはHTMLブロックとして返してください。`;

      const response = await getCompletion(prompt, {
        systemPrompt: SYSTEM_PROMPTS.VARIANT_GENERATOR,
        temperature: 0.8,
      });
      
      // HTMLコードブロックを抽出
      const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response];
      
      return htmlMatch[1].trim();
    } catch (error) {
      console.error(`Error generating variant for section type ${sectionType}:`, error);
      throw error;
    }
  }
}

// HTMLからコンポーネント名を抽出するヘルパー関数
function extractComponentNames(html: string): string[] {
  const components: string[] = [];
  
  // セクション内のコンポーネントを特定（data-component属性または一般的なUI要素で判断）
  const componentMatches = html.match(/data-component="([^"]+)"/g) || [];
  componentMatches.forEach(match => {
    const component = match.replace(/data-component="([^"]+)"/, '$1');
    if (!components.includes(component)) {
      components.push(component);
    }
  });
  
  // 一般的なUI要素
  const commonComponents = [
    { pattern: /<button/i, name: 'Button' },
    { pattern: /<form/i, name: 'Form' },
    { pattern: /<input/i, name: 'Input' },
    { pattern: /<textarea/i, name: 'Textarea' },
    { pattern: /<select/i, name: 'Select' },
    { pattern: /<table/i, name: 'Table' },
    { pattern: /<carousel|slider/i, name: 'Carousel' },
    { pattern: /<accordion/i, name: 'Accordion' },
    { pattern: /<tabs/i, name: 'Tabs' },
    { pattern: /<modal|dialog/i, name: 'Modal' },
  ];
  
  commonComponents.forEach(({ pattern, name }) => {
    if (pattern.test(html) && !components.includes(name)) {
      components.push(name);
    }
  });
  
  return components;
}

// HTMLから画像タグの数をカウントするヘルパー関数
function countImageTags(html: string): number {
  const imgMatches = html.match(/<img[^>]*>/g) || [];
  return imgMatches.length;
}

// HTMLの複雑さからおおよそのロード時間を見積もるヘルパー関数
function estimateLoadTime(html: string): string {
  // 非常にシンプルな実装 - 実際には多くの要因が影響する
  const length = html.length;
  const imageCount = countImageTags(html);
  
  // 1000文字ごとに約50ms、画像1枚ごとに約200ms（完全な推測）
  const baseTime = (length / 1000) * 50;
  const imageTime = imageCount * 200;
  
  const totalTimeMs = baseTime + imageTime;
  
  if (totalTimeMs < 500) {
    return '高速 (<500ms)';
  } else if (totalTimeMs < 1000) {
    return '中速 (500-1000ms)';
  } else {
    return '低速 (>1000ms)';
  }
}