// 主数据管理后台共享类型定义

export interface School {
  id: string;
  name: string;
  district: string;
  town: string | null;
  level: string;
  isKey: boolean;
  keyLevel: string | null;
  address: string | null;
  source: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  name: string;
  level: string;
  order: number;
  schoolTypes: string;
}

export interface Subject {
  id: string;
  name: string;
  category: string;
  examTypes: string;
  applicableLevels: string;
  isCompetition: boolean;
}

export interface TextbookVersion {
  id: string;
  region: string;
  gradeId: string;
  subjectId: string;
  version: string;
  publisher: string | null;
  grade?: Grade;
  subject?: Subject;
}

export interface TextbookChapter {
  id: string;
  textbookVersionId: string;
  chapterNo: string;
  chapterName: string;
  parentChapterId: string | null;
  order: number;
  children: TextbookChapter[];
}

// 学校 level 选项
export const SCHOOL_LEVELS = [
  { value: "primary", label: "小学" },
  { value: "junior", label: "初中" },
  { value: "senior", label: "高中" },
  { value: "nine_year", label: "九年一贯制" },
];

// 学科 category 选项
export const SUBJECT_CATEGORIES = [
  { value: "basic", label: "基础学科" },
  { value: "competition", label: "竞赛学科" },
  { value: "qiangji", label: "强基学科" },
];

// 考试类型选项
export const EXAM_TYPES = [
  { value: "mid_term", label: "期中考" },
  { value: "weekly", label: "周测" },
  { value: "monthly", label: "月考" },
  { value: "final", label: "期末考" },
  { value: "quiz", label: "小测" },
  { value: "mock", label: "模考" },
  { value: "zhongkao", label: "中考" },
  { value: "gaokao", label: "高考" },
  { value: "competition", label: "竞赛" },
];

// 适用学段选项
export const APPLICABLE_LEVELS = [
  { value: "primary", label: "小学" },
  { value: "junior", label: "初中" },
  { value: "senior", label: "高中" },
];
