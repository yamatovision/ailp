import { prisma } from '@/lib/db/prisma';

// コンポーネント一覧の取得
export async function getComponentsFromDB(projectId: string) {
  try {
    const components = await prisma.lpComponent.findMany({
      where: { projectId },
      include: {
        variants: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return components;
  } catch (error) {
    console.error(`Error fetching components for project ${projectId}:`, error);
    throw new Error('Failed to fetch components from database');
  }
}

// 特定のコンポーネントの取得
export async function getComponentFromDB(id: string) {
  try {
    const component = await prisma.lpComponent.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!component) {
      throw new Error('Component not found');
    }

    return component;
  } catch (error) {
    console.error(`Error fetching component ${id}:`, error);
    throw new Error('Failed to fetch component from database');
  }
}

// コンポーネント作成
export async function createComponentInDB(data: {
  projectId: string;
  componentType: string;
  position: number;
  aiPrompt?: string;
  aiParameters?: any;
}) {
  try {
    const { projectId, componentType, position, aiPrompt, aiParameters } = data;

    const component = await prisma.lpComponent.create({
      data: {
        projectId,
        componentType,
        position,
        aiPrompt,
        aiParameters: aiParameters || undefined,
      },
    });

    return component;
  } catch (error) {
    console.error('Error creating component in database:', error);
    throw new Error('Failed to create component in database');
  }
}

// コンポーネント更新
export async function updateComponentInDB(id: string, data: {
  componentType?: string;
  position?: number;
  aiPrompt?: string;
  aiParameters?: any;
}) {
  try {
    const component = await prisma.lpComponent.update({
      where: { id },
      data,
    });

    return component;
  } catch (error) {
    console.error(`Error updating component ${id}:`, error);
    throw new Error('Failed to update component in database');
  }
}

// コンポーネント削除
export async function deleteComponentFromDB(id: string) {
  try {
    await prisma.lpComponent.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting component ${id}:`, error);
    throw new Error('Failed to delete component from database');
  }
}

// コンポーネント位置の一括更新
export async function updateComponentPositionsInDB(components: { id: string; position: number }[]) {
  try {
    const updates = components.map(({ id, position }) => 
      prisma.lpComponent.update({
        where: { id },
        data: { position },
      })
    );

    await prisma.$transaction(updates);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating component positions:', error);
    throw new Error('Failed to update component positions in database');
  }
}