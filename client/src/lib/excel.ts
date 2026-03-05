/**
 * Excel 文件处理工具
 * 支持导入 Excel/CSV 文件并解析为学生记录
 */

import { StudentRecord, calculateScores } from "./scoring";

/**
 * 解析 Excel 文件
 * @param file 上传的文件
 * @returns 解析后的学生记录数组
 */
export async function parseExcelFile(file: File): Promise<StudentRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        
        // 动态导入 xlsx 库
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];

        if (!json || json.length < 2) {
          reject(new Error("Excel 文件为空或格式不正确"));
          return;
        }

        const headers = json[0].map((h: any) => (h || "").toString().trim().toLowerCase());
        const rows = json.slice(1);

        const records: StudentRecord[] = [];

        rows.forEach((row: any) => {
          // 跳过空行
          if (row.every((cell: any) => !cell)) return;

          const record: StudentRecord = {
            name: "",
            gender: "男"
          };

          headers.forEach((h: string, i: number) => {
            const val = row[i] ? row[i].toString().trim() : "";

            if (h.includes("姓名") || h.includes("name")) record.name = val;
            if (h.includes("年段") || h.includes("年级")) record.grade = val;
            if (h.includes("班级") || h.includes("class")) record.class = val;
            if (h.includes("学校")) record.school = val;
            if (h.includes("性别") || h.includes("gender")) record.gender = val === "女" ? "女" : "男";

            // 长跑/游泳
            if (h.includes("长跑") || h.includes("1000米")) record.longrun = parseFloat(val) || 0;
            if (h.includes("800米")) record.longrun = parseFloat(val) || 0;
            if (h.includes("游泳")) record.swim = parseFloat(val) || 0;

            // 球类
            if (h.includes("足球")) record.football = parseFloat(val) || 0;
            if (h.includes("篮球")) record.basketball = parseFloat(val) || 0;
            if (h.includes("排球")) record.volleyball = parseFloat(val) || 0;

            // 选考项目
            if (h.includes("50米")) record.run50 = parseFloat(val) || 0;
            if (h.includes("仰卧起坐")) record.situp = parseFloat(val) || 0;
            if (h.includes("实心球")) record.ball = parseFloat(val) || 0;
            if (h.includes("跳绳")) record.rope = parseFloat(val) || 0;
            if (h.includes("引体") || h.includes("斜身")) record.pullup = parseFloat(val) || 0;
            if (h.includes("跳远")) record.jump = parseFloat(val) || 0;
          });

          if (record.name) {
            calculateScores(record);
            records.push(record);
          }
        });

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("文件读取失败"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 导出学生记录为 Excel 文件
 * @param records 学生记录数组
 * @param filename 文件名
 */
export async function exportToExcel(records: StudentRecord[], filename: string = "体教宝成绩报告.xlsx"): Promise<void> {
  const XLSX = await import("xlsx");

  const exportData = records.map((s) => {
    const proj1 = (s.selectedProjects?.[0] || {}) as { name?: string; contrib?: string };
    const proj2 = (s.selectedProjects?.[1] || {}) as { name?: string; contrib?: string };
    
    // 计算总得分
    const longScore = parseFloat(s.longContrib || "0");
    const ballScore = parseFloat(s.ballContrib || "0");
    const selectScore = parseFloat(s.selectContrib || "0");
    const totalScore = (longScore + ballScore + selectScore).toFixed(1);
    
    return {
      姓名: s.name || "",
      班级: s.class || "",
      学校: s.school || "",
      性别: s.gender || "",
      长跑游泳总分: s.longContrib || "",
      球类总分: s.ballContrib || "",
      选考总分: s.selectContrib || "",
      选考1项目: proj1.name || "",
      选考1得分: proj1.contrib || "",
      选考2项目: proj2.name || "",
      选考2得分: proj2.contrib || "",
      总得分: totalScore,
      状态: s.status || ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "成绩报告");

  XLSX.writeFile(wb, filename);
}
