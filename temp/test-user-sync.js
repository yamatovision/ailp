/**
 * Supabase認証とPrismaデータベース間のユーザー同期をテストするスクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Prismaクライアント初期化
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// テスト用アカウント情報
const TEST_EMAIL = `test-user@mailinator.com`;  // 実際のテスト用メールアドレス
const TEST_PASSWORD = 'StrongPassword123!';
const TEST_NAME = 'テストユーザー';

async function testUserSync() {
  console.log('======== ユーザー同期テスト開始 ========');
  console.log(`テスト用メールアドレス: ${TEST_EMAIL}`);
  
  try {
    // 1. Supabaseで新規ユーザー作成
    console.log('\n## 1. Supabaseで新規ユーザー作成');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          name: TEST_NAME
        }
      }
    });
    
    if (authError) {
      console.error('Supabaseユーザー作成エラー:', authError);
      throw authError;
    }
    
    console.log('Supabaseユーザー作成成功:', {
      id: authData.user.id,
      email: authData.user.email,
      metadata: authData.user.user_metadata
    });
    
    // 少し待機して同期処理が完了するのを待つ
    console.log('同期処理の完了を待機中...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Prismaでユーザーを検索
    console.log('\n## 2. Prismaでユーザー検索');
    let prismaUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: authData.user.id },
          { email: TEST_EMAIL }
        ]
      }
    });
    
    // 3. 手動同期を実行（APIを直接呼び出し）
    if (!prismaUser) {
      console.log('\n## 3. 手動同期実行（自動同期に失敗した場合）');
      
      try {
        // ユーザー同期APIを直接呼び出し
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/sync-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: authData.user.id,
            email: TEST_EMAIL,
            name: TEST_NAME
          })
        });
        
        if (!syncResponse.ok) {
          console.warn('API同期エラー:', await syncResponse.text());
        } else {
          console.log('API同期成功:', await syncResponse.json());
        }
      } catch (syncError) {
        console.error('API同期中にエラーが発生:', syncError);
      }
      
      // 再度Prismaでユーザーを検索
      console.log('同期後に再検索...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      prismaUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: authData.user.id },
            { email: TEST_EMAIL }
          ]
        }
      });
    }
    
    // 4. 結果確認
    console.log('\n## 4. 同期結果確認');
    if (prismaUser) {
      console.log('Prismaユーザー検出成功:', prismaUser);
      console.log('\n✅ ユーザー同期テスト成功!');
      
      // テストユーザーのSupabase認証とPrismaのIDが一致するか検証
      if (prismaUser.id === authData.user.id) {
        console.log('✅ ユーザーID一致確認: 成功');
      } else {
        console.log('❌ ユーザーID一致確認: 失敗 - IDが一致しません');
        console.log('Supabase ID:', authData.user.id);
        console.log('Prisma ID:', prismaUser.id);
      }
    } else {
      console.log('❌ Prismaユーザー検出失敗: ユーザーが同期されていません');
      console.log('\n❌ ユーザー同期テスト失敗!');
      
      // 手動でユーザーを同期
      console.log('\n手動でユーザーを作成します...');
      const manualUser = await prisma.user.create({
        data: {
          id: authData.user.id,
          name: TEST_NAME,
          email: TEST_EMAIL,
          password: null,
        }
      });
      console.log('手動作成成功:', manualUser);
    }
    
    // 5. クリーンアップ (テストユーザーを削除)
    console.log('\n## 5. クリーンアップ');
    
    // Prismaからユーザーを削除
    if (prismaUser) {
      await prisma.user.delete({
        where: {
          id: prismaUser.id
        }
      });
      console.log('Prismaユーザー削除成功');
    }
    
    // Supabaseからユーザーを削除 (管理者権限が必要)
    // 開発環境ではこの部分は手動で行うことになる場合がある
    console.log('Supabaseユーザーは管理者権限が必要なため、必要に応じて手動で削除してください');
    
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n======== ユーザー同期テスト終了 ========');
  }
}

testUserSync().catch(console.error);