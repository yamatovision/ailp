import { prisma } from '@/lib/db/prisma';

// LP一覧の取得
export async function getLPsFromDB(options: {
  userId?: string;
  status?: string;
  searchQuery?: string;
  sortBy?: string;
  limit?: number;
  skip?: number;
}) {
  const { userId, status, searchQuery, sortBy = 'createdAt_desc', limit = 10, skip = 0 } = options;

  // クエリ条件の構築
  const where: any = {};

  // ユーザーIDが指定されていれば、そのユーザーのLPのみ取得
  if (userId) {
    where.userId = userId;
  }

  // ステータスが指定されていれば、そのステータスのLPのみ取得
  if (status && status !== 'all') {
    where.status = status;
  }

  // 検索クエリが指定されていれば、タイトルまたは説明文に部分一致するLPを取得
  if (searchQuery) {
    where.OR = [
      {
        title: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
    ];
  }

  // 並び替え条件の解析
  const [sortField, sortDirection] = sortBy.split('_');
  const orderBy: any = {};
  
  switch (sortField) {
    case 'name':
      orderBy.title = sortDirection === 'asc' ? 'asc' : 'desc';
      break;
    case 'createdAt':
      orderBy.createdAt = sortDirection === 'asc' ? 'asc' : 'desc';
      break;
    default:
      orderBy.createdAt = 'desc'; // デフォルトは作成日の降順
  }

  try {
    // LPプロジェクトを取得
    const lps = await prisma.lpProject.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        // ここではコンバージョン情報を取得しないが、
        // 本番環境では別のテーブルからコンバージョン情報を集計して取得する必要がある
      },
    });

    // 総件数の取得
    const totalCount = await prisma.lpProject.count({ where });

    return { lps, totalCount };
  } catch (error) {
    console.error('Error fetching LPs from database:', error);
    throw new Error('Failed to fetch LPs from database');
  }
}

// 特定のLPの取得
export async function getLPFromDB(id: string) {
  try {
    const lp = await prisma.lpProject.findUnique({
      where: { id },
      include: {
        components: {
          include: {
            variants: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!lp) {
      throw new Error('LP not found');
    }

    return lp;
  } catch (error) {
    console.error(`Error fetching LP ${id} from database:`, error);
    throw new Error('Failed to fetch LP from database');
  }
}

// LP作成
export async function createLPInDB(data: {
  userId: string;
  title: string;
  description?: string;
  status?: string;
  thumbnail?: string;
}) {
  try {
    const { userId, title, description = null, status = 'draft', thumbnail = null } = data;

    const lp = await prisma.lpProject.create({
      data: {
        userId,
        title,
        description,
        status,
        thumbnail,
      },
    });

    return lp;
  } catch (error) {
    console.error('Error creating LP in database:', error);
    throw new Error('Failed to create LP in database');
  }
}

// LP更新
export async function updateLPInDB(id: string, data: {
  title?: string;
  description?: string;
  status?: string;
  thumbnail?: string;
  designSystem?: any;
  designStyle?: string;
}) {
  try {
    const lp = await prisma.lpProject.update({
      where: { id },
      data,
    });

    return lp;
  } catch (error) {
    console.error(`Error updating LP ${id} in database:`, error);
    throw new Error('Failed to update LP in database');
  }
}

// LP削除
export async function deleteLPFromDB(id: string) {
  try {
    await prisma.lpProject.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error(`Error deleting LP ${id} from database:`, error);
    throw new Error('Failed to delete LP from database');
  }
}

// LP複製
export async function duplicateLPInDB(id: string, userId: string) {
  try {
    // トランザクションを開始
    return await prisma.$transaction(async (tx) => {
      // 元のLPを取得
      const originalLP = await tx.lpProject.findUnique({
        where: { id },
        include: {
          components: {
            include: {
              variants: true,
            },
            orderBy: {
              position: 'asc',
            },
          },
        },
      });

      if (!originalLP) {
        throw new Error('Original LP not found');
      }

      // 新しいLPを作成
      const newLP = await tx.lpProject.create({
        data: {
          userId,
          title: `${originalLP.title} (コピー)`,
          description: originalLP.description,
          status: 'draft', // 複製されたLPは常に下書き状態
          thumbnail: originalLP.thumbnail,
        },
      });

      // コンポーネントのコピー
      for (const component of originalLP.components) {
        const newComponent = await tx.lpComponent.create({
          data: {
            projectId: newLP.id,
            componentType: component.componentType,
            position: component.position,
            aiPrompt: component.aiPrompt,
            aiParameters: component.aiParameters || undefined,
          },
        });

        // バリアントのコピー
        for (const variant of component.variants) {
          await tx.lpComponentVariant.create({
            data: {
              componentId: newComponent.id,
              variantType: variant.variantType,
              htmlContent: variant.htmlContent,
              cssContent: variant.cssContent,
              jsContent: variant.jsContent,
              reactComponent: variant.reactComponent,
              metadata: variant.metadata || undefined,
            },
          });
        }
      }

      return newLP;
    });
  } catch (error) {
    console.error(`Error duplicating LP ${id} in database:`, error);
    throw new Error('Failed to duplicate LP in database');
  }
}