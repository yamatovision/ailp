// test-ai-flow-standalone.js - AI機能の並列処理フローをテストするスタンドアロンスクリプト

// 環境変数設定（本番環境では.env.localまたは環境変数で設定すること）
process.env.CLAUDE_API_KEY = ""; // ここにClaudeのAPIキーを設定
process.env.CLAUDE_API_MODEL = "claude-3-sonnet-20240229"; // 使用するモデル

const https = require('https');
const Anthropic = require('@anthropic-ai/sdk');

// Anthropicクライアントの初期化
const apiKey = process.env.CLAUDE_API_KEY;
console.log('CLAUDE_API_KEY 設定状況:', apiKey ? '設定されています' : '設定されていません');

if (!apiKey) {
  console.error('CLAUDE_API_KEY 環境変数が設定されていません。');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: apiKey,
});

// モデル名を環境変数から取得（デフォルトはClaude 3 Sonnet）
const MODEL_NAME = process.env.CLAUDE_API_MODEL || 'claude-3-sonnet-20240229';

// 完了を処理する関数
async function getCompletion(
  prompt,
  options = {}
) {
  const { temperature = 0.7, maxTokens = 4000, systemPrompt = '' } = options;

  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY環境変数が設定されていません。');
  }

  try {
    console.log(`AnthropicAPI呼び出し: model=${MODEL_NAME}, prompt長=${prompt.length}文字`);
    
    const response = await anthropic.messages.create({
      model: MODEL_NAME,
      system: systemPrompt || 'You are an expert LP designer and web developer.',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
    });

    console.log('AnthropicAPI応答を受信: 成功');
    return response.content[0].text;
  } catch (error) {
    console.error('Anthropic API エラー:', error);
    if (error instanceof Error) {
      throw new Error(`Anthropic API エラー: ${error.message}`);
    }
    throw new Error('Anthropic API 呼び出し中に不明なエラーが発生しました');
  }
}

// バッチレスポンスを処理する関数（複数セクションを並列処理）
async function getBatchCompletions(
  prompts,
  options = {}
) {
  const { temperature = 0.7, maxTokens = 4000 } = options;

  // すべてのプロミスを作成
  const promises = prompts.map(async ({ id, prompt, systemPrompt }) => {
    try {
      const content = await getCompletion(prompt, {
        temperature,
        maxTokens,
        systemPrompt,
      });
      return { id, content, error: null };
    } catch (error) {
      console.error(`Error with prompt ${id}:`, error);
      return { id, content: null, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // すべてのプロミスを並列実行
  const results = await Promise.all(promises);
  return results;
}

// SYSTEM PROMPTS 定義
const SYSTEM_PROMPTS = {
  // LP構造分析用システムプロンプト
  STRUCTURE_ANALYZER: `あなたはLPデザインと構造分析の専門家です。
ユーザーの入力をもとに、効果的なLP（ランディングページ）の構造を分析し、以下の要素に分解してください：

1. メインヘッダー（ヒーローセクション）
2. サービス紹介セクション
3. ベネフィット/特徴セクション
4. 実績/証言セクション
5. よくある質問（FAQ）セクション
6. 料金/プラン紹介セクション
7. コンタクト/CTAセクション

各セクションで、必要な情報と表現方法を提案してください。
回答は常にJSON形式で返し、各セクションの提案内容を含めてください。`,

  // セクション別コード生成用システムプロンプト
  SECTION_GENERATOR: `あなたはLPの特定セクションを専門に作成するフロントエンド開発者です。
指定されたセクションタイプに特化したHTMLとCSSコードを生成してください。

生成するコードは以下の要件を満たす必要があります：
- セクションタイプに最適なレイアウトとデザイン
- モバイルとデスクトップに対応したレスポンシブデザイン
- プロフェッショナルな見た目と操作感
- 指定された内容を効果的に表現
- Tailwind CSSクラスを使用したスタイリング
- 必要に応じてアニメーションや効果を含める

コードは<section>タグで囲み、class属性にはセクションタイプを示すクラス名を含めてください。
完全なコードブロックとして出力してください。`,

  // A/Bバリアント生成用システムプロンプト
  VARIANT_GENERATOR: `あなたはA/Bテスト最適化の専門家です。
提供されたLPセクションに対して、テスト効果の高いバリアントを生成してください。

バリアントを生成する際は、以下の要素を考慮してください：
1. 主要なヘッドライン（キャッチコピー）
2. サブヘッドライン
3. 視覚的要素（画像、動画など）の配置と内容
4. CTAボタンのテキスト、色、配置
5. フォーム要素のデザインと配置
6. テキストの長さと詳細度
7. 社会的証明（実績、証言など）の表示方法

オリジナルとバリアントの間には、意味のある違い（統計的に有意な差を生む可能性のある変更）を必ず設けてください。
コードはHTMLとTailwind CSSクラスを使用し、完全なセクションブロックとして生成してください。`,
};

// 特定のセクションタイプに対するプロンプトテンプレート
function getSectionPrompt(sectionType, content) {
  const sectionPrompts = {
    hero: `以下の情報をもとに、魅力的なヒーローセクション（メインヘッダー）のHTMLとCSSコードを生成してください。

ヒーローセクションには以下の要素を含めてください：
- 注目を引くヘッドライン
- サブヘッドラインで価値提案
- 明確なCTAボタン
- 適切な背景画像または図形
- モバイル対応のレスポンシブデザイン

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,

    features: `以下の情報をもとに、製品/サービスの特徴を紹介するセクションのHTMLとCSSコードを生成してください。

特徴セクションには以下の要素を含めてください：
- 明確な特徴見出し
- 各特徴の簡潔な説明
- アイコンまたは視覚的要素
- 整理されたグリッドまたはカードレイアウト
- ユーザーメリットにフォーカスした内容

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,

    testimonials: `以下の情報をもとに、信頼性を高める証言/実績セクションのHTMLとCSSコードを生成してください。

証言セクションには以下の要素を含めてください：
- クライアント/ユーザーの引用
- 証言者の名前、役職、可能であれば写真
- 会社/組織名または関連情報
- 視覚的に魅力的なレイアウト
- 信頼性を高める要素（評価やアイコンなど）

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,

    pricing: `以下の情報をもとに、明確で説得力のある料金/プランセクションのHTMLとCSSコードを生成してください。

料金セクションには以下の要素を含めてください：
- プラン名と明確な価格表示
- 各プランの主要な特徴/含まれるもの
- 特典や限定オファーの強調表示
- CTAボタン
- 比較しやすいレイアウト

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,

    faq: `以下の情報をもとに、ユーザーの疑問に答えるFAQセクションのHTMLとCSSコードを生成してください。

FAQセクションには以下の要素を含めてください：
- 一般的な質問とその回答
- アコーディオン形式（クリックで開閉可能）
- カテゴリ分けされた構造（必要に応じて）
- 視覚的に整理されたデザイン
- SEOに適した構造

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,

    cta: `以下の情報をもとに、効果的なCTA（行動喚起）セクションのHTMLとCSSコードを生成してください。

CTAセクションには以下の要素を含めてください：
- 強力なヘッドライン
- 行動を促す明確なボタン
- 緊急性や価値を伝えるサブテキスト
- 視覚的に目立つデザイン
- シンプルなフォーム（必要な場合）

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,

    contact: `以下の情報をもとに、ユーザーフレンドリーなコンタクトセクションのHTMLとCSSコードを生成してください。

コンタクトセクションには以下の要素を含めてください：
- 適切なフォームフィールド
- 連絡先情報（メール、電話など）
- 送信ボタン
- バリデーションの視覚的フィードバック
- プライバシーポリシーへの言及

情報：
${content}

Tailwind CSSを使用し、完全なHTMLセクションとして実装してください。`,
  };

  return sectionPrompts[sectionType] || `以下の情報をもとに、${sectionType}セクションのHTMLとCSSコードを生成してください。
Tailwind CSSを使用し、レスポンシブデザインで実装してください。

情報：
${content}`;
}

// モックLPの内容
const mockLPContent = `
# プログラミングスクール「CodeMaster」の概要

## サービス概要
CodeMasterは、初心者から上級者まで対応する実践的なプログラミングスクールです。
オンラインとオフラインの両方の学習環境を提供し、現役エンジニアによる直接指導を特徴としています。
実際の開発現場で使われる技術スタックを学び、卒業時には実践的なポートフォリオを複数作成できます。

## ターゲットユーザー
- プログラミング未経験から転職を目指す20〜30代
- 副業や独立を視野に入れるビジネスパーソン
- スキルアップを目指す現役エンジニア

## 特徴・強み
1. 現役エンジニアによるマンツーマン指導
2. 実践的なプロジェクト開発中心のカリキュラム
3. 転職サポート・案件紹介サービス完備
4. 卒業後も利用できる共同ワークスペース
5. コミュニティ参加で卒業後も継続的な学習環境

## 料金プラン
- フルタイムプラン: 498,000円（3ヶ月集中）
- パートタイムプラン: 348,000円（6ヶ月）
- 単科コース: 98,000円〜（4週間）

## 卒業生の実績
- 大手IT企業への転職成功率78%
- フリーランスエンジニアとして独立した卒業生が年間約50名
- 平均年収アップ率35%
`;

// 並列処理のテスト関数
async function testParallelAIFlow() {
  console.time('全体処理時間');

  try {
    console.log('=== AIフロー統合テスト開始 ===');
    console.log('テスト内容: LP文章からセクションへの分割・並列HTML生成プロセス\n');

    // ステップ1: LP構造分析
    console.log('ステップ1: LP構造分析...');
    console.time('LP構造分析');
    
    const structurePrompt = `
以下の情報をもとに、効果的なLPの構造を分析し、各セクションの内容と構成を提案してJSONで返してください。

■ サービス情報:
${mockLPContent}

■ ターゲットオーディエンス:
プログラミング未経験者、キャリアチェンジを考えている人、スキルアップしたいエンジニア

■ 目標/コンバージョン:
無料説明会への申し込み

各セクション（ヒーロー、特徴、証言、料金、FAQ、CTA）の推奨内容と構成を提案し、それぞれのセクションがLP全体のストーリーにどう貢献するかを説明してください。`;
    
    const structureResponse = await getCompletion(structurePrompt, {
      systemPrompt: SYSTEM_PROMPTS.STRUCTURE_ANALYZER,
      temperature: 0.7,
    });
    
    console.timeEnd('LP構造分析');
    
    // JSONデータを抽出（格納形式によって調整）
    let structureData;
    try {
      // JSON文字列を抽出（```json...```形式の場合も対応）
      const jsonMatch = structureResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        structureResponse.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, structureResponse];
      
      const jsonStr = jsonMatch[1].trim();
      structureData = JSON.parse(jsonStr);
      console.log(`構造分析完了: ${Object.keys(structureData).length}個のセクションを検出`);
      console.log('セクション一覧:');
      
      // セクションを配列形式に統一
      let sections = [];
      if (structureData.sections) {
        sections = structureData.sections;
      } else if (Array.isArray(structureData)) {
        sections = structureData;
      } else {
        // キーがセクション名の場合
        sections = Object.entries(structureData).map(([key, value]) => {
          return {
            type: key.toLowerCase(),
            title: value.title || key,
            content: value.content || value.description || JSON.stringify(value),
          };
        });
      }
      
      // セクション情報表示
      sections.forEach((section, index) => {
        console.log(`  ${index + 1}. ${section.type || 'セクション'}: ${section.title || '無題'}`);
      });
      console.log('');
      
      // ステップ2: 並列セクション生成
      console.log('ステップ2: 並列セクション生成...');
      console.time('全セクション生成');
      
      // 各セクションごとにプロンプトを準備
      const prompts = sections.map((section, index) => ({
        id: `section-${index}`,
        prompt: getSectionPrompt(section.type || 'generic', section.content || section.description || ''),
        systemPrompt: SYSTEM_PROMPTS.SECTION_GENERATOR,
      }));
      
      // バッチリクエストを実行
      const responses = await getBatchCompletions(prompts, {
        temperature: 0.7,
      });
      
      console.timeEnd('全セクション生成');
      console.log(`${responses.length}個のセクションを生成完了\n`);
      
      // 生成結果サマリー
      console.log('生成結果サマリー:');
      responses.forEach((response, index) => {
        if (response.content && !response.error) {
          // HTMLコードブロックを抽出
          const htmlMatch = response.content.match(/```html\s*([\s\S]*?)\s*```/) || 
                          response.content.match(/```\s*([\s\S]*?)\s*```/) || 
                          [null, response.content];
          
          const html = htmlMatch[1].trim();
          const byteSize = Buffer.from(html).length;
          console.log(`  セクション #${index + 1} (${response.id}): ${byteSize} バイト, 約${Math.floor(html.length / 100)}00文字`);
        } else if (response.error) {
          console.log(`  セクション #${index + 1} (${response.id}): エラー - ${response.error}`);
        }
      });
      
      // ステップ3: バリアント生成テスト（最初のセクションのみ）
      if (responses[0] && responses[0].content) {
        console.log('\nステップ3: バリアント生成テスト (最初のセクション)...');
        console.time('バリアント生成');
        
        // HTMLコードブロックを抽出
        const htmlMatch = responses[0].content.match(/```html\s*([\s\S]*?)\s*```/) || 
                        responses[0].content.match(/```\s*([\s\S]*?)\s*```/) || 
                        [null, responses[0].content];
        
        const originalHtml = htmlMatch[1].trim();
        const sectionType = sections[0].type || 'hero';
        
        const variantPrompt = `以下はLPの${sectionType}セクションの元のHTMLコードです。このセクションのA/Bテスト用バリアントを生成してください。

元のHTML:
\`\`\`html
${originalHtml}
\`\`\`

A/Bテストで効果的な違いを持つバリアントを生成してください。以下の点を変更検討してください：
1. ヘッドラインのメッセージング
2. 視覚的要素のレイアウト
3. CTAボタンの文言やデザイン
4. コンテンツの提示方法

元のセクションとは明確に異なる、しかし同じ目的を達成できるバリアントHTMLコードを生成してください。
生成したコードはHTMLブロックとして返してください。`;
        
        const variantResponse = await getCompletion(variantPrompt, {
          systemPrompt: SYSTEM_PROMPTS.VARIANT_GENERATOR,
          temperature: 0.8,
        });
        
        console.timeEnd('バリアント生成');
        
        // HTMLコードブロックを抽出
        const variantHtmlMatch = variantResponse.match(/```html\s*([\s\S]*?)\s*```/) || 
                              variantResponse.match(/```\s*([\s\S]*?)\s*```/) || 
                              [null, variantResponse];
        
        const variantHtml = variantHtmlMatch[1].trim();
        const variantByteSize = Buffer.from(variantHtml).length;
        
        console.log(`バリアント生成完了: ${variantByteSize} バイト, 約${Math.floor(variantHtml.length / 100)}00文字\n`);
      }
      
      console.log('テスト結果サマリー:');
      console.log('1. LP構造分析: 成功');
      console.log(`2. 並列セクション生成: ${responses.filter(r => !r.error).length}/${responses.length} セクション成功`);
      if (responses[0] && responses[0].content) {
        console.log('3. バリアント生成: 成功');
      } else {
        console.log('3. バリアント生成: 失敗またはスキップ');
      }
      
    } catch (jsonError) {
      console.error('構造データの解析に失敗:', jsonError);
      console.log('生成されたレスポンス:\n', structureResponse.substring(0, 500) + '...');
    }
  } catch (error) {
    console.error('AIフローテスト全体でエラーが発生:', error);
  }
  
  console.timeEnd('全体処理時間');
  console.log('\n=== AIフロー統合テスト終了 ===');
}

// テスト実行
testParallelAIFlow().catch(console.error);