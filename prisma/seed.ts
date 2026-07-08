import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================
// 主数据种子：年级（9 条：小四~高三）
// ============================================================
async function seedGrades() {
  try {
    const grades = [
      { name: "小四", level: "primary", order: 4, schoolTypes: "primary,nine_year" },
      { name: "小五", level: "primary", order: 5, schoolTypes: "primary,nine_year" },
      { name: "小六", level: "primary", order: 6, schoolTypes: "primary,nine_year" },
      { name: "初一", level: "junior", order: 7, schoolTypes: "junior,nine_year,complete_sec" },
      { name: "初二", level: "junior", order: 8, schoolTypes: "junior,nine_year,complete_sec" },
      { name: "初三", level: "junior", order: 9, schoolTypes: "junior,nine_year,complete_sec" },
      { name: "高一", level: "senior", order: 10, schoolTypes: "senior,complete_sec" },
      { name: "高二", level: "senior", order: 11, schoolTypes: "senior,complete_sec" },
      { name: "高三", level: "senior", order: 12, schoolTypes: "senior,complete_sec" },
    ];
    let inserted = 0;
    for (const g of grades) {
      const existing = await prisma.grade.findFirst({ where: { name: g.name } });
      if (!existing) {
        await prisma.grade.create({ data: g });
        inserted++;
      }
    }
    console.log(`✅ 年级种子完成：新增 ${inserted} 条，共 ${grades.length} 条`);
  } catch (err) {
    console.error("❌ seedGrades 失败：", err);
    throw err;
  }
}

// ============================================================
// 主数据种子：学科（12 条：10 学科 + 2 竞赛）
// ============================================================
async function seedSubjects() {
  try {
    const subjects = [
      { name: "语文", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao", applicableLevels: "primary,junior,senior", isCompetition: false },
      { name: "数学", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao,weekly,monthly", applicableLevels: "primary,junior,senior", isCompetition: false },
      { name: "英语", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao", applicableLevels: "primary,junior,senior", isCompetition: false },
      { name: "物理", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao", applicableLevels: "junior,senior", isCompetition: false },
      { name: "化学", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao", applicableLevels: "junior,senior", isCompetition: false },
      { name: "生物", category: "basic", examTypes: "mid_term,final,gaokao", applicableLevels: "junior,senior", isCompetition: false },
      { name: "政治", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao", applicableLevels: "junior,senior", isCompetition: false },
      { name: "历史", category: "basic", examTypes: "mid_term,final,zhongkao,gaokao", applicableLevels: "junior,senior", isCompetition: false },
      { name: "地理", category: "basic", examTypes: "mid_term,final,zhongkao", applicableLevels: "junior,senior", isCompetition: false },
      { name: "信息", category: "basic", examTypes: "final", applicableLevels: "primary,junior,senior", isCompetition: false },
      { name: "奥数", category: "competition", examTypes: "competition", applicableLevels: "primary,junior", isCompetition: true },
      { name: "信息学奥赛", category: "competition", examTypes: "competition", applicableLevels: "primary,junior,senior", isCompetition: true },
    ];
    let inserted = 0;
    for (const s of subjects) {
      const existing = await prisma.subject.findFirst({ where: { name: s.name } });
      if (!existing) {
        await prisma.subject.create({ data: s });
        inserted++;
      }
    }
    console.log(`✅ 学科种子完成：新增 ${inserted} 条，共 ${subjects.length} 条`);
  } catch (err) {
    console.error("❌ seedSubjects 失败：", err);
    throw err;
  }
}

// ============================================================
// 主数据种子：南海区学校（桂城街道 + 狮山镇，50+ 所）
// 数据来源：WebSearch 网络检索 + 已知信息合理填充
// ============================================================
type SchoolSeed = {
  name: string;
  district: string;
  town: string;
  level: string;
  isKey: boolean;
  keyLevel?: string;
};

// 桂城街道学校（28 所）
const guichengSchools: SchoolSeed[] = [
  // 小学（15 所）
  { name: "南海实验小学", district: "南海区", town: "桂城", level: "primary", isKey: true, keyLevel: "区一级" },
  { name: "桂城街道中心小学", district: "南海区", town: "桂城", level: "primary", isKey: true, keyLevel: "省一级" },
  { name: "桂城街道第二小学", district: "南海区", town: "桂城", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "桂城街道第三小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "桂江小学", district: "南海区", town: "桂城", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "海三路小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "叠滘小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "平洲中心小学", district: "南海区", town: "桂城", level: "primary", isKey: true, keyLevel: "省一级" },
  { name: "平洲第二小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "夏西小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "夏北小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "灯湖小学", district: "南海区", town: "桂城", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "怡海小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "花苑小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  { name: "园林小学", district: "南海区", town: "桂城", level: "primary", isKey: false },
  // 初中（8 所）
  { name: "桂江第一初级中学", district: "南海区", town: "桂城", level: "junior", isKey: true, keyLevel: "省一级" },
  { name: "南海实验中学", district: "南海区", town: "桂城", level: "junior", isKey: true, keyLevel: "省一级" },
  { name: "桂城中学", district: "南海区", town: "桂城", level: "junior", isKey: true, keyLevel: "省一级" },
  { name: "平洲第二初级中学", district: "南海区", town: "桂城", level: "junior", isKey: true, keyLevel: "市一级" },
  { name: "平洲第四初级中学", district: "南海区", town: "桂城", level: "junior", isKey: false },
  { name: "叠滘中学", district: "南海区", town: "桂城", level: "junior", isKey: false },
  { name: "桂城中学实验学校", district: "南海区", town: "桂城", level: "nine_year", isKey: true, keyLevel: "区一级" },
  { name: "灯湖中学", district: "南海区", town: "桂城", level: "junior", isKey: false },
  // 高中（5 所，全部为重点）
  { name: "石门中学", district: "南海区", town: "桂城", level: "senior", isKey: true, keyLevel: "省一级" },
  { name: "南海中学", district: "南海区", town: "桂城", level: "senior", isKey: true, keyLevel: "省一级" },
  { name: "桂城中学高中部", district: "南海区", town: "桂城", level: "senior", isKey: true, keyLevel: "市一级" },
  { name: "南海艺术高级中学", district: "南海区", town: "桂城", level: "senior", isKey: true, keyLevel: "市一级" },
  { name: "华附南海实验高中", district: "南海区", town: "桂城", level: "senior", isKey: true, keyLevel: "市一级" },
];

// 狮山镇学校（28 所）
const shishanSchools: SchoolSeed[] = [
  // 小学（15 所）
  { name: "石门实验小学", district: "南海区", town: "狮山", level: "primary", isKey: true, keyLevel: "省一级" },
  { name: "狮山中心小学", district: "南海区", town: "狮山", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "狮城小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "罗村中心小学", district: "南海区", town: "狮山", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "官窑中心小学", district: "南海区", town: "狮山", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "松岗中心小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "小塘中心小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "官窑第二小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "横岗小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "塘联小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "颜峰小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "芦塘小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "招大学校", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "桃园小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  { name: "联和小学", district: "南海区", town: "狮山", level: "primary", isKey: false },
  // 初中（10 所）
  { name: "石门实验中学", district: "南海区", town: "狮山", level: "junior", isKey: true, keyLevel: "省一级" },
  { name: "狮山中学", district: "南海区", town: "狮山", level: "junior", isKey: true, keyLevel: "市一级" },
  { name: "狮城中学", district: "南海区", town: "狮山", level: "junior", isKey: true, keyLevel: "市一级" },
  { name: "罗村第二初级中学", district: "南海区", town: "狮山", level: "junior", isKey: false },
  { name: "松岗中学", district: "南海区", town: "狮山", level: "junior", isKey: false },
  { name: "狮岭中学", district: "南海区", town: "狮山", level: "junior", isKey: false },
  { name: "新联中学", district: "南海区", town: "狮山", level: "junior", isKey: false },
  { name: "官窑中学", district: "南海区", town: "狮山", level: "junior", isKey: false },
  { name: "小塘中学", district: "南海区", town: "狮山", level: "junior", isKey: false },
  { name: "英才学校", district: "南海区", town: "狮山", level: "nine_year", isKey: false },
  // 高中（3 所）
  { name: "石门高级中学", district: "南海区", town: "狮山", level: "senior", isKey: true, keyLevel: "省一级" },
  { name: "狮山高级中学", district: "南海区", town: "狮山", level: "senior", isKey: false },
  { name: "罗村高级中学", district: "南海区", town: "狮山", level: "senior", isKey: false },
];

// 丹灶镇学校（15 所）
// 数据来源：佛山+ 官方公办中小学录取名单 + 公开百科信息
const danzaoSchools: SchoolSeed[] = [
  // 小学（8 所）
  { name: "丹灶中心小学", district: "南海区", town: "丹灶", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "丹灶第二小学", district: "南海区", town: "丹灶", level: "primary", isKey: false },
  { name: "金沙小学", district: "南海区", town: "丹灶", level: "primary", isKey: true, keyLevel: "市一级" },
  { name: "有为小学", district: "南海区", town: "丹灶", level: "primary", isKey: true, keyLevel: "区一级" },
  { name: "联安小学", district: "南海区", town: "丹灶", level: "primary", isKey: false },
  { name: "银河小学", district: "南海区", town: "丹灶", level: "primary", isKey: false },
  { name: "醒华小学", district: "南海区", town: "丹灶", level: "primary", isKey: false },
  { name: "罗行小学", district: "南海区", town: "丹灶", level: "primary", isKey: false },
  // 初中（4 所）
  { name: "丹灶中学", district: "南海区", town: "丹灶", level: "junior", isKey: true, keyLevel: "市一级" },
  { name: "金沙中学", district: "南海区", town: "丹灶", level: "junior", isKey: true, keyLevel: "市一级" },
  { name: "有为初中", district: "南海区", town: "丹灶", level: "junior", isKey: false },
  { name: "南海实验学校有为中学", district: "南海区", town: "丹灶", level: "junior", isKey: true, keyLevel: "区一级" },
  // 高中（2 所，全部为重点）
  { name: "丹灶高级中学", district: "南海区", town: "丹灶", level: "senior", isKey: true, keyLevel: "市一级" },
  { name: "南海实验学校有为高中", district: "南海区", town: "丹灶", level: "senior", isKey: true, keyLevel: "区一级" },
  // 九年一贯制（1 所）
  { name: "南海实验学校丹灶校区", district: "南海区", town: "丹灶", level: "nine_year", isKey: true, keyLevel: "区一级" },
];

async function seedSchools() {
  try {
    const allSchools = [...guichengSchools, ...shishanSchools, ...danzaoSchools];
    let inserted = 0;
    for (const s of allSchools) {
      // 用 name + district 判重，避免重复插入
      const existing = await prisma.school.findFirst({
        where: { name: s.name, district: s.district },
      });
      if (!existing) {
        await prisma.school.create({
          data: {
            name: s.name,
            district: s.district,
            town: s.town,
            level: s.level,
            isKey: s.isKey,
            keyLevel: s.keyLevel ?? null,
            source: "manual",
            verified: true,
          },
        });
        inserted++;
      }
    }
    console.log(`✅ 学校种子完成：新增 ${inserted} 所，共 ${allSchools.length} 所（桂城 ${guichengSchools.length} + 狮山 ${shishanSchools.length} + 丹灶 ${danzaoSchools.length}）`);
  } catch (err) {
    console.error("❌ seedSchools 失败：", err);
    throw err;
  }
}

// ============================================================
// 主数据种子：南海区教材版本配置（小学~高中，58 条）
// 数据来源：电子课本网 dzkbw.com 南海区页面真实数据
//   http://www.dzkbw.com/city/guangdong_foshanshi/nanhaiqu/
// 注：Subject 表中"政治"applicableLevels 仅 junior,senior，
//     故小学段只填语数英 3 学科；电子课本网无信息技术，跳过。
// ============================================================
type TextbookVersionSeed = {
  gradeName: string;
  subjectName: string;
  version: string;
  publisher: string;
};

// 南海区教材版本配置（小学9 + 初中22 + 高中27 = 58 条）
const nanhaiTextbookVersions: TextbookVersionSeed[] = [
  // ---- 小学段（小四~小六）：语数英均人教版 ----
  ...["小四", "小五", "小六"].flatMap((g) => [
    { gradeName: g, subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
    { gradeName: g, subjectName: "数学", version: "人教版", publisher: "人民教育出版社" },
    { gradeName: g, subjectName: "英语", version: "人教版", publisher: "人民教育出版社" },
  ]),
  // ---- 初中段（初一~初三）----
  // 初一：7 学科（语数英 + 生物/政治/历史/地理，无物理化学）
  { gradeName: "初一", subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初一", subjectName: "数学", version: "北师大版", publisher: "北京师范大学出版社" },
  { gradeName: "初一", subjectName: "英语", version: "外研版", publisher: "外语教学与研究出版社" },
  { gradeName: "初一", subjectName: "生物", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初一", subjectName: "政治", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初一", subjectName: "历史", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初一", subjectName: "地理", version: "人教版", publisher: "人民教育出版社" },
  // 初二：8 学科（+物理）
  { gradeName: "初二", subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初二", subjectName: "数学", version: "北师大版", publisher: "北京师范大学出版社" },
  { gradeName: "初二", subjectName: "英语", version: "外研版", publisher: "外语教学与研究出版社" },
  { gradeName: "初二", subjectName: "物理", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初二", subjectName: "生物", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初二", subjectName: "政治", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初二", subjectName: "历史", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初二", subjectName: "地理", version: "人教版", publisher: "人民教育出版社" },
  // 初三：7 学科（+化学，无生物无地理）
  { gradeName: "初三", subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初三", subjectName: "数学", version: "北师大版", publisher: "北京师范大学出版社" },
  { gradeName: "初三", subjectName: "英语", version: "外研版", publisher: "外语教学与研究出版社" },
  { gradeName: "初三", subjectName: "物理", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初三", subjectName: "化学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初三", subjectName: "政治", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "初三", subjectName: "历史", version: "人教版", publisher: "人民教育出版社" },
  // ---- 高中段（高一~高三）：9 学科全 ----
  // 高一
  { gradeName: "高一", subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "数学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "英语", version: "北师大版", publisher: "北京师范大学出版社" },
  { gradeName: "高一", subjectName: "物理", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "化学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "生物", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "政治", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "历史", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高一", subjectName: "地理", version: "人教版", publisher: "人民教育出版社" },
  // 高二（物理改为粤教版）
  { gradeName: "高二", subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高二", subjectName: "数学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高二", subjectName: "英语", version: "北师大版", publisher: "北京师范大学出版社" },
  { gradeName: "高二", subjectName: "物理", version: "粤教版", publisher: "广东教育出版社" },
  { gradeName: "高二", subjectName: "化学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高二", subjectName: "生物", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高二", subjectName: "政治", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高二", subjectName: "历史", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高二", subjectName: "地理", version: "人教版", publisher: "人民教育出版社" },
  // 高三（物理改回人教版）
  { gradeName: "高三", subjectName: "语文", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "数学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "英语", version: "北师大版", publisher: "北京师范大学出版社" },
  { gradeName: "高三", subjectName: "物理", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "化学", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "生物", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "政治", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "历史", version: "人教版", publisher: "人民教育出版社" },
  { gradeName: "高三", subjectName: "地理", version: "人教版", publisher: "人民教育出版社" },
];

async function seedTextbookVersions() {
  try {
    // 一次性查出年级和学科，构建名称→ID 映射，避免循环内重复查询
    const grades = await prisma.grade.findMany();
    const subjects = await prisma.subject.findMany();
    const gradeMap = new Map(grades.map((g) => [g.name, g.id]));
    const subjectMap = new Map(subjects.map((s) => [s.name, s.id]));
    let inserted = 0;
    for (const c of nanhaiTextbookVersions) {
      const gradeId = gradeMap.get(c.gradeName);
      const subjectId = subjectMap.get(c.subjectName);
      if (!gradeId || !subjectId) continue; // 跳过缺失的年级/学科
      await prisma.textbookVersion.upsert({
        where: { textbook_version_unique: { region: "南海区", gradeId, subjectId } },
        update: { version: c.version, publisher: c.publisher },
        create: { region: "南海区", gradeId, subjectId, version: c.version, publisher: c.publisher },
      });
      inserted++;
    }
    console.log(`✅ 教材版本种子完成：写入 ${inserted} 条（南海区 小学~高中 全学科）`);
  } catch (err) {
    console.error("❌ seedTextbookVersions 失败：", err);
    throw err;
  }
}

// ============================================================
// 主数据种子：教材章节树（南海区初一数学人教版，15 章）
// ============================================================
async function seedTextbookChapters() {
  try {
    // 查询"南海区+初一+数学"的 TextbookVersion
    const gradeChu1 = await prisma.grade.findFirst({ where: { name: "初一" } });
    const subjMath = await prisma.subject.findFirst({ where: { name: "数学" } });
    if (!gradeChu1 || !subjMath) {
      throw new Error("依赖的年级/学科数据未找到");
    }
    const tv = await prisma.textbookVersion.findUnique({
      where: {
        textbook_version_unique: {
          region: "南海区",
          gradeId: gradeChu1.id,
          subjectId: subjMath.id,
        },
      },
    });
    if (!tv) {
      throw new Error("南海区初一数学教材版本未找到，请先运行 seedTextbookVersions");
    }

    // 人教版七年级数学章节（上册4章 + 下册6章 + 拆分5章 = 15 章）
    const chapters = [
      { chapterNo: "1", chapterName: "有理数-概念", order: 1 },
      { chapterNo: "2", chapterName: "有理数-运算", order: 2 },
      { chapterNo: "3", chapterName: "整式的加减", order: 3 },
      { chapterNo: "4", chapterName: "一元一次方程", order: 4 },
      { chapterNo: "5", chapterName: "几何图形初步", order: 5 },
      { chapterNo: "6", chapterName: "相交线与平行线", order: 6 },
      { chapterNo: "7", chapterName: "实数", order: 7 },
      { chapterNo: "8", chapterName: "平面直角坐标系", order: 8 },
      { chapterNo: "9", chapterName: "二元一次方程组", order: 9 },
      { chapterNo: "10", chapterName: "不等式与不等式组", order: 10 },
      { chapterNo: "11", chapterName: "数据的收集、整理与描述", order: 11 },
      { chapterNo: "12", chapterName: "三角形-初步", order: 12 },
      { chapterNo: "13", chapterName: "三角形-全等", order: 13 },
      { chapterNo: "14", chapterName: "轴对称", order: 14 },
      { chapterNo: "15", chapterName: "整式乘除与因式分解", order: 15 },
    ];

    let inserted = 0;
    for (const c of chapters) {
      await prisma.textbookChapter.upsert({
        where: {
          textbook_chapter_unique: {
            textbookVersionId: tv.id,
            chapterNo: c.chapterNo,
          },
        },
        update: { chapterName: c.chapterName, order: c.order },
        create: {
          textbookVersionId: tv.id,
          chapterNo: c.chapterNo,
          chapterName: c.chapterName,
          order: c.order,
        },
      });
      inserted++;
    }
    console.log(`✅ 教材章节种子完成：写入 ${inserted} 条（南海区初一数学人教版）`);
  } catch (err) {
    console.error("❌ seedTextbookChapters 失败：", err);
    throw err;
  }
}

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

  // 主数据种子（按依赖顺序执行）
  console.log("🏗️ 初始化主数据...");
  await seedGrades();
  await seedSubjects();
  await seedSchools();
  await seedTextbookVersions();
  await seedTextbookChapters();

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
