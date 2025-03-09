import { Section, SectionType } from './lp-generator';
import { Claude } from '@/server/ai/claude-client';
import { SYSTEM_PROMPTS, getSectionPrompt } from '../../server/ai/prompt-templates';

/**
 * 特定タイプのセクションに対するコード生成オプション
 */
export interface SectionGenerationOptions {
  type: SectionType;
  content: string;
  customPrompt?: string;
  designSystem?: any;       // デザインシステム情報
  purpose?: string;         // セクションの目的
  variant?: 'A' | 'B';      // バリアント (A/Bテスト用)
  styleOptions?: {
    colorScheme?: string;   // 'light', 'dark', 'colorful', 'monochrome', 等
    layoutStyle?: string;   // 'centered', 'asymmetric', 'grid', 'card', 等
    fontStyle?: string;     // 'modern', 'classic', 'playful', 'serious', 等
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
    usedComponents?: string[];
    imageCount?: number;
    estimatedLoadTime?: string;
    generatedAt?: Date;
    variant?: 'A' | 'B';
    type?: string;
    purpose?: string;
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
      // AIに設計を依頼するプロンプトを構築
      let prompt;
      
      // カスタムプロンプトがある場合はそれを使用し、なければデザインシステムアプローチを使用
      if (options.customPrompt) {
        prompt = options.customPrompt;
      } else if (options.designSystem) {
        // デザインシステムベースの新しいプロンプト
        prompt = `
          Generate HTML with Tailwind CSS classes for a ${options.type} section of a landing page.
          
          Content: ${options.content}
          Purpose: ${options.purpose || 'Convert visitors'}
          Variant: ${options.variant || 'A'} ${options.variant === 'B' ? '(make this visually distinct from variant A)' : ''}
          
          Follow these requirements:
          1. Use only Tailwind CSS classes for styling - do not create separate CSS files
          2. Follow the design system provided
          3. Create responsive layout that works well on both mobile and desktop
          4. Focus on compelling visual hierarchy and user flow
          5. Ensure accessibility best practices
          6. Use semantic HTML tags appropriately
          7. Do not include <html>, <head>, or <body> tags - only the section content
          
          For interactivity, use simple inline onclick handlers if needed.
          
          Return clean, production-ready HTML with Tailwind classes.
        `;
      } else {
        // 従来のプロンプト取得方法
        prompt = getSectionPrompt(options.type, options.content);
      }
      
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
      
      // AIシステムプロンプト
      const systemPrompt = options.designSystem 
        ? `You are an expert front-end developer specializing in creating high-converting landing pages.
           You have deep expertise in Tailwind CSS and responsive design.
           Your task is to generate high-quality HTML with Tailwind CSS classes for landing page sections.
           DO NOT include any explanations or comments in your response - only return the clean HTML code.`
        : SYSTEM_PROMPTS.SECTION_GENERATOR;
      
      // AIモデルにプロンプトを送信
      const response = await Claude.sendMessage({
        message: prompt,
        system: systemPrompt,
        temperature: 0.7,
      });
      
      // HTMLコードブロックを抽出
      const htmlMatch = response.content.match(/```html\s*([\s\S]*?)\s*```/) || 
                        response.content.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response.content];
      
      const html = htmlMatch[1] ? htmlMatch[1].trim() : response.content.trim();
      
      // 結果を返す
      return {
        html,
        metadata: {
          usedComponents: extractComponentNames(html),
          imageCount: countImageTags(html),
          estimatedLoadTime: estimateLoadTime(html),
          generatedAt: new Date(),
          variant: options.variant || 'A',
          type: options.type,
          purpose: options.purpose
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
    sectionType: SectionType,
    designSystem?: any
  ): Promise<SectionGenerationResult> {
    try {
      const prompt = `以下のHTMLセクションを改善してください。

セクションタイプ: ${sectionType}

現在のHTML:
\`\`\`html
${existingHtml}
\`\`\`

改善の指示:
${improvementInstructions}

${designSystem ? `このデザインシステムに準拠してください。` : ``}
Tailwind CSSクラスのみを使用し、レスポンシブ設計を維持してください。
改善されたHTMLコード全体を返してください。`;

      const response = await Claude.sendMessage({
        message: prompt,
        system: SYSTEM_PROMPTS.IMPROVEMENT_ADVISOR,
        temperature: 0.7,
      });
      
      // HTMLコードブロックを抽出
      const htmlMatch = response.content.match(/```html\s*([\s\S]*?)\s*```/) || 
                        response.content.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response.content];
      
      const html = htmlMatch[1] ? htmlMatch[1].trim() : response.content.trim();
      
      return {
        html,
        metadata: {
          generatedAt: new Date(),
          type: sectionType
        }
      };
    } catch (error) {
      console.error('Error improving section:', error);
      throw error;
    }
  }
  
  /**
   * 既存のセクションに基づいてA/Bバリアントを生成
   */
  static async generateVariantB(
    options: {
      originalHtml: string;     // バリアントAのHTML
      type: string;             // セクションタイプ
      content: string;          // セクションの主な内容
      designSystem?: any;       // デザインシステム
      differentiation?: string; // バリアントBの差別化ポイント
    }
  ): Promise<SectionGenerationResult> {
    try {
      // バリアント生成のためのプロンプト
      let prompt = `
        Create an alternative design (Variant B) for this ${options.type} section.
        
        Original HTML (Variant A):
        \`\`\`html
        ${options.originalHtml}
        \`\`\`
        
        Content: ${options.content}
        Differentiation focus: ${options.differentiation || 'Visual design, layout, and emphasis'}
        
        Requirements:
        1. Create a visually distinct design from Variant A using Tailwind CSS classes
        2. Maintain the same core content and functionality
        3. Focus on a different approach to achieve the same goal
        4. This variant should test a different hypothesis about what might convert better
        5. Do not include <html>, <head>, or <body> tags - only the section content
        
        Create clean HTML with Tailwind classes only.
      `;

      const response = await Claude.sendMessage({
        message: prompt,
        system: "You are an A/B testing specialist with expertise in creating effective variant designs. Your goal is to create meaningfully different alternatives that test specific hypotheses about user behavior and conversion tactics.",
        temperature: 0.7,
      });
      
      // HTMLコードブロックを抽出
      const htmlMatch = response.content.match(/```html\s*([\s\S]*?)\s*```/) || 
                        response.content.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response.content];
      
      const html = htmlMatch[1] ? htmlMatch[1].trim() : response.content.trim();
      
      return {
        html,
        metadata: {
          generatedAt: new Date(),
          variant: 'B',
          type: options.type,
          differentiation: options.differentiation || 'Visual design'
        }
      };
    } catch (error) {
      console.error(`Error generating variant for section type ${options.type}:`, error);
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