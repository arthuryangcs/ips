// 测试图片对比功能
const { compareImages } = require('./imageComparison');

// 测试函数
function testCompareImages() {
  // 使用真实的图片路径
  const img1 = '/root/test/code.png';
  const img2 = '/root/test/code.png';
  
  console.log(`开始对比图片: ${img1} 和 ${img2}`);
  const result = compareImages(img1, img2);
  console.log(`对比结果: ${result}%`);
}

// 运行测试
testCompareImages();