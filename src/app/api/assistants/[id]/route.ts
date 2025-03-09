import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Params = {
  params: {
    id: string;
  };
};

// 単一アシスタント取得
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    const assistant = await prisma.assistant.findUnique({
      where: { id }
    });
    
    if (!assistant) {
      return NextResponse.json(
        { error: 'アシスタントが見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(assistant);
  } catch (error) {
    console.error('Assistant fetch error:', error);
    return NextResponse.json(
      { error: 'アシスタント情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// アシスタント更新
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const data = await req.json();
    
    // バリデーション
    if (!data.name || !data.title || !data.systemPrompt || !data.initialMessage) {
      return NextResponse.json(
        { error: '必須フィールドが入力されていません' },
        { status: 400 }
      );
    }
    
    // アシスタントの存在確認
    const existingAssistant = await prisma.assistant.findUnique({
      where: { id }
    });
    
    if (!existingAssistant) {
      return NextResponse.json(
        { error: 'アシスタントが見つかりません' },
        { status: 404 }
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
    
    // アシスタント更新
    const updatedAssistant = await prisma.assistant.update({
      where: { id },
      data: {
        name: data.name,
        title: data.title,
        description: data.description || null,
        systemPrompt: data.systemPrompt,
        initialMessage: data.initialMessage,
        referenceDocuments: data.referenceDocuments || null,
      }
    });
    
    return NextResponse.json(updatedAssistant);
  } catch (error) {
    console.error('Assistant update error:', error);
    return NextResponse.json(
      { error: 'アシスタントの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// アシスタント削除
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    
    // アシスタントの存在確認
    const existingAssistant = await prisma.assistant.findUnique({
      where: { id }
    });
    
    if (!existingAssistant) {
      return NextResponse.json(
        { error: 'アシスタントが見つかりません' },
        { status: 404 }
      );
    }
    
    // アシスタント削除
    await prisma.assistant.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assistant deletion error:', error);
    return NextResponse.json(
      { error: 'アシスタントの削除に失敗しました' },
      { status: 500 }
    );
  }
}