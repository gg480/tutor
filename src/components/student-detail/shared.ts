// 学生详情页子组件共享类型与常量
// examType 为用户自定义文本（不再使用枚举），semester 区分上下学期

// 学期选项（上学期/下学期）
export const SEMESTER_OPTIONS: { value: string; label: string }[] = [
  { value: "first", label: "上学期" },
  { value: "second", label: "下学期" },
];

// 根据学期值获取中文标签
export function getSemesterLabel(semester: string): string {
  const found = SEMESTER_OPTIONS.find((o) => o.value === semester);
  return found ? found.label : semester;
}

// 常用考试类型建议项（用于 datalist 自由输入下拉提示）
export const EXAM_TYPE_SUGGESTIONS: string[] = [
  "周测",
  "测验",
  "月考",
  "期中",
  "期末",
  "模拟",
  "中考",
  "高考",
  "竞赛",
];

// 培训学科状态中文标签
export const TRAINING_STATUS_LABELS: Record<string, string> = {
  active: "在读",
  ended: "已结课",
};

// 成绩记录类型（与后端 mapScoreRecord 返回结构对齐）
export interface ScoreRecord {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string | null;
  score: number;
  fullScore: number;
  rank: string | null;
  semester: string; // first=上学期, second=下学期
  examType: string;
  examDate: string; // ISO 字符串
  examName: string;
  examRange: string | null;
  note: string | null;
}

// 培训学科记录类型（与后端 mapTrainingSubjectRecord 返回结构对齐）
export interface TrainingSubjectRecord {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string | null;
  isAtStudio: boolean;
  startDate: string; // ISO 字符串
  endDate: string | null;
  status: string;
}

// 学科类型（与 master-data/types.ts Subject 对齐）
export interface SubjectOption {
  id: string;
  name: string;
  category: string;
  examTypes: string;
  applicableLevels: string;
  isCompetition: boolean;
}

// 年级类型
export interface GradeOption {
  id: string;
  name: string;
  level: string;
  order: number;
  schoolTypes: string;
}

// 教材版本类型
export interface TextbookVersionOption {
  id: string;
  region: string;
  gradeId: string;
  subjectId: string;
  version: string;
  publisher: string | null;
}

// 章节树节点类型（与后端 ChapterNode 对齐）
export interface ChapterNode {
  id: string;
  textbookVersionId: string;
  chapterNo: string;
  chapterName: string;
  parentChapterId: string | null;
  order: number;
  children: ChapterNode[];
}

// 课程记录类型（用于培训日程展示，Course 表字段子集）
export interface CourseRecord {
  id: string;
  studentId: string;
  registrationId: string | null;
  subject: string;
  courseType: string;
  startTime: string; // ISO 字符串
  endTime: string;
  duration: number;
  location: string | null;
  status: string;
  teacherNotes: string | null;
}

// 默认地区（与 page.tsx 的 DEFAULT_REGION 保持一致）
export const DEFAULT_REGION = "南海区";

// shibu 主色值（用于 SVG 折线图，取自 tailwind.config.ts）
export const SHIBU_PRIMARY_COLOR = "#2C5385"; // shibu-500 主色
export const SHIBU_DARK_COLOR = "#23426a"; // shibu-600
export const GRAY_LINE_COLOR = "#9ca3af"; // 非培训学科灰色

// 表单通用样式（与 SchoolsTab.tsx 风格一致）
export const INPUT_CLASS =
  "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-shibu-500 focus:border-transparent outline-none";
export const LABEL_CLASS = "block text-sm font-medium text-gray-700 mb-1";
