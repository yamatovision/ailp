const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  
  try {
    console.log("データベース接続テスト");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("接続成功:", result);
  } catch (error) {
    console.error("接続エラー:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
