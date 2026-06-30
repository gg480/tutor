import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 开始初始化数据...");

  // 创建管理员账号
  const adminEmail = process.env.ADMIN_EMAIL || "admin@shibu.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "shibu123456";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: "拾步管理员",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "admin",
      },
    });
    console.log(`✅ 管理员账号创建成功: ${adminEmail}`);
  } else {
    console.log(`ℹ️ 管理员账号已存在: ${adminEmail}`);
  }

  // 插入基础知识点（数学 - 初中）
  console.log("📚 初始化知识点...");
  const mathPoints = [
    { subject: "数学", grade: "初一", name: "有理数", level: 2, sortOrder: 1 },
    { subject: "数学", grade: "初一", name: "整式的加减", level: 2, sortOrder: 2 },
    { subject: "数学", grade: "初一", name: "一元一次方程", level: 2, sortOrder: 3 },
    { subject: "数学", grade: "初一", name: "二元一次方程组", level: 2, sortOrder: 4 },
    { subject: "数学", grade: "初一", name: "不等式与不等式组", level: 2, sortOrder: 5 },
    { subject: "数学", grade: "初一", name: "几何图形初步", level: 2, sortOrder: 6 },
    { subject: "数学", grade: "初二", name: "三角形", level: 2, sortOrder: 7 },
    { subject: "数学", grade: "初二", name: "全等三角形", level: 2, sortOrder: 8 },
    { subject: "数学", grade: "初二", name: "轴对称", level: 2, sortOrder: 9 },
    { subject: "数学", grade: "初二", name: "整式乘除与因式分解", level: 2, sortOrder: 10 },
    { subject: "数学", grade: "初二", name: "分式", level: 2, sortOrder: 11 },
    { subject: "数学", grade: "初二", name: "二次根式", level: 2, sortOrder: 12 },
    { subject: "数学", grade: "初二", name: "勾股定理", level: 2, sortOrder: 13 },
    { subject: "数学", grade: "初二", name: "平行四边形", level: 2, sortOrder: 14 },
    { subject: "数学", grade: "初三", name: "一元二次方程", level: 2, sortOrder: 15 },
    { subject: "数学", grade: "初三", name: "二次函数", level: 2, sortOrder: 16 },
    { subject: "数学", grade: "初三", name: "旋转", level: 2, sortOrder: 17 },
    { subject: "数学", grade: "初三", name: "圆", level: 2, sortOrder: 18 },
    { subject: "数学", grade: "初三", name: "相似三角形", level: 2, sortOrder: 19 },
    { subject: "数学", grade: "初三", name: "锐角三角函数", level: 2, sortOrder: 20 },
  ];

  for (const point of mathPoints) {
    const existingPoint = await prisma.knowledgePoint.findFirst({
      where: {
        subject: point.subject,
        grade: point.grade,
        name: point.name,
        level: point.level,
      },
    });
    if (!existingPoint) {
      await prisma.knowledgePoint.create({ data: point });
    }
  }
  console.log(`✅ 已初始化 ${mathPoints.length} 个知识点`);

  console.log("🎉 初始化完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
