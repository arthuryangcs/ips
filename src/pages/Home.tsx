import { Card, Statistic, Row, Col, Spin, message, Layout, Typography, Button, Divider } from 'antd';
import { Pie, Line } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';

interface ResourceDistributionItem {
  type: string;
  value: number;
}

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [dashboardData, setDashboardData] = useState<any>({
    resourceDistribution: [],
    riskScanData: [],
    scannedResources: [],
    announcements: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 获取本地存储的用户信息
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          // 用户未登录，跳转到登录页
          navigate('/login', { replace: true });
          return;
        }
        // 模拟API数据
        const data = {
          totalResources: 3734000,
          processedRiskPoints: 368,
          dailyNewRiskPoints: 8874,
          growthRate: '2.8%',
          riskScanData: [
            { date: '2025-07-19', value: 14000 },
            { date: '2025-07-20', value: 24000 },
            { date: '2025-07-21', value: 39068 },
            { date: '2025-07-22', value: 34000 },
            { date: '2025-07-23', value: 40000 },
            { date: '2025-07-24', value: 38000 },
            { date: '2025-07-25', value: 32000 },
            { date: '2025-07-26', value: 28000 },
          ],
          scannedResources: [
            { id: 1, name: '小关要赶回家原型图', health: 250, riskPoints: 2 },
            { id: 2, name: '小关的原型图跑到哪儿了', health: 250, riskPoints: 4 },
            { id: 3, name: '小关今天周四了快点吧', health: 250, riskPoints: 100 },
            { id: 4, name: '小关你可长点心吧', health: 250, riskPoints: 5 },
            { id: 5, name: '最后一个不知道写啥了', health: 250, riskPoints: 9 },
          ],
          resourceDistribution: [
            { type: '代码类', value: 16 },
            { type: '图文类', value: 48 },
            { type: '视频类', value: 36 },
          ],
          announcements: [
            { type: '预警', content: '资源包ASDFGH已识别高风险' },
            { type: '消息', content: '新增内容尚未通过审核，详...' },
            { type: '通知', content: '资源包QWERTY已通过风险审核' },
            { type: '通知', content: '资源包ZXCVBN已标记入库' },
            { type: '消息', content: '新增内容尚未通过审核，详...' },
          ]
        };
        setDashboardData(data);
      } catch (err: any) {
        messageApi.error(err.message || '获取仪表盘数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
      </Content>
    );
  }

  if (!dashboardData) {
    return (
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        <Card>
          <Title level={3} style={{ color: 'red' }}>获取仪表盘数据失败</Title>
          <Button onClick={() => window.location.reload()}>刷新页面</Button>
        </Card>
      </Content>
    );
  }

  return (
    <div>
      {contextHolder}
      <Row gutter={[16, 16]} style={{padding: '0 16px'}}>
        <Col xs={24} sm={12} lg={16}>
        <Row gutter={[12, 12]}>
          <Content style={{ padding: '0 0px', marginTop: 12 }}>
            <div style={{ background: '#fff', padding: 12 }}>
                <Row>
                  <Typography.Title level={3} style={{ marginBottom: 24 }}>
          欢迎光临，游戏知识产权管理组的小伙伴们！
        </Typography.Title>
                </Row>
              <Row gutter={[16, 16]} style={{ padding: '2px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已上传资源内容"
                value={dashboardData.totalResources}
                prefix={<span>📁</span>}
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => `${(dashboardData.totalResources / 10000).toFixed(1)}w+`}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已处理风险点"
                value={dashboardData.processedRiskPoints}
                prefix={<span>✅</span>}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="日新增风险点"
                value={dashboardData.dailyNewRiskPoints}
                prefix={<span>⚠️</span>}
                valueStyle={{ color: '#ff7a45' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="较昨日新增"
                value={dashboardData.growthRate}
                prefix={<span>📈</span>}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
            </div>
          </Content>
        </Row>
        <Row gutter={[12, 12]}>
          <Content style={{ padding: '0 0px', marginTop: 12 }}>
            <div style={{ background: '#fff', padding: 12 }}>
              <Card title="风险扫描 (近7日)"
              >
              <Line
                data={dashboardData.riskScanData}
                xField="date"
                yField="value"
                shapeField={"smooth"}
                smooth={true}
                style={{
                  lineWidth: 2,
                }}
                height={300}
                interactions={[{
                  type: 'tooltip',
                }]}
              />
            </Card>
            </div>
          </Content>
        </Row>
        <Row gutter={[12, 12]}>
          <Content style={{ padding: '0 0px', marginTop: 12 }}>
            <div style={{ background: '#fff', padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Card title="已扫描资源清单">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <span style={{ padding: '4px 8px', backgroundColor: '#e6f7ff', color: '#1890ff', borderRadius: 4 }}>图文</span>
                    <span style={{ padding: '4px 8px', cursor: 'pointer' }}>代码</span>
                    <span style={{ padding: '4px 8px', cursor: 'pointer' }}>视频</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px', gap: 8, fontSize: 14, padding: '8px 0', borderBottom: '1px solid #e8e8e8', fontWeight: 'bold' }}>
                    <div>编号</div>
                    <div>资源包名称</div>
                    <div>健康度</div>
                    <div>风险点</div>
                  </div>
                  {dashboardData.scannedResources.map((item: any, index: number) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px', gap: 8, fontSize: 14, padding: '12px 0', borderBottom: '1px solid #e8e8e8', alignItems: 'center' }}>
                      <div>{item.id}</div>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div>{item.health}</div>
                      <div style={{ color: item.riskPoints > 5 ? '#f5222d' : '#faad14', display: 'flex', alignItems: 'center' }}>
                        {item.riskPoints} <span style={{ marginLeft: 4 }}>▲</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#1890ff', cursor: 'pointer', fontSize: 14 }}>查看更多</span>
                </div>
              </Card>
              <Card title="资源库占比">
                {dashboardData.resourceDistribution.length > 0 && (
                  <Pie
                    data={dashboardData.resourceDistribution}
                    innerRadius={0.5}
                    angleField="value"
                    colorField="type"
                    radius={0.8}
                    height={300}
                    label={{
                      position: 'inside',
                      formatter: (datum?: ResourceDistributionItem) => datum?.type && datum?.value !== undefined ? `${datum.type} ${datum.value}%` : '',
                    }}
                    interactions={[
                      {
                        type: 'element-active',
                      },
                    ]}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                  {dashboardData.resourceDistribution.map((item: any, index: number) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 12, height: 12, backgroundColor: index === 0 ? '#1890ff' : index === 1 ? '#52c41a' : '#fa8c16', marginRight: 8, borderRadius: 2 }}></div>
                      <div style={{ fontSize: 14 }}>{item.type} {item.value}%</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Content>
        </Row>
        </Col>
        <Col xs={24} sm={12} lg={8}>
        <Row gutter={[8, 8]}>
          <Content style={{ padding: '0 0px', marginTop: 12 }}>
            <div style={{ background: '#fff', padding: 12 }}>
              <Card title="功能模块">
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>风险管理</h3>
                    <span style={{ color: '#1890ff', fontSize: 14, cursor: 'pointer' }}>管理</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>📁</div>
                      <div style={{ fontSize: 14 }}>资源管理</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>📊</div>
                      <div style={{ fontSize: 14 }}>风险统计</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>🔍</div>
                      <div style={{ fontSize: 14 }}>侵权检测</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>🛡️</div>
                      <div style={{ fontSize: 14 }}>技术防护</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>👥</div>
                      <div style={{ fontSize: 14 }}>风险处理</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>合规管理</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>📚</div>
                      <div style={{ fontSize: 14 }}>权属管理</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>📝</div>
                      <div style={{ fontSize: 14 }}>内容合规</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 12, border: '1px solid #e8e8e8', borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ marginBottom: 8, fontSize: 24 }}>⚖️</div>
                      <div style={{ fontSize: 14 }}>维权管理</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            </div>
          </Content>
        </Row>
        <Row gutter={[8, 8]}>
          <Content style={{ padding: '0 0px', marginTop: 12 }}>
            <div style={{ background: '#fff', padding: 12 }}>
              <Card title="公告">
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {dashboardData.announcements.map((announcement: any, index: number) => (
                  <div key={index} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'inline-block', padding: '2px 8px', marginRight: 8, borderRadius: 4, backgroundColor: announcement.type === '预警' ? '#fff1f0' : announcement.type === '通知' ? '#e6f7ff' : '#fffbe6', color: announcement.type === '预警' ? '#f5222d' : announcement.type === '通知' ? '#1890ff' : '#faad14' }}>
                      {announcement.type}
                    </div>
                    <div style={{ padding: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', flex: 1 , height: 20}}>
                    {announcement.content}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button size="small">查看更多</Button>
              </div>
            </Card>
            </div>
          </Content>
        </Row>
        <Row gutter={[8, 8]}>
          <Content style={{ padding: '0 0px', marginTop: 12 }}>
            <div style={{ background: '#fff', padding: 12 }}>
              <Card title="帮助文档" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>系统简介</span>
                  <ArrowLeftOutlined style={{ fontSize: 12 }} />
                </div>
                <Divider style={{ margin: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>使用指南</span>
                  <ArrowLeftOutlined style={{ fontSize: 12 }} />
                </div>
                <Divider style={{ margin: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>接入流程</span>
                  <ArrowLeftOutlined style={{ fontSize: 12 }} />
                </div>
                <Divider style={{ margin: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>接口文档</span>
                  <ArrowLeftOutlined style={{ fontSize: 12 }} />
                </div>
              </div>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button size="small">查看更多</Button>
              </div>
            </Card>
            </div>
          </Content>
        </Row>
        </Col>
      </Row>
    </div>
  );
};

export default Home;