import { Layout, Typography, Spin, Card, Collapse, Row, Col, Button, message, Image } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface AssetVersion {
  version: string;
  asset_no: string;
  certificate_no: string;
  creator: string;
  completion_date: string;
  rights_ownership: string;
  description: string;
  declarant: string;
  declaration_date: string;
  reviewer: string;
  review_date: string;
}

interface AssetDetail {
  id: number;
  asset_name: string;
  asset_no: string;
  certificate_no: string;
  resource_type: string;
  asset_level: string;
  project: string;
  status: string;
  in_use: boolean;
  external_authorization: boolean;
  creator: string;
  completion_date: string;
  rights_ownership: string;
  declarant: string;
  declaration_date: string;
  reviewer: string;
  review_date: string;
  versions: AssetVersion[];
  file_url: string;
  is_image: boolean;
}

const AssetDetail: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  // const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const navigate = useNavigate();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
        messageApi.error('获取资产详情失败');
    }

    const fetchAssetDetail = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const response = await axios.get(`/api/resources/${id}`, {
          params: { userInfo: JSON.stringify(userInfo) }
        });
        setAsset(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || '获取资产详情失败');
        messageApi.error('获取资产详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetail();
  }, [id]);

  const handleDownload = async () => {
    if (!asset) return;

    try {
      const response = await axios.get(`/api/resources/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.asset_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      messageApi.error(err.response?.data?.messageApi || '下载失败');
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
      </Content>
    );
  }

  if (error || !asset) {
    return (
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        <Card>
          <Title level={3} style={{ color: 'red' }}>资产不存在或已被删除</Title>
          <Button onClick={() => navigate('/dashboard')} icon={<ArrowLeftOutlined />}>返回资产列表</Button>
        </Card>
      </Content>
    );
  }

  return (
    <Content style={{ padding: '0 50px', marginTop: 20 }}>
      {contextHolder}
      <Button onClick={() => navigate('/dashboard')} icon={<ArrowLeftOutlined />} style={{ marginBottom: 20 }}>返回资产列表</Button>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6} lg={4}>
            <div style={{ height: 200, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {asset.is_image ? (
                <Image
                  alt={asset.asset_name}
                  src={asset.file_url}
                  preview={false}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <Text style={{ fontSize: 24 }}>资产图示</Text>
              )}
            </div>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} style={{ width: '100%' }}>下载资源</Button>
          </Col>

          <Col xs={24} md={18} lg={20}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Title level={3}>{asset.asset_name}</Title>
                <Paragraph><strong>资产编号:</strong> {asset.asset_no}</Paragraph>
                <Paragraph><strong>存证编号:</strong> {asset.certificate_no}</Paragraph>
                <Paragraph><strong>资产类型:</strong> {asset.resource_type}</Paragraph>
                <Paragraph><strong>所属项目:</strong> {asset.project}</Paragraph>
              </Col>

              <Col xs={24} lg={12}>
                <Paragraph><strong>创作人:</strong> {asset.creator}</Paragraph>
                <Paragraph><strong>完成日期:</strong> {dayjs(asset.completion_date).format('YYYY-MM-DD')}</Paragraph>
                {/* <Paragraph><strong>权利归属:</strong> {asset.rights_ownership} {asset.rights_ownership.includes('合同') && <a href="#">可查看</a>}</Paragraph> */}
                <Paragraph><strong>资产申报人:</strong> {asset.declarant}</Paragraph>
                <Paragraph><strong>申报日期:</strong> {dayjs(asset.declaration_date).format('YYYY-MM-DD')}</Paragraph>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>状态</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}><Paragraph><strong>是否在使用中:</strong> {asset.in_use ? '是' : '否'}</Paragraph></Col>
          <Col xs={24} sm={12}><Paragraph><strong>是否存在外部授权:</strong> {asset.external_authorization ? '是' : '否'} {asset.external_authorization && <a href="#">查看详情</a>}</Paragraph></Col>
          <Col xs={24} sm={12}><Paragraph><strong>资产审核人:</strong> {asset.reviewer}</Paragraph></Col>
          <Col xs={24} sm={12}><Paragraph><strong>审核入库日期:</strong> {dayjs(asset.review_date).format('YYYY-MM-DD')}</Paragraph></Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>版本历史</Title>
        <Collapse defaultActiveKey={['1']}>
          {asset.versions.map((version, index) => (
            <Panel header={`版本: ${version.asset_no}`} key={index + 1}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Paragraph><strong>资产编号:</strong> {version.asset_no}</Paragraph>
                  <Paragraph><strong>存证编号:</strong> {version.certificate_no}</Paragraph>
                  <Paragraph><strong>创作人:</strong> {version.creator}</Paragraph>
                  <Paragraph><strong>完成日期:</strong> {dayjs(version.completion_date).format('YYYY-MM-DD')}</Paragraph>
                </Col>
                <Col xs={24} md={12}>
                  {/* <Paragraph><strong>权利归属:</strong> {version.rights_ownership} {version.rights_ownership.includes('合同') && <a href="#">可查看</a>}</Paragraph> */}
                  <Paragraph><strong>说明:</strong> {version.description || '无'}</Paragraph>
                  <Paragraph><strong>资产申报人:</strong> {version.declarant}</Paragraph>
                  <Paragraph><strong>申报日期:</strong> {dayjs(version.declaration_date).format('YYYY-MM-DD')}</Paragraph>
                  <Paragraph><strong>资产审核人:</strong> {version.reviewer}</Paragraph>
                  <Paragraph><strong>审核入库日期:</strong> {dayjs(version.review_date).format('YYYY-MM-DD')}</Paragraph>
                </Col>
              </Row>
            </Panel>
          ))}
        </Collapse>
      </Card>
    </Content>
  );
};

export default AssetDetail;