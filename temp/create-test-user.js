/**
 * テストユーザー作成スクリプト
 */

// 環境変数読み込み
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

// 環境変数確認
console.log('環境変数チェック:');
console.log('DATABASE_URL存在:', process.env.DATABASE_URL ? true : false);
console.log('NEXT_PUBLIC_SUPABASE_URL存在:', process.env.NEXT_PUBLIC_SUPABASE_URL ? true : false);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY存在:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? true : false);

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// PrismaClientが利用可能な場合のみ初期化
let prisma;
try {
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
} catch (e) {
  console.warn('Prismaクライアントの初期化エラー:', e.message);
  console.warn('Prismaの機能は使用できません。Supabaseのみでユーザー作成を継続します。');
  prisma = null;
}

async function createTestUser() {
  try {
    // Supabaseにユーザー登録
    console.log('\nSupabaseにテストユーザーを登録中...');
    const email = 'test@example.com';
    const password = 'password123';

    // すでに存在するかチェック
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.log('Supabase登録エラー:', signUpError.message);
      // すでに存在する場合はサインインを試みる
      console.log('既存ユーザーとしてサインインを試みます...');
      const { data: { user: existingUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('サインインエラー:', signInError.message);
        return;
      }

      console.log('既存ユーザーとしてサインイン成功:', existingUser.id);
    } else {
      console.log('新規ユーザー作成成功:', user.id);
    }

    // Prismaが利用可能な場合のみ実行
    if (prisma) {
      try {
        // Prismaでユーザーを確認または作成
        const existingPrismaUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (existingPrismaUser) {
          console.log('Prismaに既存ユーザーが見つかりました:', existingPrismaUser.id);
        } else {
          // 新規ユーザーをPrismaに作成
          const prismaUser = await prisma.user.create({
            data: {
              email,
              name: 'テストユーザー',
              password: 'hashed_' + password, // 実際にはハッシュ化するべき
            },
          });
          console.log('Prismaにユーザーを作成しました:', prismaUser.id);
        }
      } catch (e) {
        console.error('Prisma操作エラー:', e.message);
        console.log('Prismaの操作はスキップされました。');
      }
    } else {
      console.log('Prismaは利用できないため、Supabaseユーザーのみ作成されました。');
    }
    
    console.log('\n====================================');
    console.log('テストユーザーの作成が完了しました\!');
    console.log('ログイン情報:');
    console.log('メールアドレス: test@example.com');
    console.log('パスワード: password123');
    console.log('====================================\n');

  } catch (error) {
    console.error('エラー発生:', error);
  } finally {
    // Prismaが利用可能な場合のみ切断
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

createTestUser().catch(console.error);
