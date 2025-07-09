import React from 'react';
import { Layout, theme, Typography, Table, Spin, message, Button, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UploadResource from './UploadResource';
import DOMPurify from 'dompurify';

interface Resource {
  id: number;
  filename: string;
  file_type: string;
  uploaded_at: string;
  resource_type: string;
  authorization_status: string;
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
  // 添加图片文件标识状态
  const [isImageFile, setIsImageFile] = React.useState(false);
  
  // 获取资产列表
  const fetchResources = async () => {
    if (!userInfo || !userInfo.id) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/resources', {
        params: { userInfo: JSON.stringify(userInfo) }
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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const handleViewFile = async (id: number, filename: string) => {
    try {
      setLoadingContent(true);
      // 检查文件是否为图片
      const isImage = /\.(jpg|jpeg|png|gif|bmp)$/i.test(filename);
      
      if (isImage) {
        // 对于图片，直接设置URL
        setFileContent(`/api/resources/${id}/content`);
      } else {
        // 对于其他文件，获取内容
        const response = await axios.get(`/api/resources/${id}/content`);
        // 净化文件内容，防止XSS注入
        const sanitizedContent = DOMPurify.sanitize(response.data.content);
        setFileContent(sanitizedContent);
      }
      // 存储文件类型信息
      setIsImageFile(isImage);
      setIsModalVisible(true);
    } catch (error) {
      messageApi.error('获取文件内容失败');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleDelete = (id: number) => {
    setCurrentDeleteId(id);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentDeleteId) return;
    try {
      await axios.delete(`http://localhost:5001/api/resources/${currentDeleteId}`);
      messageApi.success('删除成功');
      fetchResources(); // 刷新资产列表
      setIsDeleteModalVisible(false);
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || '删除失败');
    }
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
          <Title level={2}>资产归档</Title>
          {loading ? (
            <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
          ) : resources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <p>暂无上传资产</p>
            </div>
          ) : (
            <>
              <Table
                dataSource={resources}
                columns={[
                  {
                    title: '文件名',
                    dataIndex: 'filename',
                    key: 'filename',
                  },
                  {
                    title: '资产类型',
                    dataIndex: 'resource_type',
                    key: 'resource_type',
                    width: 120
                  },
                  {
                    title: '文件类型',
                    dataIndex: 'file_type',
                    key: 'file_type',
                  },
                  {
                    title: '上传时间',
                    dataIndex: 'uploaded_at',
                    key: 'uploaded_at',
                    width: 180,
                    render: (date) => {
                      const adjustedDate = new Date(date);
                      adjustedDate.setHours(adjustedDate.getHours() + 8);
                      return adjustedDate.toLocaleString('zh-CN');
                    }
                  },
                  {
                    title: '授权状态',
                    dataIndex: 'authorization_status',
                    key: 'authorization_status',
                    width: 120,
                    render: (status) => (
                      <span style={{ color: status === '未授权' ? 'red' : 'inherit' }}>
                        {status || '未授权'}
                      </span>
                    )
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record) => (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Button type="primary" size="small" onClick={() => handleViewFile(record.id, record.filename)}>
                          查看
                        </Button>
                        <Button type="primary" size="small" onClick={() => handleDelete(record.id)}>
                          删除
                        </Button>
                      </div>
                    )
                  }
                ]}
                rowKey="id"
              />
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
            </>
          )}
        </div>
      </Content>
  );
};

export default Dashboard;