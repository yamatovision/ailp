// テスト用スクリプト：LPコンポーネントテーブルの確認
const { PrismaClient } = require('@prisma/client');

async function main() {
  // Prismaクライアントの初期化
  const prisma = new PrismaClient();

  try {
    console.log('=== LPコンポーネントテーブルの確認 ===');
    
    // 指定されたLPのID
    const lpId = 'cm810ro4r000110k4kssam2dz';
    
    // LPプロジェクトの基本情報を取得
    console.log(`\n--- LPプロジェクト (ID: ${lpId}) の基本情報 ---`);
    const lp = await prisma.lpProject.findUnique({
      where: { id: lpId },
    });
    console.log(lp);
    
    // LPに関連するコンポーネントを取得
    console.log(`\n--- LPコンポーネント一覧 (ProjectID: ${lpId}) ---`);
    const components = await prisma.lpComponent.findMany({
      where: { projectId: lpId },
      orderBy: { position: 'asc' },
    });
    
    console.log(`コンポーネント総数: ${components.length}`);
    components.forEach((comp, index) => {
      console.log(`\nコンポーネント #${index + 1}:`);
      console.log(`  ID: ${comp.id}`);
      console.log(`  タイプ: ${comp.componentType}`);
      console.log(`  位置: ${comp.position}`);
      console.log(`  AIパラメータ: ${JSON.stringify(comp.aiParameters, null, 2)}`);
      console.log(`  作成日時: ${comp.createdAt}`);
      console.log(`  更新日時: ${comp.updatedAt}`);
    });
    
    // LPコンポーネントのバリアントがあるか確認
    console.log(`\n--- コンポーネントバリアント ---`);
    const variants = await prisma.componentVariant.findMany({
      where: {
        component: {
          projectId: lpId
        }
      }
    });
    
    console.log(`バリアント総数: ${variants.length}`);
    variants.forEach((variant, index) => {
      console.log(`\nバリアント #${index + 1}:`);
      console.log(`  ID: ${variant.id}`);
      console.log(`  コンポーネントID: ${variant.componentId}`);
      console.log(`  タイプ: ${variant.variantType}`);
      console.log(`  HTMLコンテンツ長: ${variant.htmlContent ? variant.htmlContent.length : 0} 文字`);
      console.log(`  作成日時: ${variant.createdAt}`);
    });
    
  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    // Prisma接続を閉じる
    await prisma.$disconnect();
  }
}

main();