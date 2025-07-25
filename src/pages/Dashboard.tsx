import React from 'react';
import { Layout, theme, Typography, Spin, message, Button, Modal, Input, Row, Col, Card, Select, DatePicker } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SearchOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

interface Resource {
  id: number;
  asset_name: string;
  filename: string;
  file_url: string;
  file_type: string;
  uploaded_at: string;
  resource_type: string;
  authorization_status: string;
  asset_no: string;
  project: string;
  asset_level: string;
  status: string;
  declaration_date: string;
}

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const username = userInfo.username || '用户';
  const [resources, setResources] = React.useState<Resource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [fileContent, setFileContent] = React.useState('');
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = React.useState(false);
  const [currentDeleteId, setCurrentDeleteId] = React.useState<number | null>(null);
  const [isImageFile, setIsImageFile] = React.useState(false);
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [filters, setFilters] = React.useState({
    project: '',
    type: '',
    assetLevel: '',
    status: '',
    declarationDate: [] as unknown as [Dayjs | null, Dayjs | null]
  });

  // 获取资产列表
  const fetchResources = async () => {
    if (!userInfo || !userInfo.id) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/resources', {
        params: {
          userInfo: JSON.stringify(userInfo),
          searchKeyword,
          filters: JSON.stringify(filters)
        }
      });
      setResources(response.data);
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || '获取资产失败');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchResources();
  }, [filters, searchKeyword]);

  // 筛选资产
  const filteredResources = React.useMemo(() => {
    return resources.filter(resource => {
      // 关键词筛选
      const matchesKeyword = searchKeyword === '' || 
        resource.asset_name.toLowerCase().includes(searchKeyword.toLowerCase()) || 
        resource.asset_no.toLowerCase().includes(searchKeyword.toLowerCase());
      
      // 项目筛选
      const matchesProject = filters.project === '' || resource.project === filters.project;
      
      // 类型筛选
      const matchesType = filters.type === '' || resource.resource_type === filters.type;
      
      // 资产级别筛选
      const matchesAssetLevel = filters.assetLevel === '' || resource.asset_level === filters.assetLevel;
      
      // 状态筛选
      // const matchesStatus = filters.status === '' || resource.status === filters.status;
      
      // 申报时间筛选
      // const matchesDate = !filters.declarationDate[0] || !filters.declarationDate[1] || 
      //   (dayjs(resource.declaration_date).isAfter(filters.declarationDate[0]!) && 
      //    dayjs(resource.declaration_date).isBefore(filters.declarationDate[1]!));
      
      return matchesKeyword && matchesProject && matchesType && matchesAssetLevel;
    });
  }, [resources, searchKeyword, filters]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const handleViewFile = async (id: number, filename: string) => {
    navigate(`/asset-detail/?id=${id}`);
    // try {
    //   setLoadingContent(true);
    //   const isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(filename);
      
    //   if (isImage) {
    //     setFileContent(`/api/resources/${id}/content`);
    //   } else {
    //     const response = await axios.get(`/api/resources/${id}/content`);
    //     const sanitizedContent = DOMPurify.sanitize(response.data.content);
    //     setFileContent(sanitizedContent);
    //   }
    //   setIsImageFile(isImage);
    //   setIsModalVisible(true);
    // } catch (error) {
    //   messageApi.error('获取文件内容失败');
    // } finally {
    //   setLoadingContent(false);
    // }
  };

  const handleViewDetail = (id: number) => {
    navigate(`/asset-detail/?id=${id}`);
  };

  const handleDelete = (id: number) => {
    setCurrentDeleteId(id);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentDeleteId) return;
    try {
      await axios.delete(`http://localhost:4000/api/resources/${currentDeleteId}`);
      messageApi.success('删除成功');
      fetchResources();
      setIsDeleteModalVisible(false);
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSearch = () => {
    // 触发筛选逻辑，由useMemo自动处理
  };

  const resetFilters = () => {
    setSearchKeyword('');
    setFilters({
      project: '',
      type: '',
      assetLevel: '',
      status: '',
      declarationDate: [] as unknown as [Dayjs | null, Dayjs | null]
    });
  };

  // 提取文件扩展名的辅助函数
  const getExtension = (filename: string): string => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  };

  return (
      <Content style={{ margin: '24px 16px 0', overflow: 'auto' }}>
        {contextHolder}
        <div
          style={{
            padding: 24,
            minHeight: 360,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Title level={2}>资产列表</Title>
          
          {/* 仅保留搜索框 */}
          <Input
            placeholder="关键词、资产名称、编号皆可"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            style={{ marginBottom: 20 }}
            prefix={<SearchOutlined />}
          />

          {/* 筛选条件区域 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            {/* 项目筛选 */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                placeholder="选择项目"
                value={filters.project}
                onChange={value => setFilters({...filters, project: value})}
                style={{ width: '100%' }}
                options={[
                  { value: '', label: '全部项目' },
                  { value: '王者荣耀', label: '王者荣耀' },
                  { value: '最终幻想', label: '最终幻想' },
                  { value: '使命召唤', label: '使命召唤' }
                ]}
              />
            </Col>

            {/* 类型筛选 */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                placeholder="选择类型"
                value={filters.type}
                onChange={value => setFilters({...filters, type: value})}
                style={{ width: '100%' }}
                options={[
                  { value: '', label: '全部类型' },
                  { label: '角色美术', value: 'character_art' },
                  { label: '商标', value: 'trademark' },
                  { label: '代码', value: 'code' },
                  { label: '图片', value: 'image' },
                  { label: '字体', value: 'font' },
                ]}
              />
            </Col>

            {/* 资产级别筛选 */}
            <Col xs={24} sm={12} md={8} lg={4}>
              <Select
                placeholder="选择资产级别"
                value={filters.assetLevel}
                onChange={value => setFilters({...filters, assetLevel: value})}
                style={{ width: '100%' }}
                options={[
                  { value: '', label: '全部级别' },
                  { label: '常规', value: 'regular' },
                  { label: '重要', value: 'important' },
                  { label: '核心', value: 'core' },
                ]}
              />
            </Col>
          </Row>

          {loading ? (
            <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
          ) : filteredResources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <p>暂无符合条件的资产</p>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredResources.map(resource => (
                <Col xs={24} sm={12} md={8} lg={6} key={resource.id}>
                  <Card
                    hoverable
                    bordered
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    {/* 资产卡片内容保持不变 */}
                    <div
                      style={{
                        height: 160,
                        // backgroundColor: '#ffccd5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                        overflow: 'hidden'
                      }}
                      onClick={() => handleViewFile(resource.id, resource.filename)}
                    >
                      {/\.(jpg|jpeg|png|gif|bmp)$/i.test(resource.filename) ? (
                        <img
                          src={`/api/resources/${resource.id}/content`}
                          alt={resource.asset_name}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div className="asset-thumbnail">
                          {resource.resource_type === 'code' ? (
                            <img src="/code.png" alt="代码资源" className="code-thumbnail" />
                          // ) : resource.file_type.includes('image') ? (
                          //   <img src={resource.file_url} alt={resource.asset_name} />
                          ) : (
                            <div className="file-icon">{getExtension(resource.filename)}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <p><strong>资产名称:</strong> {resource.asset_name}</p>
                      <p><strong>资产编号:</strong> {resource.asset_no}</p>
                      <p><strong>项目:</strong> {resource.project}</p>
                      <p><strong>类型:</strong> {resource.resource_type}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                      <Button size="small" onClick={() => handleViewDetail(resource.id)}>查看详情</Button>
                      <Button size="small" danger onClick={() => handleDelete(resource.id)}>删除</Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* 查看文件模态框和删除确认模态框保持不变 */}
          <Modal
            title="文件内容"
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            width={800}
          >
            <Spin spinning={loadingContent}>
              {isImageFile ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                  <img 
                    src={fileContent} 
                    alt="Preview" 
                    style={{ maxWidth: '100%', maxHeight: '600px' }} 
                  />
                </div>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{fileContent}</pre>
              )}
            </Spin>
          </Modal>

          <Modal
            title="确认删除"
            open={isDeleteModalVisible}
            onOk={handleConfirmDelete}
            onCancel={() => setIsDeleteModalVisible(false)}
            okText="确认"
            cancelText="取消"
            style={{ zIndex: 1000 }}
          >
            <p>确定要删除此资产吗？此操作不可恢复。</p>
          </Modal>
        </div>
      </Content>
  );
};

export default Dashboard;