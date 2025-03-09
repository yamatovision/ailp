import { prisma } from '@/lib/db/prisma';

// バリアント一覧の取得
export async function getVariantsFromDB(componentId: string) {
  try {
    const variants = await prisma.componentVariant.findMany({
      where: { componentId },
    });

    return variants;
  } catch (error) {
    console.error(`Error fetching variants for component ${componentId}:`, error);
    throw new Error('Failed to fetch variants from database');
  }
}

// 特定のバリアントの取得
export async function getVariantFromDB(id: string) {
  try {
    const variant = await prisma.componentVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    return variant;
  } catch (error) {
    console.error(`Error fetching variant ${id}:`, error);
    throw new Error('Failed to fetch variant from database');
  }
}

// バリアント作成
export async function createVariantInDB(data: {
  componentId: string;
  variantType: string;
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
  reactComponent?: string;
  metadata?: any;
}) {
  try {
    const {
      componentId,
      variantType,
      htmlContent,
      cssContent,
      jsContent,
      reactComponent,
      metadata,
    } = data;

    const variant = await prisma.componentVariant.create({
      data: {
        componentId,
        variantType,
        htmlContent,
        cssContent,
        jsContent,
        reactComponent,
        metadata: metadata || undefined,
      },
    });

    return variant;
  } catch (error) {
    console.error('Error creating variant in database:', error);
    throw new Error('Failed to create variant in database');
  }
}

// バリアント更新
export async function updateVariantInDB(id: string, data: {
  variantType?: string;
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
  reactComponent?: string;
  metadata?: any;
}) {
  try {
    const variant = await prisma.componentVariant.update({
      where: { id },
      data,
    });

    return variant;
  } catch (error) {
    console.error(`Error updating variant ${id}:`, error);
    throw new Error('Failed to update variant in database');
  }
}

// バリアント削除
export async function deleteVariantFromDB(id: string) {
  try {
    await prisma.componentVariant.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting variant ${id}:`, error);
    throw new Error('Failed to delete variant from database');
  }
}

// コンポーネントのすべてのバリアントを削除
export async function deleteAllVariantsFromDB(componentId: string) {
  try {
    await prisma.componentVariant.deleteMany({
      where: { componentId },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting all variants for component ${componentId}:`, error);
    throw new Error('Failed to delete variants from database');
  }
}