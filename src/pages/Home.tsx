import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Spin, message, Layout, Typography } from 'antd';
import { Pie } from '@ant-design/plots';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;

const Home: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [summaryData, setSummaryData] = useState<{ resource_type: string; authorization_status: string; count: number }[]>([]);
  const [authorizationSummary, setAuthorizationSummary] = useState<{ authorization_status: string; count: number }[]>([]);
  const [resourceTypeData, setResourceTypeData] = useState<{ resource_type: string; count: number }[]>([]);
  const [totalResources, setTotalResources] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 资源类型颜色映射
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const fetchResourceSummary = async () => {
      try {
        setLoading(true);
        // 获取本地存储的用户信息
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          // 用户未登录，跳转到登录页
          navigate('/login', { replace: true });
          return;
        }
        const userInfo = JSON.parse(userInfoStr);
        const response = await axios.get(`/api/resources/summary?userInfo=${encodeURIComponent(userInfoStr)}`);
        const data: { resource_type: string; authorization_status: string; count: number }[] = response.data;
        setSummaryData(data);
        // 计算总资源数
        const total = data.reduce((sum: number, item) => sum + item.count, 0);
        setTotalResources(total);
        // 按授权状态汇总
        const authSummary = data.reduce((acc, item) => {
          const existing = acc.find(a => a.authorization_status === item.authorization_status);
          if (existing) {
            existing.count += item.count;
          } else {
            acc.push({ authorization_status: item.authorization_status, count: item.count });
          }
          return acc;
        }, [] as { authorization_status: string; count: number }[]);
        setAuthorizationSummary(authSummary);
        // 按资源类型汇总
        const resourceTypeData = data
          .filter(item => item.resource_type !== undefined && item.count !== undefined)
          .reduce((acc, item) => {
            const existing = acc.find(a => a.resource_type === item.resource_type);
            if (existing) {
              existing.count += item.count;
            } else {
              acc.push({ resource_type: item.resource_type, count: item.count });
            }
            return acc;
          }, [] as { resource_type: string; count: number }[]);
        setResourceTypeData(resourceTypeData);
      } catch (err: any) {
        messageApi.error(err.message || '获取资源汇总数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchResourceSummary();
  }, [navigate]);

  return (
    <Content style={{ padding: '0 24px' }}>
      {contextHolder}
      <div style={{ padding: 24, background: '#fff', minHeight: '100%' }}>
        <Typography.Title level={2} style={{ marginBottom: 24 }}>
          欢迎回来，{JSON.parse(localStorage.getItem('userInfo') || '{}').username || '用户'}！
        </Typography.Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总资源数"
                value={totalResources}
                prefix={<span>📁</span>}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="代码资源"
                value={summaryData.find(item => item.resource_type === 'code')?.count || 0}
                prefix={<span>📄</span>}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="图片资源"
                value={summaryData.find(item => item.resource_type === 'image')?.count || 0}
                prefix={<span>🖼️</span>}
                valueStyle={{ color: '#ff7a45' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="字体资源"
                value={summaryData.find(item => item.resource_type === 'font')?.count || 0}
                prefix={<span>🔤</span>}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="已授权资源"
                value={authorizationSummary.find(item => item.authorization_status === '已授权')?.count || 0}
                prefix={<span>✅</span>}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="可商用资源"
                value={authorizationSummary.find(item => item.authorization_status === '可商用')?.count || 0}
                prefix={<span>💼</span>}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="未授权资源"
                value={authorizationSummary.find(item => item.authorization_status === '未授权')?.count || 0}
                prefix={<span>❌</span>}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="资源类型分布">
                  <Pie
                    chartId="resourceTypePie"
                    data={resourceTypeData}
                    angleField="count"
                    colorField="resource_type"
                    radius={0.8}
                    label={{
                      labelHeight: 28,
                      text: 'resource_type',
                    }}
                    interactions={[{
                      type: 'element-active',
                    }]}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="授权状态分布">
                  <Pie
                    chartId="authorizationStatusPie"
                    data={authorizationSummary}
                    angleField="count"
                    colorField="authorization_status"
                    radius={0.8}
                    label={{
                      labelHeight: 28,
                      text: 'authorization_status',
                    }}
                    interactions={[{
                      type: 'element-active',
                    }]}
                  />
                </Card>
              </Col>
            </Row>
      </div>
    </Content>
  );
};

export default Home;