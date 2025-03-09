// test-ai-flow.js - AI機能の並列処理フローをテストするスクリプト

const { getCompletion, getBatchCompletions } = require('../src/server/ai/claude-client');
const { SYSTEM_PROMPTS, getSectionPrompt } = require('../src/server/ai/prompt-templates');

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