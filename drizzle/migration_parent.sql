-- 家长端功能迁移 SQL
-- 在服务器 MySQL 中执行：mysql -u root tijiaobao < migration_parent.sql

-- 1. users 表 role 字段增加 "parent" 枚举值
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'parent') NOT NULL DEFAULT 'user';

-- 2. 创建家长绑定表
CREATE TABLE IF NOT EXISTS parent_bindings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parentId INT NOT NULL COMMENT '家长 users.id',
  studentId INT NOT NULL COMMENT 'student_score_data.id',
  teacherId INT NOT NULL COMMENT '教师 users.id',
  shareCode VARCHAR(50) DEFAULT NULL COMMENT '通过哪个分享码绑定的',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_parent_id (parentId),
  INDEX idx_student_id (studentId),
  INDEX idx_teacher_id (teacherId),
  UNIQUE KEY uk_parent_student (parentId, studentId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家长绑定表 - 家长与学生的绑定关系';
