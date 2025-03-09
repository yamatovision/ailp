// 環境変数を明示的に設定
process.env.PRISMA_CLIENT_NO_PREPARED_STATEMENTS = 'true';

// モジュールのインポート
const { PrismaClient } = require('@prisma/client');

// テスト用のシンプルなコンポーネントデータ
const testComponent = {
  projectId: 'cm810ro4r000110k4kssam2dz',
  componentType: 'hero',
  position: 1,
  aiParameters: {
    title: 'テストコンポーネント',
    content: 'これはテスト用のコンポーネントです'
  }
};

// メイン関数
async function main() {
  try {
    // Prismaクライアントの初期化
    const prisma = new PrismaClient();
    
    console.log('=== シンプル保存テスト ===');
    
    // テストコンポーネントの保存
    const component = await prisma.lpComponent.create({
      data: {
        projectId: testComponent.projectId,
        componentType: testComponent.componentType,
        position: testComponent.position,
        aiPrompt: JSON.stringify(testComponent.aiParameters),
        aiParameters: testComponent.aiParameters
      }
    });
    
    console.log('コンポーネントを保存しました:', {
      id: component.id,
      type: component.componentType,
      position: component.position
    });
    
    // コンポーネント確認
    const components = await prisma.lpComponent.findMany({
      where: { projectId: testComponent.projectId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`\n最新の${components.length}件のコンポーネント:`);
    components.forEach((comp, i) => {
      console.log(`\n#${i+1}: ID=${comp.id}, Type=${comp.componentType}, Position=${comp.position}`);
    });
    
    // Prisma接続を閉じる
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('エラー発生:', error);
  }
}

// 実行
main();