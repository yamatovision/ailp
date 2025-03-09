/**
 * LP構造関連の型定義
 */

// 基本セクションタイプ (APIと通信する際の一般的な分類)
export type SectionType = 
  | 'hero' 
  | 'features' 
  | 'testimonials' 
  | 'benefits'
  | 'pricing' 
  | 'faq' 
  | 'cta'
  | 'about'
  | 'steps'
  | 'curriculum'
  | 'instructor'
  | 'proof'
  | 'future'
  | 'custom';

// Reactコンポーネント名 (実際の実装で使用する命名規則)
export type ComponentName = 
  | 'Hero' 
  | 'Benefits' 
  | 'Testimonials' 
  | 'Pricing' 
  | 'FAQ' 
  | 'CallToAction'
  | 'About'
  | 'Steps'
  | 'Curriculum'
  | 'Instructor'
  | 'Proof'
  | 'Future'
  | 'Custom';

// セクションのインターフェース定義
export interface Section {
  id: string;
  type: SectionType;  // 汎用セクションタイプ (hero, features, etc.)
  componentName: ComponentName;  // 実装コンポーネント名 (Hero, Benefits, etc.)
  title: string;
  content: string;
  position: number;
  isTestable: boolean;  // A/Bテスト対象セクションか
  html?: string;  // 生成されたHTML (オプション)
}

// セクションタイプとコンポーネント名のマッピング
export const SECTION_TYPE_TO_COMPONENT: Record<SectionType, ComponentName> = {
  'hero': 'Hero',
  'features': 'Benefits',
  'testimonials': 'Testimonials',
  'benefits': 'Benefits',
  'pricing': 'Pricing',
  'faq': 'FAQ',
  'cta': 'CallToAction',
  'about': 'About',
  'steps': 'Steps',
  'curriculum': 'Curriculum',
  'instructor': 'Instructor',
  'proof': 'Proof',
  'future': 'Future',
  'custom': 'Custom'
};

// コンポーネント名とセクションタイプのマッピング (逆引き)
export const COMPONENT_TO_SECTION_TYPE: Record<ComponentName, SectionType> = {
  'Hero': 'hero',
  'Benefits': 'benefits',
  'Testimonials': 'testimonials',
  'Pricing': 'pricing',
  'FAQ': 'faq',
  'CallToAction': 'cta',
  'About': 'about',
  'Steps': 'steps',
  'Curriculum': 'curriculum',
  'Instructor': 'instructor',
  'Proof': 'proof',
  'Future': 'future',
  'Custom': 'custom'
};

// 各セクションタイプの説明
export const SECTION_TYPE_DESCRIPTIONS: Record<SectionType, string> = {
  'hero': 'トップに配置され、主要な価値提案を表示するセクション',
  'features': '製品・サービスの主要機能や特徴を紹介するセクション',
  'benefits': '製品・サービスによって得られるメリットを紹介するセクション',
  'testimonials': 'お客様の声や推薦文を表示するセクション',
  'pricing': '料金プランやオプションを表示するセクション',
  'faq': 'よくある質問とその回答を表示するセクション',
  'cta': '行動喚起ボタンや申し込みフォームを含むセクション',
  'about': '会社情報や提供者の情報を紹介するセクション',
  'steps': 'プロセスやステップを順番に説明するセクション',
  'curriculum': 'コースやプログラムのカリキュラムを紹介するセクション',
  'instructor': '講師やインストラクターの紹介をするセクション',
  'proof': '実績や証拠を示すセクション',
  'future': '将来的なビジョンや展望を紹介するセクション',
  'custom': 'カスタム定義されたセクション'
};

// セクション構造の型
export interface LPStructure {
  id: string;
  name: string;
  description: string;
  sections: Section[];
}