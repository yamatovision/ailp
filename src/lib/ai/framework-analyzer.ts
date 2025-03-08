import { getCompletion } from '../../server/ai/claude-client';
import { SYSTEM_PROMPTS, getFrameworkAnalysisPrompt } from '../../server/ai/prompt-templates';

// マーケティングフレームワーク分析結果の型
export interface FrameworkAnalysis {
  frameworks: {
    [key: string]: { // AIDMA, AISAS, FAB, など
      description: string;
      analysis: string;
      applicationToSections: {
        [key: string]: string; // hero, features, testimonials, pricing, faq, cta など
      };
    };
  };
  recommendations: {
    keyMessages: string[];
    targetEmotions: string[];
    callToAction: string[];
    visualSuggestions: string[];
  };
}

/**
 * サービス情報とターゲットオーディエンスからマーケティングフレームワーク分析を行う
 */
export async function analyzeWithFrameworks(
  serviceInfo: string,
  targetAudience: string
): Promise<FrameworkAnalysis> {
  try {
    const prompt = getFrameworkAnalysisPrompt(serviceInfo, targetAudience);
    
    const response = await getCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPTS.FRAMEWORK_ANALYZER,
      temperature: 0.7,
    });
    
    // JSONレスポンスを抽出して解析
    try {
      // JSON文字列を抽出
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                        response.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, response];
      
      const jsonStr = jsonMatch[1].trim();
      const parsedData = JSON.parse(jsonStr);
      
      // デフォルト値を持つ解析結果構造を用意
      const defaultAnalysis: FrameworkAnalysis = {
        frameworks: {},
        recommendations: {
          keyMessages: [],
          targetEmotions: [],
          callToAction: [],
          visualSuggestions: [],
        }
      };
      
      // パース結果から分析データを取得（APIの応答形式に柔軟に対応）
      const analysis = {
        ...defaultAnalysis,
        ...parsedData,
      };
      
      return analysis;
    } catch (error) {
      console.error('Failed to parse framework analysis response:', error);
      
      // JSONパースに失敗した場合のフォールバック
      return {
        frameworks: {
          "raw": {
            description: "解析結果をJSONで解析できませんでした",
            analysis: response,
            applicationToSections: {}
          }
        },
        recommendations: {
          keyMessages: [],
          targetEmotions: [],
          callToAction: [],
          visualSuggestions: [],
        }
      };
    }
  } catch (error) {
    console.error('Error analyzing with marketing frameworks:', error);
    throw error;
  }
}

/**
 * 分析結果をもとにセクションコンテンツを最適化する提案を生成
 */
export async function generateOptimizationSuggestions(
  sectionType: string,
  currentContent: string,
  frameworkAnalysis: FrameworkAnalysis
): Promise<string> {
  try {
    // フレームワーク分析結果から該当セクションの推奨事項を抽出
    const frameworkSuggestions: string[] = [];
    
    Object.entries(frameworkAnalysis.frameworks).forEach(([frameworkName, framework]) => {
      if (framework.applicationToSections && framework.applicationToSections[sectionType]) {
        frameworkSuggestions.push(
          `${frameworkName}: ${framework.applicationToSections[sectionType]}`
        );
      }
    });
    
    // 最適化提案を生成するためのプロンプト
    const prompt = `以下の情報を参考に、${sectionType}セクションのコンテンツを最適化する提案を生成してください。

現在のセクションコンテンツ:
${currentContent}

マーケティングフレームワークによる推奨事項:
${frameworkSuggestions.join('\n\n')}

推奨されるキーメッセージ:
${frameworkAnalysis.recommendations.keyMessages.join(', ')}

ターゲットとする感情:
${frameworkAnalysis.recommendations.targetEmotions.join(', ')}

推奨されるCTA:
${frameworkAnalysis.recommendations.callToAction.join(', ')}

具体的な最適化提案を箇条書きで返してください。`;

    const response = await getCompletion(prompt, {
      systemPrompt: SYSTEM_PROMPTS.IMPROVEMENT_ADVISOR,
      temperature: 0.7,
    });
    
    return response;
  } catch (error) {
    console.error(`Error generating optimization suggestions for ${sectionType}:`, error);
    throw error;
  }
}

/**
 * フレームワーク分析結果を読みやすい形式にフォーマット
 */
export function formatFrameworkAnalysis(analysis: FrameworkAnalysis): string {
  let formattedText = '## マーケティングフレームワーク分析\n\n';
  
  // 各フレームワークの分析を追加
  Object.entries(analysis.frameworks).forEach(([frameworkName, framework]) => {
    formattedText += `### ${frameworkName}\n`;
    formattedText += `${framework.description}\n\n`;
    formattedText += `**分析**: ${framework.analysis}\n\n`;
    
    if (framework.applicationToSections) {
      formattedText += '#### セクション別適用\n\n';
      Object.entries(framework.applicationToSections).forEach(([sectionType, application]) => {
        formattedText += `- **${sectionType}**: ${application}\n`;
      });
      formattedText += '\n';
    }
  });
  
  // 推奨事項を追加
  formattedText += '## 全体的な推奨事項\n\n';
  
  if (analysis.recommendations.keyMessages.length > 0) {
    formattedText += '### キーメッセージ\n';
    analysis.recommendations.keyMessages.forEach(message => {
      formattedText += `- ${message}\n`;
    });
    formattedText += '\n';
  }
  
  if (analysis.recommendations.targetEmotions.length > 0) {
    formattedText += '### ターゲットとする感情\n';
    analysis.recommendations.targetEmotions.forEach(emotion => {
      formattedText += `- ${emotion}\n`;
    });
    formattedText += '\n';
  }
  
  if (analysis.recommendations.callToAction.length > 0) {
    formattedText += '### 推奨されるCTA\n';
    analysis.recommendations.callToAction.forEach(cta => {
      formattedText += `- ${cta}\n`;
    });
    formattedText += '\n';
  }
  
  if (analysis.recommendations.visualSuggestions.length > 0) {
    formattedText += '### ビジュアル要素の提案\n';
    analysis.recommendations.visualSuggestions.forEach(suggestion => {
      formattedText += `- ${suggestion}\n`;
    });
  }
  
  return formattedText;
}