import { Layout, Typography, Spin, Card, Collapse, Row, Col, Button, message, Image, Divider } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DownloadOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface AssetVersion {
  version: string;
  id: number;
  asset_name: string;
  asset_no: string;
  resource_type: string;
  filename: string;
  asset_level: string;
  project: string;
  status: string;
  in_use: boolean;
  external_authorization: boolean;
  certificate_no: string;
  certificate_platform: string;
  certificate_timestamp: string;
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
  file_hash: string;
}

interface AssetDetail {
  id: number;
  asset_name: string;
  asset_no: string;
  certificate_no: string;
  certificate_platform: string;
  certificate_timestamp: string;
  resource_type: string;
  filename: string;
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
  file_hash: string;
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
  const [certifying, setCertifying] = useState(false);

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
    try {
      const response = await axios.get(`/api/resources/${id}/download`, {
        responseType: 'blob',
      });
      // 使用资产的MIME类型和文件名
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = asset?.filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
      messageApi.error('文件下载失败');
    }
  };

  const handleCertify = async () => {
    if (!id) {
      messageApi.error('获取资产ID失败');
      return;
    }

    setCertifying(true);
    // 显示加载消息
    const loadingMessage = messageApi.loading('正在处理存证，请稍候...', 0);
    // 2秒后自动关闭加载消息
    await new Promise(resolve => setTimeout(resolve, 2000));
    loadingMessage();

    try {
      const response = await axios.post(`/api/resources/${id}/certify`);
      // 关闭加载消息
      // loadingMessage();

      if (response.data && response.data.success) {
        // 更新资产信息
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
        messageApi.success('资源存证成功');
      } else {
        messageApi.error(response.data?.message || '资源存证失败');
      }
    } catch (err) {
      // 关闭加载消息
      // loadingMessage();

      messageApi.error('网络错误，请重试');
      console.error('Certify error:', err);
    }
    setCertifying(false);
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

  // 提取文件扩展名的辅助函数
  const getExtension = (filename: string): string => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  };

  return (
    <Content style={{ padding: '0 50px', marginTop: 20 }}>
      {contextHolder}
      <Button onClick={() => navigate('/dashboard')} icon={<ArrowLeftOutlined />} style={{ marginBottom: 20 }}>返回资产列表</Button>

      <Card style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6} lg={4}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {asset.is_image ? (
                <Image
                  alt={asset.asset_name}
                  src={asset.file_url}
                  preview={false}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
                ) : asset.resource_type === 'code' ? (
                  <img src="/code.png" alt="代码资源" className="code-thumbnail" />
                ) : (
                  // <Text style={{ fontSize: 24 }}>资产图示</Text>
                  <div className="file-icon">{getExtension(asset.filename)}</div>
                ) }
            </div>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} style={{ width: '100%', marginBottom: '10px' }}>下载资源</Button>
            {asset?.certificate_no ? (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleCertify} loading={certifying} style={{ width: '100%' }}>更新存证</Button>
            ) : (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleCertify} loading={certifying} style={{ width: '100%' }}>资源存证</Button>
            )}
          </Col>

          <Col xs={24} md={18} lg={20}>
            <Title level={3}>{asset.asset_name}</Title>
            <Divider/>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={10}>
                <Paragraph><strong>资产编号:</strong> {asset.asset_no}</Paragraph>
                <Paragraph><strong>创作人:</strong> {asset.creator}</Paragraph>
                <Paragraph><strong>资产类型:</strong> {asset.resource_type}</Paragraph>
                <Paragraph><strong>所属项目:</strong> {asset.project}</Paragraph>
                <Paragraph><strong>资产申报人:</strong> {asset.declarant}</Paragraph>
                <Paragraph><strong>申报日期:</strong> {dayjs(asset.declaration_date).format('YYYY-MM-DD')}</Paragraph>
              </Col>
              <Col xs={24} lg={14}>
                <Paragraph><strong>存证编号:</strong> {asset.certificate_no}</Paragraph>
                <Paragraph><strong>存证平台:</strong> {asset.certificate_platform}</Paragraph>
<Paragraph><strong>存证时间:</strong> {asset.certificate_timestamp ? dayjs(asset.certificate_timestamp).format('YYYY-MM-DD HH:mm:ss') : '无'}</Paragraph>
                <Paragraph><strong>文件哈希:</strong> {asset.file_hash ? asset.file_hash : '无'}</Paragraph>
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
          {asset.versions && Array.isArray(asset.versions) && asset.versions.map((version, index) => (
            <Panel header={`版本: ${version.asset_no}`} key={index + 1}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Paragraph><strong>资产编号:</strong> {version.asset_no}</Paragraph>
                  <Paragraph><strong>创作人:</strong> {version.creator}</Paragraph>
                  <Paragraph><strong>资产申报人:</strong> {version.declarant}</Paragraph>
                  <Paragraph><strong>资产审核人:</strong> {version.reviewer}</Paragraph>
                  <Paragraph><strong>审核入库日期:</strong> {dayjs(version.review_date).format('YYYY-MM-DD')}</Paragraph>
                  <Paragraph><strong>申报日期:</strong> {dayjs(version.declaration_date).format('YYYY-MM-DD')}</Paragraph>
                </Col>
                <Col xs={24} md={12}>
                  <Paragraph><strong>存证编号:</strong> {version.certificate_no}</Paragraph>
                <Paragraph><strong>存证平台:</strong> {version.certificate_platform}</Paragraph>
<Paragraph><strong>存证时间:</strong> {version.certificate_timestamp ? dayjs(version.certificate_timestamp).format('YYYY-MM-DD HH:mm:ss') : '无'}</Paragraph>
                  <Paragraph><strong>文件哈希:</strong> {version.file_hash ? version.file_hash : '无'}</Paragraph>
                </Col>
                <Col xs={24} md={6} lg={4}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              {asset.is_image ? (
                <Image
                  alt={version.asset_name}
                  src={version.file_url}
                  preview={false}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />) : 
                (<div></div>)
              }
            </div>
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