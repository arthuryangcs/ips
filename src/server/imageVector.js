const { execSync } = require('child_process');
const path = require('path');

/**
 * 调用python脚本获取图片的向量
 * @param {string} file_path - 图片文件的路径
 * @returns {Array} 图片的向量
 */
function getImageVector(file_path) {
  try {
    // 确保文件路径是绝对路径
    const absolute_path = path.isAbsolute(file_path) ? file_path : path.resolve(file_path);
    
    // 构建python命令
    const command = `python src/server/a.py --file ${absolute_path}`;
    console.log(`执行命令: ${command}`);
    
    // 执行命令并获取输出
    const result = execSync(command).toString().trim();
    console.log(`命令执行结果: ${result}`);
    
    // 解析结果为数组
    return JSON.parse(result);
  } catch (error) {
    console.error(`执行命令出错: ${error.message}`);
    return [];
  }
}

// 导出函数
module.exports = { getImageVector };