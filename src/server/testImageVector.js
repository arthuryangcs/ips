// 测试获取图片向量的功能
const { getImageVector } = require('./imageVector');

// 测试函数
function testImageVector() {
  // 使用真实的图片路径
  const imagePath = 'public/code.png';
  
  console.log(`开始获取图片 ${imagePath} 的向量...`);
  const vector = getImageVector(imagePath);
  
  if (vector.length > 0) {
    console.log(`成功获取图片向量，长度: ${vector.length}`);
    console.log(`向量前5个元素: ${vector.slice(0, 5).join(', ')}...`);
  } else {
    console.log('获取图片向量失败');
  }
}

// 运行测试
testImageVector();