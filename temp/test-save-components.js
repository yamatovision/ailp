// LPコンポーネントを保存するテストスクリプト
const { PrismaClient } = require('@prisma/client');

// プリペアードステートメントを無効化
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // プリペアードステートメントを明示的に無効化
  $on: {
    query: () => {
      // Query logging disabled
    }
  }
});

// テスト用にセクションデータを定義
const testSections = [
  {
    id: "section-1",
    type: "hero",
    componentName: "Hero",
    title: "AIで作る 刺さるLP 5日間無料チャレンジ！",
    content: "メインヒーローセクションでは、「文章力不要、デザインセンス不要、ITスキルも一切不要」という強力なバリュープロポジションを前面に押し出し...",
    position: 1,
    isTestable: true
  },
  {
    id: "section-2",
    type: "curriculum",
    componentName: "Curriculum",
    title: "5日間チャレンジの内容はこちら",
    content: "5日間の各日のカリキュラムを明確に示し、具体的な日時と学習内容を詳細に説明します...",
    position: 2,
    isTestable: false
  }
];

async function main() {
  // Prismaクライアントは既に初期化済み

  try {
    console.log('=== LPコンポーネント保存テスト ===');
    
    // 対象のLPプロジェクトID
    const lpId = 'cm810ro4r000110k4kssam2dz';
    
    // LPプロジェクトの存在確認
    console.log(`\n--- LPプロジェクトの確認 (ID: ${lpId}) ---`);
    const lp = await prisma.lpProject.findUnique({
      where: { id: lpId },
    });
    
    if (!lp) {
      console.error(`指定されたID (${lpId}) のLPプロジェクトが存在しません。`);
      return;
    }
    
    console.log(`LPプロジェクトが見つかりました: ${lp.title}`);
    
    // 既存のコンポーネントを削除
    console.log(`\n--- 既存コンポーネントの削除 ---`);
    const existingComponents = await prisma.lpComponent.findMany({
      where: { projectId: lpId },
    });
    console.log(`${existingComponents.length}個の既存コンポーネントを削除します...`);
    
    if (existingComponents.length > 0) {
      await prisma.lpComponent.deleteMany({
        where: { projectId: lpId },
      });
      console.log(`${existingComponents.length}個の既存コンポーネントを削除しました`);
    } else {
      console.log('削除すべき既存コンポーネントがありません');
    }
    
    // 新しいコンポーネントを作成
    console.log(`\n--- 新規コンポーネントの作成 ---`);
    console.log(`${testSections.length}個のテストセクションをコンポーネントとして保存します...`);
    
    const savedComponents = [];
    for (const [index, section] of testSections.entries()) {
      try {
        // コンポーネントタイプをPrismaモデルに合わせる
        const componentType = section.type || 'section';
        
        // AIプロンプト情報
        const aiParams = {
          title: section.title,
          content: section.content
        };
        
        // 新規コンポーネントを作成
        const component = await prisma.lpComponent.create({
          data: {
            projectId: lpId,
            componentType: componentType,
            position: section.position || index,
            aiPrompt: JSON.stringify(aiParams),
            aiParameters: aiParams
          },
        });
        
        console.log(`セクション ${index + 1}/${testSections.length} を保存しました:`, component.id);
        savedComponents.push(component);
      } catch (compError) {
        console.error(`セクション ${index + 1} の保存エラー:`, compError);
      }
    }
    
    console.log(`\n--- 保存結果 ---`);
    console.log(`${savedComponents.length}個のコンポーネントを保存しました`);
    
    // 保存したコンポーネントの確認
    console.log(`\n--- 保存されたコンポーネントの確認 ---`);
    const newComponents = await prisma.lpComponent.findMany({
      where: { projectId: lpId },
      orderBy: { position: 'asc' },
    });
    
    newComponents.forEach((comp, index) => {
      console.log(`\nコンポーネント #${index + 1}:`);
      console.log(`  ID: ${comp.id}`);
      console.log(`  タイプ: ${comp.componentType}`);
      console.log(`  位置: ${comp.position}`);
      console.log(`  AIパラメータ:`, comp.aiParameters);
      console.log(`  作成日時: ${comp.createdAt}`);
    });
    
  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    // Prisma接続を閉じる
    await prisma.$disconnect();
  }
}

main();