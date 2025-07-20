const { execSync } = require('child_process');

function escapeShellPath(path) {
  // 转义单引号并包裹在单引号中
  return `'${path.replace(/'/g, "'\\''")}'`;
}

/**
 * 对比两个图片文件的相似度
 * @param {string} img1 - 第一张图片的路径
 * @param {string} img2 - 第二张图片的路径
 * @returns {number} 相似度结果(0-100)
 */
function compareImages(img1, img2) {
  try {
    img1 = escapeShellPath(img1);
    img2 = escapeShellPath(img2);
    // 构建docker命令
    const command = `docker exec pic python3 /root/compare.py ${img1} ${img2}`;
    console.log(`执行命令: ${command}`);
    
    // 执行命令并获取输出
    const result = execSync(command).toString();
    console.log(`命令执行结果: ${result}`);
    
    // 提取三直方图算法相似度
    // const match = result.match(/三直方图算法相似度： \[?([0-9.]+)\[?/);
    // console.log(`match: ${match}`);
    // if (match && match[1]) {
    //   // 转换为数字并乘以100
    //   return parseFloat(match[1]) * 100;
    // }

    let similarity = 0;
    let count = 0;
    let match = result.match(/差值哈希算法相似度： \[?([0-9.]+)\[?/);
    console.log(`match: ${match}`);
    if (match && match[1]) {
      similarity += 100 - parseFloat(match[1]);
      count++;
    }
    match = result.match(/感知哈希算法相似度： \[?([0-9.]+)\[?/);
    console.log(`match: ${match}`);
    if (match && match[1]) {
      similarity += 100 - parseFloat(match[1]);
      count++;
    }
    console.log("similarity:", similarity);
    console.log("count:", count);
    if (count > 0) {
      console.log("value:", similarity / count);
      return similarity / count;
    } else {
      return -1;
    }
  } catch (error) {
    console.error(`执行命令出错: ${error.message}`);
    return -1; // 出错时返回 -1
  }
}

// 导出函数
module.exports = { compareImages };