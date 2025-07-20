const { saveResourceWithVector } = require('./db');
const { getImageVector } = require('./imageVector');

// 测试保存资产和向量
async function testSaveResourceWithVector() {
  try {
    // 准备测试数据
    const resource = {
      filename: 'test_image.jpg',
      file_type: 'image/jpeg',
      file_path: '/path/to/test_image.jpg',
      user_id: 1,
      resource_type: '图片',
      asset_name: '测试图片',
      asset_no: 'TEST001',
      project: '测试项目',
      asset_level: '普通',
      creation_date: '2023-10-25',
      declarant: '测试人员',
      creation_type: '原创',
      creator: '测试作者',
      trademark_reg_no: 'TM123456',
      certificate_no: 'Cert123456',
      certificate_platform: '测试平台',
      certificate_timestamp: '2023-10-25 10:00:00',
      file_hash: 'abc123def456',
      verify_url: 'https://test.com/verify'
    };

    // 获取图片向量
    console.log('正在获取图片向量...');
    // 注意：这里使用的是示例图片路径，实际测试时需要替换为真实存在的图片
    const vector = await getImageVector('/Users/yangyemeng/Desktop/ips/public/code.png');
    console.log('成功获取图片向量，长度:', vector.length);
    console.log('向量前5个元素:', vector.slice(0, 5));

    // 保存资产和向量
    console.log('正在保存资产和向量...');
    const result = await saveResourceWithVector(resource, vector);
    console.log('保存成功，资产ID:', result.id);

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testSaveResourceWithVector();