require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../resource');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置Multer磁盘存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 使用UUID和截断的文件名避免过长
    const uniqueId = uuidv4().slice(0, 8);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const shortName = baseName.length > 20 ? baseName.slice(0, 20) : baseName;
    const fileName = `${shortName}-${uniqueId}${ext}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });
const app = express();
const PORT = process.env.PORT || 5001;

// 中间件 - CORS必须放在所有路由之前
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 文件上传接口 - 放在bodyParser之前
app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const userId = req.body.userId;
  const resourceType = req.body.resourceType;
  const authorizationStatus = req.body.authorizationStatus || '未授权';

  if (!file) {
    return res.status(400).json({ message: '请选择文件' });
  }

  const insertQuery = `
    INSERT INTO resources (filename, file_type, file_path, user_id, resource_type, authorization_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(insertQuery, [file.originalname, file.mimetype, file.path, userId, resourceType, authorizationStatus], function(err) {
    if (err) {
      console.error('Error inserting resource:', err);
      return res.status(500).json({ message: '保存资源失败' });
    }
    res.json({ message: '文件上传成功', resourceId: this.lastID });
  });
});

// 其他中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 注册接口
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  // 简单验证
  if (!username || !email || !password) {
    return res.status(400).json({ message: '所有字段都是必填的' });
  }

  // 检查用户名是否已存在
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误', error: err.message });
    }

    if (row) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误', error: err.message });
      }

      if (row) {
        return res.status(400).json({ message: '邮箱已被注册' });
      }

      // 插入新用户
      const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.run(sql, [username, email, password], function(err) {
        if (err) {
          return res.status(500).json({ message: '注册失败', error: err.message });
        }

        res.status(201).json({
          message: '注册成功',
          userId: this.lastID
        });
      });
    });
  });
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 简单验证
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码都是必填的' });
  }

  // 查询用户
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误', error: err.message });
    }

    if (!row) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }

    // 验证密码（实际应用中应该使用密码哈希比较）
    if (row.password !== password) {
      return res.status(401).json({ message: '用户名或密码不正确' });
    }

    res.json({
      message: '登录成功',
      user: {
        id: row.id,
        username: row.username,
        email: row.email
      }
    });
  });
});

// 获取资源类型汇总统计接口
app.get('/api/resources/summary', (req, res) => {
  const userInfo = req.query.userInfo ? JSON.parse(req.query.userInfo) : null;
  if (!userInfo || !userInfo.id) {
    return res.status(401).json({ message: '用户未登录' });
  }

  const query = `
    SELECT resource_type, COALESCE(authorization_status, '未授权') as authorization_status, COUNT(*) as count
    FROM resources
    GROUP BY resource_type, COALESCE(authorization_status, '未授权')
    ORDER BY count DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取资源统计失败:', err);
      return res.status(500).json({ message: '获取资源统计失败' });
    }
    res.json(rows);
  });
});

// 获取资源列表接口
app.get('/api/resources', (req, res) => {
  const userInfo = req.query.userInfo ? JSON.parse(req.query.userInfo) : null;
  if (!userInfo || !userInfo.id) {
    return res.status(401).json({ message: '用户未登录' });
  }

  db.all('SELECT id, resource_type, filename, file_type, uploaded_at, authorization_status FROM resources ORDER BY uploaded_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '获取资源失败', error: err.message });
    }
    res.json(rows);
  });
});

app.get('/api/resources/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    db.get('SELECT file_path FROM resources WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      // 确保路径正确解析
      const filePath = path.resolve(row.file_path);
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          return res.status(500).json({ error: 'File read error', details: err.message });
        }
        res.json({ content: data });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// 添加资源删除接口
app.delete('/api/resources/:id', (req, res) => {
  const { id } = req.params;
  
  // 先查询文件路径
  db.get('SELECT file_path FROM resources WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误', error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '资源不存在' });
    }
    
    // 删除文件
    fs.unlink(row.file_path, (err) => {
      if (err) {
        console.error('删除文件失败:', err);
        // 文件删除失败仍尝试删除数据库记录
      }
      
      // 删除数据库记录
      db.run('DELETE FROM resources WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ message: '删除资源失败', error: err.message });
        }
        res.json({ message: '资源删除成功' });
      });
    });
  });
});

// 压缩包上传接口
app.post('/api/upload-zip', upload.single('zipFile'), async (req, res) => {
  const file = req.file;
  const userId = req.body.userId;

  if (!file) {
    return res.status(400).json({ message: '请选择压缩包文件' });
  }

  if (!userId) {
    return res.status(400).json({ message: '用户ID不能为空' });
  }

  // 创建任务记录
  const insertTaskQuery = `
    INSERT INTO tasks (user_id, status, progress, total_files, completed_files)
    VALUES (?, 'processing', 0, 0, 0)
  `;

  db.run(insertTaskQuery, [userId], function(err) {
    if (err) {
      console.error('创建任务失败:', err);
      return res.status(500).json({ message: '创建检测任务失败' });
    }
    const taskId = this.lastID;

    // 解压文件
    try {
      const zip = new AdmZip(file.path);
      const zipEntries = zip.getEntries();
      // 过滤出文件条目，排除文件夹
      const fileEntries = zipEntries.filter(entry => !entry.isDirectory);
      const totalFiles = fileEntries.length;
      let completedFiles = 0;

      // 更新任务总文件数
      db.run('UPDATE tasks SET total_files = ? WHERE id = ?', [totalFiles, taskId]);

      // 创建临时目录
      const tempDir = path.join(__dirname, `../../temp/${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // 解压文件
      zip.extractAllTo(tempDir, true);

      // 异步处理所有文件
      async function processFiles(dir) {
        const files = fs.readdirSync(dir);
        const promises = [];

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            // 递归处理子目录
            await processFiles(filePath);
          } else {
            // 为每个文件创建处理Promise
            promises.push(new Promise(async (resolve) => {
              try {
                // 执行diff命令，这里假设与空文件比较，实际应用需修改比较源
                const { stdout, stderr } = await execAsync(`diff /dev/null "${filePath}"`);
                console.log(`===== Diff result for ${filePath} =====`);
                console.log(stdout);
                if (stderr) {
                  console.error(`Diff error for ${filePath}:`, stderr);
                }
              } catch (error) {
                console.error(`Error executing diff for ${filePath}:`, error.message);
              } finally {
                // 更新任务状态（原子操作）
                db.run(
                  `UPDATE tasks 
                   SET completed_files = completed_files + 1,
                       progress = (completed_files + 1) * 100 / total_files,
                       status = CASE WHEN (completed_files + 1) >= total_files THEN 'completed' ELSE 'processing' END,
                       updated_at = CURRENT_TIMESTAMP 
                   WHERE id = ?`,
                  [taskId],
                  (err) => {
                    if (err) {
                      console.error('更新任务进度失败:', err);
                      return;
                    }
                    
                    // 检查是否所有文件都已处理完成
                    db.get('SELECT status FROM tasks WHERE id = ?', [taskId], (err, row) => {
                      if (err) {
                        console.error('查询任务状态失败:', err);
                        return;
                      }
                      if (row && row.status === 'completed' && fs.existsSync(tempDir)) {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                        console.log(`任务${taskId}处理完成，临时目录已清理`);
                      }
                    });
                  }
                );
                resolve();
              }
            }));
          }
        }

        // 等待当前目录所有文件处理完成
        await Promise.all(promises);
      }

      // 开始处理文件（不阻塞响应）
      processFiles(tempDir).catch(err => {
        console.error('文件处理出错:', err);
        db.run('UPDATE tasks SET status = ? WHERE id = ?', ['failed', taskId]);
        // 清理临时目录
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log(`任务${taskId}处理失败，临时目录已清理`);
        }
      });

      res.json({ message: '压缩包上传成功，开始异步检测', taskId });
    } catch (error) {
      console.error('压缩包处理失败:', error);
      db.run('UPDATE tasks SET status = ? WHERE id = ?', ['failed', taskId]);
      res.status(500).json({ message: '压缩包处理失败' });
    }
  });
});

// 任务进度查询接口
app.get('/api/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;

  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误', error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '任务不存在' });
    }
    res.json(row);
  });
});

// 获取用户所有任务接口
app.get('/api/users/:userId/tasks', (req, res) => {
  const { userId } = req.params;

  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误', error: err.message });
    }
    res.json(rows);
  });
})

// 其他中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});