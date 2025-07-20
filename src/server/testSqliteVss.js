// 测试sqlite-vss是否安装成功
const sqlite3 = require('sqlite3').verbose();
// const { load } = require('sqlite-vss');

// 创建一个内存数据库
const db = new sqlite3.Database(':memory:');

// 尝试加载sqlite-vss扩展
try {
  // 注册sqlite-vss扩展
  // load(db);
  console.log('sqlite-vss扩展加载成功!');

  // 测试创建向量表
  db.run('CREATE TABLE IF NOT EXISTS vectors (id INTEGER PRIMARY KEY, vec VECTOR(3))', (err) => {
    if (err) {
      console.error('创建表失败:', err.message);
    } else {
      console.log('创建向量表成功!');

      // 插入向量数据
      db.run('INSERT INTO vectors (vec) VALUES (?)', [JSON.stringify([1, 2, 3, 4,3,34,343,34,34,34])], (err) => {
        if (err) {
          console.error('插入数据失败:', err.message);
        } else {
          console.log('插入向量数据成功!');

          // 查询数据
          db.all('SELECT * FROM vectors  limit 1', (err, rows) => {
            if (err) {
              console.error('查询数据失败:', err.message);
            } else {
              console.log('查询到的数据:', JSON.parse(rows[0].vec));
            }
            // 关闭数据库
            db.close();
          });
        }
      });
    }
  });
} catch (error) {
  console.error('加载sqlite-vss扩展失败:', error.message);
}