/**
 * データベーステーブル確認スクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// Prismaクライアント初期化
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function checkDatabaseTables() {
  try {
    console.log('データベーステーブルの確認を開始します...\n');

    // Userテーブルの確認
    console.log('=== Userテーブル ===');
    const users = await prisma.user.findMany();
    console.log(`ユーザー数: ${users.length}`);
    console.log('ユーザー一覧:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, 名前: ${user.name}, メール: ${user.email}, 作成日: ${user.createdAt}`);
    });

    // LpProjectテーブルの確認
    console.log('\n=== LpProjectテーブル ===');
    const projects = await prisma.lpProject.findMany();
    console.log(`プロジェクト数: ${projects.length}`);
    if (projects.length > 0) {
      console.log('プロジェクト一覧:');
      projects.forEach(project => {
        console.log(`- ID: ${project.id}, タイトル: ${project.title}, ユーザーID: ${project.userId}, ステータス: ${project.status}`);
      });
    }

    // LpComponentテーブルの確認
    console.log('\n=== LpComponentテーブル ===');
    const components = await prisma.lpComponent.findMany();
    console.log(`コンポーネント数: ${components.length}`);

    // ComponentVariantテーブルの確認
    console.log('\n=== ComponentVariantテーブル ===');
    const variants = await prisma.componentVariant.findMany();
    console.log(`バリアント数: ${variants.length}`);

    // TestSettingテーブルの確認
    console.log('\n=== TestSettingテーブル ===');
    const testSettings = await prisma.testSetting.findMany();
    console.log(`テスト設定数: ${testSettings.length}`);

    console.log('\n確認完了しました。');

  } catch (error) {
    console.error('データベース確認中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseTables().catch(console.error);