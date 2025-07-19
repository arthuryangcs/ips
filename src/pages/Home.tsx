import { Card, Statistic, Row, Col, Spin, message, Layout, Typography, Button, Divider } from 'antd';
import { Pie, Line } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Home: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [dashboardData, setDashboardData] = useState<any>(null);
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
            { date: '2021-03-09', value: 14000 },
            { date: '2021-03-10', value: 24000 },
            { date: '2021-03-11', value: 39068 },
            { date: '2021-03-12', value: 34000 },
            { date: '2021-03-13', value: 40000 },
            { date: '2021-03-14', value: 38000 },
            { date: '2021-03-15', value: 32000 },
            { date: '2021-03-16', value: 28000 },
          ],
          scannedResources: [
            { id: 1, name: '小美要赶回家原型图', health: 250, riskPoints: 2 },
            { id: 2, name: '小美的原型图跑到哪儿了', health: 250, riskPoints: 4 },
            { id: 3, name: '小美今天周四了快点吧', health: 250, riskPoints: 100 },
            { id: 4, name: '小美你可长点心吧', health: 250, riskPoints: 5 },
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
              <Card title="风险扫描 (近7日)">
              <Line
                data={dashboardData.riskScanData}
                xField="date"
                yField="value"
                smooth={true}
                interactions={[{
                  type: 'tooltip',
                }]}
              />
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
                    <div style={{ padding: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', flex: 1 }}>
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