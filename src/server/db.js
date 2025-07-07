const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.resolve(__dirname, 'ips.db');

// 初始化用户表
function initUserTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('创建用户表错误:', err.message);
    } else {
      console.log('用户表初始化成功');
    }
  });
}

// 初始化资源表
function initResourceTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER NOT NULL,
      resource_type TEXT NOT NULL,
      authorization_status TEXT DEFAULT '未授权',
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `;

  // 检查并添加authorization_status列
  function checkAndAddAuthorizationColumn() {
    db.get(
      "SELECT name FROM pragma_table_info('resources') WHERE name = 'authorization_status'",
      (err, row) => {
        if (err) {
          console.error('检查授权状态列错误:', err.message);
          return;
        }
        if (!row) {
          db.run(
            "ALTER TABLE resources ADD COLUMN authorization_status TEXT DEFAULT '未授权'",
            (alterErr) => {
              if (alterErr) {
                console.error('添加授权状态列错误:', alterErr.message);
              } else {
                console.log('成功添加authorization_status列');
              }
            }
          );
        }
      }
    );
  }

  checkAndAddAuthorizationColumn();
}

// 初始化任务表
function initTaskTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER NOT NULL DEFAULT 0,
      total_files INTEGER NOT NULL DEFAULT 0,
      completed_files INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('创建任务表错误:', err.message);
    } else {
      console.log('任务表初始化成功');
    }
  });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('成功连接到SQLite数据库');
    // 初始化用户表
    initUserTable();
    // 初始化资源表
    initResourceTable();
    // 初始化任务表
    initTaskTable();
  }
});

module.exports = db;