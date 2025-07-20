const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { load } = require('sqlite-vss');

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

// 初始化资产表
function initResourceTable() {
  load(db);
  console.log('sqlite-vss扩展加载成功!');

  // 先检查是否有向量扩展
  // db.run("SELECT load_extension('vector0')", (err) => {
  //   if (err) {
  //     console.log('向量扩展可能未安装或加载失败:', err.message);
  //   } else {
  //     console.log('向量扩展加载成功');
  //   }
  // });

  // 创建新表
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
      vector VECTOR(2048),
      asset_name TEXT,
      asset_no TEXT,
      project TEXT,
      asset_level TEXT,
      creation_date TEXT,
      declarant TEXT,
      creation_type TEXT,
      creator TEXT,
      trademark_reg_no TEXT,
      certificate_no TEXT,
      certificate_platform TEXT,
      certificate_timestamp TEXT,
      file_hash TEXT,
      verify_url TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `;

  db.run(sql, (err) => {
    if (err) {
      console.error('创建资产表错误:', err.message);
    } else {
      console.log('资产表初始化成功');
    }
  });

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

  // 检查并添加新字段
  function checkAndAddNewColumns() {
    // 检查并添加基础信息字段
    const newColumns = [
      { name: 'asset_name', type: 'TEXT' },
      { name: 'asset_no', type: 'TEXT' },
      { name: 'project', type: 'TEXT' },
      { name: 'asset_level', type: 'TEXT' },
      { name: 'creation_date', type: 'TEXT' },
      { name: 'declarant', type: 'TEXT' },
      { name: 'creation_type', type: 'TEXT' },
      { name: 'creator', type: 'TEXT' },
      { name: 'trademark_reg_no', type: 'TEXT' },
      { name: 'certificate_no', type: 'TEXT' },
      { name: 'certificate_platform', type: 'TEXT' },
      { name: 'certificate_timestamp', type: 'TEXT' },
      { name: 'file_hash', type: 'TEXT' },
      { name: 'verify_url', type: 'TEXT' },
      { name: 'vector', type: 'VECTOR(2048)' }
    ];

    newColumns.forEach(column => {
      db.get(
        `SELECT name FROM pragma_table_info('resources') WHERE name = ?`,
        [column.name],
        (err, row) => {
          if (err) {
            console.error(`检查${column.name}列错误:`, err.message);
            return;
          }
          if (!row) {
            db.run(
              `ALTER TABLE resources ADD COLUMN ${column.name} ${column.type}`,
              (alterErr) => {
                if (alterErr) {
                  console.error(`添加${column.name}列错误:`, alterErr.message);
                } else {
                  console.log(`成功添加${column.name}列`);
                }
              }
            );
          }
        }
      );
    });
  }

  checkAndAddAuthorizationColumn();
  checkAndAddNewColumns();
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
    // 初始化资产表
    initResourceTable();
    // 初始化任务表
    initTaskTable();
  }
});

module.exports = db;