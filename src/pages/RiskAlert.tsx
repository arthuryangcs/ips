import React, { useState, useEffect } from 'react';
import { Image } from 'antd';
import { Layout, Card, Button, Space, Typography, Divider, Alert, Modal } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

// 模拟法规数据
const mockRegulations = [
  {
    id: 1,
    name: '《生成式AI内容管理办法》',
    status: '7月28日生效',
    details: '国家互联网信息办公室等七部门联合发布《生成式人工智能服务管理暂行办法》，自2025年7月28日起施行。办法要求生成式AI服务提供者应当对生成的内容进行标识，对AI生成的图片、视频等内容添加不可见水印。',
    department: '中华人民共和国商务部',
    publishTime: '2025年7月20日20:30',
    link: 'http://www.mofcom.gov.cn/article/b/fwzl/202507/20250703478956.shtml'
  },
  {
    id: 2,
    name: '《网络游戏管理暂行办法》',
    status: '8月3日发布',
    details: '文化和旅游部发布新修订的《网络游戏管理暂行办法》，加强对未成年人保护和游戏内容监管，要求所有网络游戏必须在显著位置标注适龄提示，严格控制游戏内消费。',
    department: '中华人民共和国文化和旅游部',
    publishTime: '2025年8月3日10:15',
    link: 'https://www.mct.gov.cn/xxgk/zyfb/wjzl/202508/t20250803_942828.html'
  },
  {
    id: 3,
    name: '《网络游戏知识产权保护白皮书》',
    status: '7月21日发布',
    details: '国家版权局发布《网络游戏知识产权保护白皮书》，明确游戏整体画面、角色形象、故事情节等元素的版权保护范围，加强对私服、外挂等侵权行为的打击力度。',
    department: '国家版权局',
    publishTime: '2025年7月21日15:40',
    link: 'http://www.ncac.gov.cn/chinacopyright/contents/12231/365472.html'
  }
];

// 模拟图表数据
const mockChartData = [
  {
    name: '游戏A',
    最高相似度: 95,
    平均相似度: 93.5,
    最低相似度: 92
  },
  {
    name: '游戏B',
    最高相似度: 87,
    平均相似度: 85,
    最低相似度: 83
  },
  {
    name: '游戏C',
    最高相似度: 76,
    平均相似度: 76,
    最低相似度: 76
  }
];

// 模拟版权监测数据
const mockCopyrightMonitoring = [
  {
    id: 1,
    content: '游戏角色设计A',
    type: '美术作品',
    similarity: 95,
    source: '某游戏论坛',
    discoveredTime: '2025年8月10日',
    status: '待处理',
    details: '发现某游戏论坛上发布的游戏角色设计与我司拥有版权的游戏角色设计A高度相似，相似度达95%。该内容发布于2025年8月5日，截至目前已有1000+浏览量。建议尽快采取维权措施。',
    url: 'https://example.com/forum/12345'
  },
  {
    id: 2,
    content: '游戏背景音乐B',
    type: '音乐作品',
    similarity: 87,
    source: '某视频平台',
    discoveredTime: '2025年8月9日',
    status: '处理中',
    details: '发现某视频平台上发布的视频使用了与我司拥有版权的游戏背景音乐B高度相似的音乐，相似度达87%。该视频发布于2025年8月2日，截至目前已有5000+播放量。目前已发送版权警告函，等待对方回应。',
    url: 'https://example.com/video/67890'
  },
  {
    id: 3,
    content: '游戏剧情C',
    type: '文字作品',
    similarity: 76,
    source: '某小说网站',
    discoveredTime: '2025年8月8日',
    status: '已解决',
    details: '发现某小说网站上发布的小说与我司拥有版权的游戏剧情C存在76%的相似度。该小说发布于2025年7月28日，截至目前已有2000+阅读量。经过沟通，对方已删除相关内容并公开道歉。',
    url: 'https://example.com/novel/abcde'
  }
];

// 模拟资产失效数据
const mockExpiringAssets = [
  {
    id: 1,
    name: '一种新的地图绘制技术',
    type: '发明专利',
    patentNumber: '148EY710949192',
    expiryDate: '2025年8月20日',
    renewalFee: '6000元人民币',
    details: '该发明专利涉及一种高精度地图绘制技术，能够提高地图的准确性和更新效率。专利有效期截止到2025年8月20日，需及时缴纳续期费用6000元人民币以维持专利权。',
    department: '国家知识产权局',
    issueDate: '2015年8月20日',
    certificateType: 'patent'
  },
  {
    id: 2,
    name: '游戏角色建模系统',
    type: '计算机软件著作权',
    patentNumber: '2020SR1234567',
    expiryDate: '2025年9月15日',
    renewalFee: '2000元人民币',
    details: '该软件著作权涉及一种高效的游戏角色建模系统，能够快速创建高质量的3D游戏角色。著作权有效期截止到2025年9月15日，需及时缴纳续期费用2000元人民币以维持权益。',
    department: '国家版权局',
    issueDate: '2020年9月15日',
    certificateType: 'copyright'
  },
  {
    id: 3,
    name: '智能语音识别方法',
    type: '发明专利',
    patentNumber: '156SD820738103',
    expiryDate: '2025年10月5日',
    renewalFee: '8000元人民币',
    details: '该发明专利涉及一种高效的智能语音识别方法，能够提高语音识别的准确率和速度。专利有效期截止到2025年10月5日，需及时缴纳续期费用8000元人民币以维持专利权。',
    department: '国家知识产权局',
    issueDate: '2015年10月5日',
    certificateType: 'patent'
  },
  {
    id: 4,
    name: '数据分析平台',
    type: '计算机软件著作权',
    patentNumber: '2021SR2345678',
    expiryDate: '2025年11月20日',
    renewalFee: '3000元人民币',
    details: '该软件著作权涉及一种高效的数据分析平台，能够快速处理和分析大量数据。著作权有效期截止到2025年11月20日，需及时缴纳续期费用3000元人民币以维持权益。',
    department: '国家版权局',
    issueDate: '2021年11月20日',
    certificateType: 'copyright'
  },
  {
    id: 5,
    name: '新型环保材料',
    type: '实用新型专利',
    patentNumber: '167DF930847114',
    expiryDate: '2025年12月10日',
    renewalFee: '5000元人民币',
    details: '该实用新型专利涉及一种新型环保材料，具有良好的环保性能和使用寿命。专利有效期截止到2025年12月10日，需及时缴纳续期费用5000元人民币以维持专利权。',
    department: '国家知识产权局',
    issueDate: '2015年12月10日',
    certificateType: 'patent'
  },
  {
    id: 6,
    name: '移动应用安全系统',
    type: '计算机软件著作权',
    patentNumber: '2022SR3456789',
    expiryDate: '2026年1月5日',
    renewalFee: '2500元人民币',
    details: '该软件著作权涉及一种移动应用安全系统，能够有效保护移动应用的安全性和用户数据的隐私。著作权有效期截止到2026年1月5日，需及时缴纳续期费用2500元人民币以维持权益。',
    department: '国家版权局',
    issueDate: '2022年1月5日',
    certificateType: 'copyright'
  },
  {
    id: 7,
    name: '智能家居控制系统',
    type: '发明专利',
    patentNumber: '178GH040956125',
    expiryDate: '2026年2月15日',
    renewalFee: '7000元人民币',
    details: '该发明专利涉及一种智能家居控制系统，能够实现家居设备的智能化控制和管理。专利有效期截止到2026年2月15日，需及时缴纳续期费用7000元人民币以维持专利权。',
    department: '国家知识产权局',
    issueDate: '2016年2月15日',
    certificateType: 'patent'
  },
  {
    id: 8,
    name: '虚拟现实开发工具',
    type: '计算机软件著作权',
    patentNumber: '2023SR4567890',
    expiryDate: '2026年3月20日',
    renewalFee: '3500元人民币',
    details: '该软件著作权涉及一种虚拟现实开发工具，能够帮助开发者快速创建虚拟现实内容。著作权有效期截止到2026年3月20日，需及时缴纳续期费用3500元人民币以维持权益。',
    department: '国家版权局',
    issueDate: '2023年3月20日',
    certificateType: 'copyright'
  }
];

const RiskAlert: React.FC = () => {
  const [regulations, setRegulations] = useState(mockRegulations);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // 弹窗相关状态
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [copyrightExpandedId, setCopyrightExpandedId] = useState<number | null>(null);

  // 刷新版权监测数据
  const refreshCopyright = () => {
    setIsRefreshing(true);
    // 模拟网络请求延迟
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // 切换版权监测展开/折叠状态
  const toggleCopyrightExpand = (id: number) => {
    setCopyrightExpandedId(copyrightExpandedId === id ? null : id);
  };

  // 刷新资产数据
  const refreshAssets = () => {
    setIsRefreshing(true);
    // 模拟网络请求延迟
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // 刷新法规数据
  const refreshRegulations = () => {
    setIsRefreshing(true);
    // 模拟网络请求延迟
    setTimeout(() => {
      // 这里可以替换为实际API请求
      setRegulations([...mockRegulations]);
      setIsRefreshing(false);
    }, 800);
  };

  // 切换展开/折叠状态
  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '0 24px' }}>
        <div style={{ background: '#fff', padding: 24, marginTop: 24, borderRadius: 4 }}>
          <Title level={2}>风险预警</Title>
          <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0' }} />
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 法规提醒模块 */}
            <>
              <Divider orientation="left">最新行业法规变更</Divider>
              <Space.Compact style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                <Button
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={refreshRegulations}
                  loading={isRefreshing}
                >
                  刷新法规
                </Button>
              </Space.Compact>

              {/* 法规提醒列表 */}
              <div style={{ width: '100%' }}>
                {regulations.map(regulation => (
                  <Card
                    key={regulation.id}
                    bordered={false}
                    className="regulation-card"
                    style={{ marginBottom: 16, overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '12px 16px',
                        backgroundColor: '#fff1f0',
                        borderLeft: '4px solid #ff4d4f'
                      }}
                      onClick={() => toggleExpand(regulation.id)}
                    >
                      {/* 红色闪烁灯 */}
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#ff4d4f',
                          marginRight: 12,
                          animation: 'blink 1.5s infinite'
                        }}
                      />
                      <Space.Compact style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 16 }}>{regulation.name}</Text>
                        <Text type="danger">{regulation.status}</Text>
                      </Space.Compact>
                    </div>

                    {/* 展开详情 */}
                    {expandedId === regulation.id && (
                      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                        <Paragraph>{regulation.details}</Paragraph>
                        <Space style={{ marginTop: 12 }}>
                          <Text type="secondary">发布单位: {regulation.department}</Text>
                          <Text type="secondary">发布时间: {regulation.publishTime}</Text>
                        </Space>
                        <Button
                          type="link"
                          href={regulation.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginTop: 12 }}
                        >
                          查看完整法规
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>

            {/* 资产失效预警模块 */}
            <>
              <Divider orientation="left">即将失效的资产</Divider>
              <Space.Compact style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                <Button
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={refreshAssets}
                  loading={isRefreshing}
                >
                  刷新资产
                </Button>
              </Space.Compact>

              {/* 资产失效预警证书展示 */}
              <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {mockExpiringAssets.map(asset => (
                  <Card
                    key={asset.id}
                    bordered={true}
                    className="asset-certificate"
                    style={{
                      width: 'calc(25% - 12px)',
                      marginBottom: 16,
                      overflow: 'hidden',
                      border: '1px solid #faad14',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    onClick={() => {                      
                      // 打开弹窗展示详情
                      setSelectedAsset(asset);
                      setShowAssetDetail(true);
                    }}
                  >
                    <div style={{ padding: 16, backgroundColor: '#fff7e6' }}>
                      {/* 证书顶部 */}
                      <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 16, color: '#faad14' }}>
                          {asset.certificateType === 'patent' ? '发明专利证书' : '计算机软件著作权登记证书'}
                        </Text>
                      </div>

                      {/* 证书内容 */}
                      <div style={{ border: '1px dashed #faad14', padding: 12, backgroundColor: '#fff' }}>
                        <Space direction="vertical" size="small">
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">名称:</Text>
                            <Text strong>{asset.name}</Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">类型:</Text>
                            <Text>{asset.type}</Text>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text type="secondary">有效期至:</Text>
                            <Text type="warning">{asset.expiryDate}</Text>
                          </div>
                        </Space>
                      </div>

                      {/* 黄色提醒灯 */}
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#faad14',
                          marginTop: 12,
                          marginLeft: 'auto',
                          marginRight: 'auto'
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </>

            {/* 版权监测模块 */}
            <>
              <Divider orientation="left">版权侵权监测</Divider>
              <Space.Compact style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                <Button
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={refreshCopyright}
                  loading={isRefreshing}
                >
                  刷新监测
                </Button>
              </Space.Compact>
              {/* 版权监测列表 */}
              <div style={{ width: '100%' }}>
                {mockCopyrightMonitoring.map(item => (
                  <Card
                    key={item.id}
                    bordered={false}
                    className="copyright-card"
                    style={{ marginBottom: 16, overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '12px 16px',
                        backgroundColor: '#e6f7ff',
                        borderLeft: '4px solid #1890ff'
                      }}
                      onClick={() => toggleCopyrightExpand(item.id)}
                    >
                      {/* 蓝色闪烁灯 */}
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#1890ff',
                          marginRight: 12,
                          animation: 'blink 1.5s infinite'
                        }}
                      />
                      <Space.Compact style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 16 }}>{item.content}</Text>
                        <Text type="success">相似度: {item.similarity}%</Text>
                      </Space.Compact>
                      <Text
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: item.status === '待处理' ? '#fff1f0' : item.status === '处理中' ? '#fff7e6' : '#f0fff4',
                          color: item.status === '待处理' ? '#ff4d4f' : item.status === '处理中' ? '#faad14' : '#52c41a'
                        }}
                      >
                        {item.status}
                      </Text>
                    </div>

                    {/* 展开详情 */}
                    {copyrightExpandedId === item.id && (
                      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                        <Paragraph>{item.details}</Paragraph>
                        <Space style={{ marginTop: 12 }}>
                          <Text type="secondary">类型: {item.type}</Text>
                          <Text type="secondary">来源: {item.source}</Text>
                          <Text type="secondary">发现时间: {item.discoveredTime}</Text>
                        </Space>
                        <Button
                          type="link"
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginTop: 12 }}
                        >
                          查看原文
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          </Space></div>
      </Content>

    {/* 资产详情弹窗 */}
      <Modal
        title={selectedAsset?.name || '资产详情'}
        visible={showAssetDetail}
        onCancel={() => setShowAssetDetail(false)}
        footer={null}
        width={600}
      >
        {selectedAsset && (
          <div style={{ padding: 24 }}>
            <div style={{ border: '1px dashed #faad14', padding: 16, backgroundColor: '#fff' }}>
              <Space>
              <Image src="zl.png" style={{ width: '200px'}} />
              <Space direction="vertical" size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">名称:</Text>
                  <Text strong>{selectedAsset.name}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">类型:</Text>
                  <Text>{selectedAsset.type}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">有效期至:</Text>
                  <Text type="warning">{selectedAsset.expiryDate}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">专利号/登记号:</Text>
                  <Text>{selectedAsset.patentNumber}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">发布单位:</Text>
                  <Text>{selectedAsset.department}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">发布时间:</Text>
                  <Text>{selectedAsset.issueDate}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">续期费用:</Text>
                  <Text type="warning">{selectedAsset.renewalFee}</Text>
                </div>
              </Space>
              </Space>
            </div>
            <Paragraph style={{ marginTop: 16 }}>{selectedAsset?.details || ''}</Paragraph>
            <Button
              type="primary"
              style={{ marginTop: 16, width: '100%' }}
            >
              立即续期
            </Button>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default RiskAlert;