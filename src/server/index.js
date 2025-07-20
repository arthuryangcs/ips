require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const compareImages = require('./imageComparison');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const util = require('util');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const cheerio = require('cheerio');
const pdf = require('html-pdf');
const axios = require('axios');

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
const PORT = process.env.PORT || 4000;

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
      return res.status(500).json({ message: '保存资产失败' });
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

// 获取资产类型汇总统计接口
app.get('/api/resources/summary', (req, res) => {
  // 不需要登录
  // const userInfo = req.query.userInfo ? JSON.parse(req.query.userInfo) : null;
  // if (!userInfo || !userInfo.id) {
  //   return res.status(401).json({ message: '用户未登录' });
  // }

  const query = `
    SELECT resource_type, COALESCE(authorization_status, '未授权') as authorization_status, COUNT(*) as count
    FROM resources
    GROUP BY resource_type, COALESCE(authorization_status, '未授权')
    ORDER BY count DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('获取资产统计失败:', err);
      return res.status(500).json({ message: '获取资产统计失败' });
    }
    res.json(rows);
  });
});

// 获取资产列表接口
app.get('/api/resources', async (req, res) => {
  try {
    const { userInfo, searchKeyword, filters } = req.query;
    const parsedUserInfo = JSON.parse(userInfo);
    const parsedFilters = filters ? JSON.parse(filters) : {};

    let query = 'SELECT * FROM resources WHERE user_id = ?';
    const params = [parsedUserInfo.id];
    let conditionIndex = 1;

    // 搜索关键词筛选
    if (searchKeyword) {
      query += ` AND (asset_name LIKE ? OR asset_no LIKE ?)`;
      params.push(`%${searchKeyword}%`, `%${searchKeyword}%`);
    }

    // 项目筛选
    if (parsedFilters.project) {
      query += ` AND project = ?`;
      params.push(parsedFilters.project);
    }

    // 类型筛选
    if (parsedFilters.type) {
      query += ` AND resource_type = ?`;
      params.push(parsedFilters.type);
    }

    // 资产级别筛选
    if (parsedFilters.assetLevel) {
      query += ` AND asset_level = ?`;
      params.push(parsedFilters.assetLevel);
    }

    // 状态筛选
    // if (parsedFilters.status) {
    //   query += ` AND status = ?`;
    //   params.push(parsedFilters.status);
    // }

    // 申报时间筛选
    // if (parsedFilters.declarationDate && parsedFilters.declarationDate[0] && parsedFilters.declarationDate[1]) {
    //   query += ` AND creation_date BETWEEN ? AND ?`;
    //   params.push(parsedFilters.declarationDate[0], parsedFilters.declarationDate[1]);
    // }

    query += ' order by id desc'

    // 使用promisify转换db.all为Promise接口
    const dbAll = util.promisify(db.all).bind(db);
    const rows = await dbAll(query, params);
    res.json(rows);
  } catch (error) {
    console.error('获取资源失败:', error);
    res.status(500).json({ message: '获取资源失败' });
  }
});

// 获取资源文件内容接口
app.get('/api/resources/:id/content', async (req, res) => {
  const { id } = req.params;
  try {
    // 查询文件路径
    const asset = await new Promise((resolve, reject) => {
      db.get('SELECT file_path, filename, file_type FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!asset) {
      return res.status(404).json({ message: '文件不存在' });
    }

    const filePath = asset.file_path;
    const fileName = asset.filename;
    const fileType = asset.file_type;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在于服务器' });
    }

    // 设置响应头
    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    // 读取文件并返回
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('获取文件内容失败:', error);
    res.status(500).json({ message: '获取文件内容失败' });
  }
});

// 资源存证接口
app.post('/api/resources/:id/certify', (req, res) => {
  const { id } = req.params;
  
  // 生成存证编号
  const certificateNo = 'CERT-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const notarizationTime = new Date().toISOString();
  
  // 更新资源信息
  const updateQuery = `
    UPDATE resources
    SET certificate_no = ?,
        certificate_timestamp = ?,
        certificate_platform = '蚂蚁链司法凭证'
    WHERE id = ?
  `;
  
  db.run(updateQuery, [certificateNo, notarizationTime, id], function(err) {
    if (err) {
      console.error('资源存证失败:', err);
      return res.status(500).json({ success: false, message: '资源存证失败' });
    }
    
    // 查询更新后的资源信息
    db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('查询资源失败:', err);
        return res.status(500).json({ success: false, message: '查询资源失败' });
      }
      
      if (!row) {
        return res.status(404).json({ success: false, message: '资源不存在' });
      }
      
      res.json({ success: true, message: '资源存证成功', asset: row });
    });
  });
});

// 添加资产删除接口
app.delete('/api/resources/:id', (req, res) => {
  const { id } = req.params;
  
  // 先查询文件路径
  db.get('SELECT file_path FROM resources WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误', error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: '资产不存在' });
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
          return res.status(500).json({ message: '删除资产失败', error: err.message });
        }
        res.json({ message: '资产删除成功' });
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

// 新增资产接口 - 支持多文件上传
app.post('/api/assets/create', upload.array('files', 10), (req, res) => {  // 最多上传10个文件
  const files = req.files;
  const userId = req.body.userId;
  const assetInfo = JSON.parse(req.body.assetInfo || '{}');
  const trademarkRegNo = req.body.trademarkRegNo;

  // 验证必填字段
  if (!assetInfo.assetName || !assetInfo.assetNo || !assetInfo.project) {
    return res.status(400).json({ message: '资产名称、编号和项目为必填项' });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ message: '请选择至少一个文件' });
  }

  if (!userId) {
    return res.status(400).json({ message: '用户ID不能为空' });
  }

  // 生成存证信息
  const certificateNo = `IPS-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  // 随机生成32位文件哈希
  const fileHash = crypto.randomBytes(16).toString('hex');
  const certificateTimestamp = new Date().toISOString();
  const certificatePlatform = 'IPS-存证平台';
  const verifyUrl = `http://localhost:4000/verify/${certificateNo}`;

  // 准备批量插入数据
  const insertPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO resources (
          filename, file_type, file_path, user_id, resource_type, authorization_status,
          asset_name, asset_no, project, asset_level, creation_date, declarant,
          creation_type, creator, trademark_reg_no, certificate_no, certificate_platform,
          certificate_timestamp, file_hash, verify_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        file.originalname,
        file.mimetype,
        file.path,
        userId,
        assetInfo.resourceType || '',
        assetInfo.authorizationStatus || '未授权',
        assetInfo.assetName || '',
        assetInfo.assetNo || '',
        assetInfo.project || '',
        assetInfo.assetLevel || '',
        assetInfo.creationDate || '',
        assetInfo.declarant || '',
        assetInfo.creationType || '',
        assetInfo.creator || '',
        trademarkRegNo || '',
        '',
        '',
        '',
        // certificateNo,
        // certificatePlatform,
        // certificateTimestamp,
        fileHash,
        verifyUrl,
      ];

      db.run(insertQuery, values, function(err) {
        if (err) {
          console.error('Error inserting resource:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  });

  // 执行批量插入
  Promise.all(insertPromises)
    .then(resourceIds => {
      res.json({
        message: '资产新增成功',
        resourceIds: resourceIds,
        certificate: {
          certificateNo: certificateNo,
          platform: certificatePlatform,
          timestamp: certificateTimestamp,
          fileHash: fileHash,
          verifyUrl: verifyUrl
        }
      });
    })
    .catch(err => {
      console.error('批量插入失败:', err);
      res.status(500).json({ message: '保存资产失败', error: err.message });
    });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 获取资产详情接口
app.get('/api/resources/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 查询资产基本信息
    const asset = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!asset) {
      return res.status(404).json({ message: '资产不存在' });
    }

    // 查询版本历史
    const versions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM resources WHERE asset_name = ? ORDER BY id DESC', [asset.asset_name], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 检查是否为图片文件
    const isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(asset.filename);

    // 构建响应数据
    const assetDetail = {
      id: asset.id,
      asset_name: asset.asset_name,
      asset_no: asset.asset_no,
      resource_type: asset.resource_type,
      asset_level: asset.asset_level,
      project: asset.project,
      status: asset.authorization_status,
      in_use: asset.in_use === 1,
      external_authorization: asset.external_authorization === 1,
      creator: asset.creator,
      completion_date: asset.creation_date,
      rights_ownership: asset.rights_ownership || '公司自有',
      declarant: asset.declarant,
      declaration_date: asset.declaration_date,
      reviewer: asset.reviewer || '系统自动审核',
      review_date: asset.review_date,
      filename: asset.filename,
      file_type: asset.file_type,
      file_url: `/api/resources/${id}/content`,
      is_image: isImage,
      certificate_no: asset.certificate_no,
      certificate_platform: asset.certificate_platform,
      certificate_timestamp: asset.certificate_timestamp,
      file_hash: asset.file_hash,
      versions: versions.map(version => ({
        id: version.id,
        asset_name: version.asset_name,
        asset_no: version.asset_no,
        certificate_no: version.certificate_no,
        certificate_platform: version.certificate_platform,
        certificate_timestamp: version.certificate_timestamp,
        resource_type: version.resource_type,
        asset_level: version.asset_level,
        project: version.project,
        status: version.authorization_status,
        in_use: version.in_use === 1,
        external_authorization: version.external_authorization === 1,
        creator: version.creator,
        completion_date: version.creation_date,
        rights_ownership: version.rights_ownership || '公司自有',
        declarant: version.declarant,
        declaration_date: version.declaration_date,
        reviewer: version.reviewer || '系统自动审核',
        review_date: version.review_date,
        filename: version.filename,
        file_type: version.file_type,
        file_url: `/api/resources/${version.id}/content`,
        is_image: isImage,
        file_hash: version.file_hash,
      })),
    };

    res.json(assetDetail);
  } catch (error) {
    console.error('获取资产详情失败:', error);
    res.status(500).json({ message: '获取资产详情失败' });
  }
});

// 资源文件下载接口
app.get('/api/resources/:id/download', async (req, res) => {
  const { id } = req.params;
  try {
    // 查询文件信息
    const asset = await new Promise((resolve, reject) => {
      db.get('SELECT file_path, filename, file_type FROM resources WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!asset) {
      return res.status(404).json({ message: '文件不存在' });
    }

    const filePath = asset.file_path;
    const fileName = asset.filename;
    const fileType = asset.file_type;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在于服务器' });
    }

    // 设置下载响应头
    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // 流式传输文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('文件下载失败:', error);
    res.status(500).json({ message: '文件下载失败' });
  }
});

async function downloadImage(url, outputPath) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`下载失败: ${url}`, error.message);
    throw error;
  }
}

// 外部侵权检测接口
app.post('/api/check-external-url', async (req, res) => {
  try {
    const { url } = req.body;

    // 1. 爬取外部URL内容
    const tmpPath = '/Users/yangyemeng/Desktop/ips/src/resource/aaa.jpg';
    await downloadImage(url, tmpPath);
    // const response = await axios.get(url);
    // const html = response.data;
    // const data = cheerio.load(html);
    // const textContent = data('body');
    // console.log(textContent)
    // const tmpPath = '/Users/yangyemeng/Desktop/ips/src/resource/aaa.jpg';
    // fs.writeFileSync(tmpPath, textContent);


    const query = 'SELECT * FROM resources where file_type like ?';
    const resources = await promisify(db.all).bind(db)(query, '%image%');

    const infringementEvidence = [];
    let maxSimilarity = 0;

    resources.forEach(resource => {
      // 简化的相似度计算，实际应用中可能需要使用更复杂的算法
      console.log(`resources: ${resource.file_path}`);
      const similarity = compareImages.compareImages('/root/test/ips/src/resource/'+resource.file_path.split('/').pop(), '/root/test/ips/src/resource/aaa.jpg');
      if (similarity > 50) {
        infringementEvidence.push({
          assetName: resource.asset_name,
          id: resource.id,
          file_type: resource.file_type,
          similarity
        });

        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    });


    infringementEvidence.sort((a, b) => b.similarity - a.similarity);

    // 3. 确定风险级别
    let riskLevel = '低';
    let recommendation = '未发现明显侵权风险。';

    if (maxSimilarity > 70) {
      riskLevel = '高';
      recommendation = '存在高度侵权风险。';
    } else if (maxSimilarity > 40) {
      riskLevel = '中';
      recommendation = '存在中度侵权风险。';
    }

    // 4. 保存检测结果
    const resultId = Date.now().toString();

    res.json({
      success: true,
      result: {
        id: resultId,
        url,
        riskLevel,
        infringementEvidence,
        recommendation
      }
    });
  } catch (error) {
    console.error('External infringement check error:', error);
    res.status(500).json({
      success: false,
      message: '检测失败: ' + error.message
    });
  }
});

// 生成PDF报告接口
app.post('/api/generate-report', async (req, res) => {
  try {
    const { resultId } = req.body;

    // 这里简化处理，实际应用中可能需要从数据库中获取检测结果
    // 为了演示，我们只是返回一个模拟的报告URL
    const reportUrl = `http://localhost:${PORT}/api/report/${resultId}`;

    res.json({
      success: true,
      reportUrl
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: '生成报告失败: ' + error.message
    });
  }
});

// 确保报告目录存在
const reportDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportDir)){
  fs.mkdirSync(reportDir);
}

app.get('/api/report/:id', (req, res) => {
  try {
    const { id } = req.params;
    // 模拟报告数据
    const reportData = {
      id: id,
      title: '侵权检测报告',
      date: new Date().toLocaleDateString(),
      content: '这是一份详细的侵权检测报告内容...'
    };

    // 构建HTML模板
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>侵权检测报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .report-content { margin-top: 20px; }
          .report-info { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>侵权检测报告</h1>
        <div class="report-info">
          <p>报告ID: ${reportData.id}</p>
          <p>生成日期: ${reportData.date}</p>
        </div>
        <div class="report-content">
          <p>${reportData.content}</p>
        </div>
      </body>
      </html>
    `;

    // 生成PDF文件路径
    const pdfPath = path.join(reportDir, `${id}.pdf`);

    // 生成PDF
    pdf.create(html).toFile(pdfPath, (err, result) => {
      if (err) {
        console.error('Generate PDF error:', err);
        res.status(500).send('生成PDF失败');
        return;
      }

      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.pdf"`);

      // 发送PDF文件
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).send('下载报告失败');
  }
});