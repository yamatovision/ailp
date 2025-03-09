import { Claude } from '@/server/ai/claude-client';

// フロントエンド用のモックAPIを作成（環境変数がない場合に使用）
// これはクライアント側でデザインシステムを生成するためのフォールバック
const mockClaude = {
  async sendMessage({ message, system, temperature = 0.7 }) {
    console.log('モックAPIが使用されています - 実際のAPIキーがないためデモデータを返します');
    console.log('リクエスト:', { message: message.substring(0, 100) + '...', system, temperature });
    
    // 事前に用意したデザインシステムのモックデータを返す
    return {
      content: JSON.stringify({
        "colors": {
          "primary": "#3B82F6",
          "secondary": "#10B981",
          "accent": "#F59E0B",
          "background": "#FFFFFF",
          "text": "#1F2937",
          "heading": "#111827",
          "muted": "#6B7280",
          "border": "#E5E7EB",
          "light": "#F9FAFB",
          "dark": "#111827",
          "success": "#10B981",
          "warning": "#F59E0B",
          "error": "#EF4444",
          "info": "#3B82F6"
        },
        "typography": {
          "fonts": {
            "heading": "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            "body": "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          },
          "sizes": {
            "xs": "0.75rem",
            "sm": "0.875rem",
            "base": "1rem",
            "lg": "1.125rem",
            "xl": "1.25rem",
            "2xl": "1.5rem",
            "3xl": "1.875rem",
            "4xl": "2.25rem",
            "5xl": "3rem",
            "6xl": "3.75rem",
            "h1": "2.25rem",
            "h2": "1.875rem",
            "h3": "1.5rem",
            "h4": "1.25rem",
            "h5": "1.125rem",
            "h6": "1rem"
          },
          "weights": {
            "normal": "400",
            "medium": "500",
            "semibold": "600",
            "bold": "700",
            "extrabold": "800"
          },
          "lineHeights": {
            "none": "1",
            "tight": "1.25",
            "snug": "1.375",
            "normal": "1.5",
            "relaxed": "1.625",
            "loose": "2"
          }
        },
        "spacing": {
          "xs": "0.5rem",
          "sm": "1rem",
          "md": "1.5rem",
          "lg": "2rem",
          "xl": "2.5rem",
          "2xl": "3rem",
          "3xl": "4rem",
          "4xl": "5rem",
          "5xl": "6rem"
        },
        "borderRadius": {
          "none": "0",
          "sm": "0.125rem",
          "md": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "2xl": "1rem",
          "full": "9999px"
        },
        "components": [
          {
            "name": "button-primary",
            "description": "Primary action button",
            "css": ".button-primary { @apply bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-300; }"
          },
          {
            "name": "button-secondary",
            "description": "Secondary action button",
            "css": ".button-secondary { @apply bg-secondary hover:bg-secondary/90 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition duration-300; }"
          },
          {
            "name": "card",
            "description": "Standard card component",
            "css": ".card { @apply bg-white rounded-lg shadow-md p-6 border border-border; }"
          },
          {
            "name": "section",
            "description": "Standard section container",
            "css": ".section { @apply py-12 md:py-16 lg:py-20; }"
          },
          {
            "name": "container",
            "description": "Content container with responsive padding",
            "css": ".container-custom { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; }"
          }
        ]
      })
    };
  }
};

// 常にClaudeを使用する
const ApiClient = Claude;

/**
 * デザインシステムを生成するクラス
 * LP全体のデザインテーマ、カラー、フォント等を設計する
 */
export class DesignSystemGenerator {
  /**
   * デザインシステムを生成する
   * @param options デザインシステムのオプション
   * @returns デザインシステム、Tailwind設定、グローバルCSS
   */
  static async generate(options: {
    industry?: string;        // 業種（tech, finance, healthcare等）
    primaryColor?: string;    // 希望する主要カラー
    style?: string;           // デザインスタイル（modern, classic, playful等）
    brandPersonality?: string; // ブランドの個性（professional, friendly, bold等）
    targetAudience?: string;  // ターゲット層（young, professional, seniors等）
  }) {
    // AIに設計を依頼
    const prompt = `
      Create a comprehensive design system for a landing page with the following requirements:
      
      Industry: ${options.industry || 'general'}
      Primary color preference: ${options.primaryColor || 'Use your best judgment'}
      Design style: ${options.style || 'modern and clean'}
      Brand personality: ${options.brandPersonality || 'professional yet approachable'}
      Target audience: ${options.targetAudience || 'general audience'}
      
      Generate a complete design system including:
      1. Color palette (primary, secondary, accent, background, text colors)
      2. Typography (heading and body fonts, font sizes, line heights)
      3. Spacing system (margins, paddings)
      4. Component styles (buttons, cards, sections, forms)
      5. Common tailwind utility patterns
      
      Format the output as a structured JSON object with the following format:
      {
        "colors": {
          "primary": "#hex",
          "secondary": "#hex",
          "accent": "#hex",
          "background": "#hex",
          "text": "#hex",
          "heading": "#hex",
          ...other color variants
        },
        "typography": {
          "fonts": {
            "heading": "font-family-name",
            "body": "font-family-name"
          },
          "sizes": {
            "h1": "size in rem",
            "h2": "size in rem",
            ...
          },
          "weights": {
            "normal": "weight",
            "bold": "weight",
            ...
          },
          "lineHeights": {...}
        },
        "spacing": {
          "xs": "size in rem",
          "sm": "size in rem",
          ...
        },
        "borderRadius": {
          "sm": "size in rem",
          "md": "size in rem",
          ...
        },
        "components": [
          {
            "name": "component name",
            "description": "component description",
            "css": "tailwind component class definition"
          },
          ...
        ]
      }
    `;

    // Claudeでデザインシステムを生成（またはモック）
    const response = await ApiClient.sendMessage({
      message: prompt,
      system: "You are a professional UI/UX designer specializing in creating design systems for web applications. You have expertise in Tailwind CSS and understand how to create cohesive, accessible, and visually appealing design systems.",
      temperature: 0.7,
    });

    let designSystem;
    try {
      // レスポンス内からJSONを抽出して解析
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        designSystem = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (error) {
      console.error("Failed to parse design system JSON:", error);
      throw new Error("Failed to generate design system");
    }

    return {
      designSystem,
      tailwindConfig: this.generateTailwindConfig(designSystem),
      globalCss: this.generateGlobalCss(designSystem)
    };
  }

  /**
   * デザインシステムからTailwind設定を生成
   * @param designSystem デザインシステム
   * @returns Tailwind設定オブジェクト
   */
  private static generateTailwindConfig(designSystem) {
    // designSystemからtailwind.config.tsを生成
    return {
      theme: {
        extend: {
          colors: designSystem.colors,
          fontFamily: designSystem.typography.fonts,
          fontSize: designSystem.typography.sizes,
          spacing: designSystem.spacing,
          borderRadius: designSystem.borderRadius,
          // その他のテーマ設定
        }
      }
    };
  }

  /**
   * デザインシステムからグローバルCSSを生成
   * @param designSystem デザインシステム
   * @returns グローバルCSS文字列
   */
  private static generateGlobalCss(designSystem) {
    // 共通コンポーネントクラスを生成
    return `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
      
      @layer base {
        body {
          font-family: ${designSystem.typography.fonts.body};
          color: ${designSystem.colors.text};
          background-color: ${designSystem.colors.background};
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: ${designSystem.typography.fonts.heading};
          color: ${designSystem.colors.heading || designSystem.colors.text};
        }
      }
      
      @layer components {
        .container-custom {
          @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
        }
        
        .section-container {
          @apply py-12 md:py-20;
        }
        
        .section-title {
          @apply text-3xl md:text-4xl font-bold mb-6 text-center;
        }
        
        .btn-primary {
          @apply bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-lg 
                 font-medium transition duration-300 shadow-md hover:shadow-lg;
        }
        
        .btn-secondary {
          @apply bg-secondary hover:bg-secondary/90 text-white px-5 py-3 rounded-lg 
                 font-medium transition duration-300;
        }
        
        .card {
          @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6;
        }
        
        ${designSystem.components ? designSystem.components.map(comp => comp.css).join('\n') : ''}
      }
    `;
  }
}