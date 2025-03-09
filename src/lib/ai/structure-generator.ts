import { Claude } from '@/server/ai/claude-client';

/**
 * LP構造を生成するクラス
 * プロジェクト情報と設計システムに基づいてLPのセクション構造を設計する
 */
export class StructureGenerator {
  /**
   * LP構造を生成する
   * @param options 構造生成オプション
   * @returns セクション構造の配列
   */
  static async generate(options: {
    projectInfo: string;      // プロジェクト情報
    designSystem: any;        // 既に生成されたデザインシステム
    targetAudience?: string;  // ターゲットオーディエンス
    conversionGoal?: string;  // コンバージョン目標
  }) {
    // AIに設計を依頼
    const prompt = `
      Based on the provided design system and project information, create an optimal 
      structure for a landing page with high conversion potential.
      
      Project information: ${options.projectInfo}
      Conversion goal: ${options.conversionGoal || 'Lead generation'}
      Target audience: ${options.targetAudience || 'General audience'}
      
      Analyze the design system and project to determine:
      1. The most effective sections for this landing page
      2. The optimal order of sections
      3. The purpose and key content of each section
      4. How each section contributes to the overall conversion goal
      
      Return a structured JSON array of section recommendations in the following format:
      [
        {
          "type": "hero",
          "name": "Hero Section",
          "title": "Main headline for the section",
          "content": "Detailed description of what this section should contain",
          "purpose": "The purpose this section serves (e.g. grab attention, introduce value proposition)",
          "generateVariantB": true/false,
          "variantDifference": "How variant B should differ from variant A"
        },
        ...more sections...
      ]

      Common section types include: hero, features, benefits, testimonials, pricing, cta, faq, about, stats, team, gallery, contact, footer
      
      Include between 6-10 sections for a complete landing page.
    `;

    // Claudeで構造を生成
    const response = await Claude.sendMessage({
      message: prompt,
      system: "You are an expert conversion rate optimization specialist and landing page designer. You understand the psychology of landing pages and how to structure content to maximize conversions.",
      temperature: 0.7,
    });

    let sections;
    try {
      // レスポンス内からJSONを抽出して解析
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        sections = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON array from response");
      }
    } catch (error) {
      console.error("Failed to parse structure JSON:", error);
      throw new Error("Failed to generate landing page structure");
    }

    // 各セクションにIDと位置情報を追加
    return {
      sections: sections.map((section, index) => ({
        id: `section-${Date.now()}-${index}`,
        type: section.type,
        componentName: section.name,
        title: section.title || `${section.type} Section`,
        content: section.content || '',
        position: index,
        purpose: section.purpose,
        generateVariantB: section.generateVariantB || false,
        variantDifference: section.variantDifference || ''
      }))
    };
  }
}