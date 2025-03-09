import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 全アシスタント取得API
export async function GET() {
  try {
    const assistants = await prisma.assistant.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return NextResponse.json(assistants);
  } catch (error) {
    console.error('Assistants fetch error:', error);
    return NextResponse.json(
      { error: 'アシスタント情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// アシスタント新規作成API
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // バリデーション
    if (!data.name || !data.title || !data.systemPrompt || !data.initialMessage) {
      return NextResponse.json(
        { error: '必須フィールドが入力されていません' },
        { status: 400 }
      );
    }
    
    // 参考資料がJSON文字列であることを確認
    if (data.referenceDocuments) {
      try {
        JSON.parse(data.referenceDocuments);
      } catch (e) {
        return NextResponse.json(
          { error: '参考資料はJSON形式で入力してください' },
          { status: 400 }
        );
      }
    }
    
    // 新規アシスタントの作成
    const newAssistant = await prisma.assistant.create({
      data: {
        name: data.name,
        title: data.title,
        description: data.description || null,
        systemPrompt: data.systemPrompt,
        initialMessage: data.initialMessage,
        referenceDocuments: data.referenceDocuments || null,
      }
    });
    
    return NextResponse.json(newAssistant, { status: 201 });
  } catch (error) {
    console.error('Assistant creation error:', error);
    return NextResponse.json(
      { error: 'アシスタントの作成に失敗しました' },
      { status: 500 }
    );
  }
}