/**
 * 分析与统计功能库
 * 支持多层级数据分析（学校、年段、班级）
 * 按原代码逻辑：各项 = 百分制分数 / 100 * 权重
 */

import { StudentRecord, calculateStatistics, StatisticsResult, SCORING, findScore } from "./scoring";

export interface AnalysisResult {
  level: "school" | "year" | "class" | "individual";
  keyword?: string;
  stats: StatisticsResult | null;
  maleStats?: StatisticsResult | null;
  femaleStats?: StatisticsResult | null;
  projectStats?: ProjectStats;
  singleItemStats?: SingleItemStats;
}

export interface ProjectStats {
  longrun: { count: number; avg: string };
  ball: { count: number; avg: string };
  select: { count: number; avg: string };
}

export interface SingleItemStats {
  [key: string]: { count: number; avg: string };
}

/**
 * 执行分析
 */
export function performAnalysis(
  students: StudentRecord[],
  level: "school" | "year" | "class" | "individual",
  keyword?: string,
  showGenderCompare: boolean = false
): AnalysisResult {
  let filtered = students;

  // 按级别筛选
  if (level === "year" && keyword) {
    filtered = students.filter((s) => s.grade?.toLowerCase() === keyword.toLowerCase());
  } else if (level === "class" && keyword) {
    filtered = students.filter((s) => s.class?.toLowerCase() === keyword.toLowerCase());
  }

  // 计算统计数据
  const stats = calculateStatistics(filtered);
  let maleStats: StatisticsResult | null = null;
  let femaleStats: StatisticsResult | null = null;

  if (showGenderCompare) {
    maleStats = calculateStatistics(filtered.filter((s) => s.gender === "男"));
    femaleStats = calculateStatistics(filtered.filter((s) => s.gender === "女"));
  }

  // 计算项目统计（按40分制）
  const projectStats = calculateProjectStats(filtered);

  // 计算单项统计（按40分制）
  const singleItemStats = calculateSingleItemStats(filtered);

  return {
    level,
    keyword,
    stats,
    maleStats,
    femaleStats,
    projectStats,
    singleItemStats
  };
}

/**
 * 计算三大项的40分制平均成绩
 */
function calculateProjectStats(students: StudentRecord[]): ProjectStats {
  // 长跑/游泳（15分权重）
  const longrunStats = calculateProjectItem(
    students,
    ["longrun"],
    "长跑",
    15
  );

  // 球类（9分权重）
  const ballStats = calculateProjectItem(
    students,
    ["football", "basketball", "volleyball"],
    "球类",
    9
  );

  // 选考（8分权重，但这里显示总的选考得分）
  const selectStats = {
    count: students.filter((s) => parseFloat(s.selectContrib || "0") > 0).length,
    avg: (
      students.map((s) => parseFloat(s.selectContrib || "0") || 0).reduce((a, b) => a + b, 0) /
      students.length
    ).toFixed(2)
  };

  return {
    longrun: longrunStats,
    ball: ballStats,
    select: selectStats
  };
}

/**
 * 计算单个项目的40分制平均成绩
 */
function calculateProjectItem(
  students: StudentRecord[],
  fields: (keyof StudentRecord)[],
  projectName: string,
  weight: number
): { count: number; avg: string } {
  const valid = students.filter((s) => fields.some((f) => (s as any)[f] && (s as any)[f] > 0));

  if (valid.length === 0) {
    return { count: 0, avg: "0.00" };
  }

  const scores = valid.map((s) => {
    for (const field of fields) {
      const val = (s as any)[field];
      if (val && val > 0) {
        let project = "";
        let smaller = true;

        if (field === "longrun") {
          project = s.gender === "男" ? "1000米跑" : "800米跑";
          smaller = true;
        } else if (field === "football") {
          project = "足球运球";
          smaller = true;
        } else if (field === "basketball") {
          project = "篮球运球";
          smaller = true;
        } else if (field === "volleyball") {
          project = "排球40秒对墙垫球";
          smaller = false;
        }

        if (project) {
          const table = SCORING[project]?.[s.gender];
          if (table) {
            const score100 = findScore(table, val, smaller);
            return (score100 / 100) * weight;
          }
        }
        break;
      }
    }
    return 0;
  });

  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { count: valid.length, avg: avg.toFixed(2) };
}

/**
 * 计算单项运动的40分制平均成绩
 */
function calculateSingleItemStats(students: StudentRecord[]): SingleItemStats {
  const stats: SingleItemStats = {};

  // 长跑（15分权重）
  const longrunStudents = students.filter((s) => s.longrun && s.longrun > 0);
  if (longrunStudents.length > 0) {
    const arr = longrunStudents.map((s) => {
      const project = s.gender === "男" ? "1000米跑" : "800米跑";
      const score100 = findScore(SCORING[project][s.gender], s.longrun!, true);
      return (score100 / 100) * 15;
    });
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    stats["长跑"] = { count: longrunStudents.length, avg: avg.toFixed(2) };
  }

  // 游泳（15分权重）
  const swimStudents = students.filter((s) => s.swim && s.swim > 0);
  if (swimStudents.length > 0) {
    const arr = swimStudents.map((s) => {
      const score100 = findScore(SCORING["游泳"][s.gender], s.swim!, true);
      return (score100 / 100) * 15;
    });
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    stats["游泳"] = { count: swimStudents.length, avg: avg.toFixed(2) };
  }

  // 足球（9分权重）
  const footballStudents = students.filter((s) => s.football && s.football > 0);
  if (footballStudents.length > 0) {
    const arr = footballStudents.map((s) => {
      const score100 = findScore(SCORING["足球运球"][s.gender], s.football!, true);
      return (score100 / 100) * 9;
    });
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    stats["足球"] = { count: footballStudents.length, avg: avg.toFixed(2) };
  }

  // 篮球（9分权重）
  const basketballStudents = students.filter((s) => s.basketball && s.basketball > 0);
  if (basketballStudents.length > 0) {
    const arr = basketballStudents.map((s) => {
      const score100 = findScore(SCORING["篮球运球"][s.gender], s.basketball!, true);
      return (score100 / 100) * 9;
    });
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    stats["篮球"] = { count: basketballStudents.length, avg: avg.toFixed(2) };
  }

  // 排球（9分权重）
  const volleyballStudents = students.filter((s) => s.volleyball && s.volleyball > 0);
  if (volleyballStudents.length > 0) {
    const arr = volleyballStudents.map((s) => {
      const score100 = findScore(SCORING["排球40秒对墙垫球"][s.gender], s.volleyball!, false);
      return (score100 / 100) * 9;
    });
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    stats["排球"] = { count: volleyballStudents.length, avg: avg.toFixed(2) };
  }

  // 选考项目（8分权重）
  stats["50米跑"] = calculateSelectItem(students, "run50", "50米跑", 8, true);
  stats["仰卧起坐"] = calculateSelectItem(students, "situp", "一分钟仰卧起坐", 8, false);
  stats["实心球"] = calculateSelectItem(students, "ball", "掷实心球", 8, false);
  stats["跳绳"] = calculateSelectItem(students, "rope", "1分钟跳绳", 8, false);
  stats["引体类"] = calculateSelectItem(students, "pullup", "引体向上", 8, false);
  stats["立定跳远"] = calculateSelectItem(students, "jump", "立定跳远", 8, false);

  return stats;
}

/**
 * 计算选考项目的40分制平均成绩
 */
function calculateSelectItem(
  students: StudentRecord[],
  field: keyof StudentRecord,
  project: string,
  weight: number,
  smaller: boolean
): { count: number; avg: string } {
  const valid = students.filter((s) => (s as any)[field] && (s as any)[field] > 0);

  if (valid.length === 0) {
    return { count: 0, avg: "0.00" };
  }

  const arr = valid.map((s) => {
    const val = (s as any)[field] || 0;
    const table = SCORING[project]?.[s.gender];
    if (!table) return 0;
    const score100 = findScore(table, val, smaller);
    return (score100 / 100) * weight;
  });

  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return { count: valid.length, avg: avg.toFixed(2) };
}

/**
 * 获取所有唯一的年段
 */
export function getUniqueGrades(students: StudentRecord[]): string[] {
  const grades = new Set(students.map((s) => s.grade).filter((g): g is string => Boolean(g)));
  return Array.from(grades).sort();
}

/**
 * 获取所有唯一的班级
 */
export function getUniqueClasses(students: StudentRecord[]): string[] {
  const classes = new Set(students.map((s) => s.class).filter((c): c is string => Boolean(c)));
  return Array.from(classes).sort();
}

/**
 * 获取所有唯一的学校
 */
export function getUniqueSchools(students: StudentRecord[]): string[] {
  const schools = new Set(students.map((s) => s.school).filter((s): s is string => Boolean(s)));
  return Array.from(schools).sort();
}
