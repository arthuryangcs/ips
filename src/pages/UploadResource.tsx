import React, { useState } from 'react';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, message, Select, Typography, Card, Progress, Space, Divider, Alert, List, Image } from 'antd';
import type { UploadFile, RcFile } from 'antd/es/upload';
import Dragger from 'antd/es/upload/Dragger';
import axios from 'axios';
const { Title, Text, Paragraph } = Typography;

interface UploadResourceProps {
  onSuccess?: () => void;
  userInfo?: any;
}

const UploadResource: React.FC<UploadResourceProps> = ({ onSuccess }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedType, setSelectedType] = useState('code');
  const [selectedAuthorization, setSelectedAuthorization] = useState('未授权');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const getFileExtension = (filename: string | undefined): string => {
    if (typeof filename !== 'string') return '';
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.slice(lastDotIndex).toLowerCase() : '';
  };

  const formatFileSize = (size: number | undefined): string => {
    if (typeof size !== 'number') return '未知大小';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (filename: string | undefined): string => {
    const extWithDot = getFileExtension(filename);
    const ext = extWithDot.replace(/^\./, '').toUpperCase();
    if (['JPG', 'PNG', 'GIF', 'JPEG'].includes(ext)) return '图片';
    if (['JS', 'TS', 'JSX', 'TSX', 'HTML', 'CSS', 'SCSS', 'JSON', 'MD'].includes(ext)) return '代码';
    return ext || '未知类型';
  };

  const handleUpload = async () => {
    // 从本地存储获取用户信息
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) {
      setError('请先登录后再上传资产');
      return;
    }
    const userInfo = JSON.parse(userInfoStr);
    if (!userInfo || !userInfo.id) {
      setError('用户信息不完整，请重新登录');
      return;
    }
    
    if (!fileList || fileList.length === 0) {
      setError('请选择至少一个文件');
      return;
    }
    
    if (!selectedType) {
      setError('请选择资产类型');
      return;
    }
    
    setError('');
    const file = fileList[0];
    if (!file) {
      setError('文件不存在，请重新选择文件');
      return;
    }
    const fileObj = file.originFileObj;
    
    if (!fileObj) {
      setError('文件对象不存在，请重新选择文件');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fileObj as File);
    formData.append('userId', userInfo.id);
    formData.append('resourceType', selectedType);
    formData.append('authorizationStatus', selectedAuthorization);
    
    setUploading(true);
    setUploadProgress(0);
    try {
      const response = await axios.post('/api/upload', formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });
      
      messageApi.success({
        content: '文件上传成功',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });
      if (onSuccess) {
        onSuccess();
      }
      setFileList([]);
    } catch (error: any) {
      console.error('上传错误:', error);
      setError(error.response?.data?.message || '文件上传失败，请重试');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
    setError('');
  };

  const handleBeforeUpload = (file: RcFile) => {
    // 检查文件大小，限制100MB
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      setError('文件大小不能超过100MB');
      return false;
    }
    
    // 客户端兼容的文件扩展名提取方法
    // const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.json', '.md'];
    // const fileExtension = getFileExtension(file.name);
    
    setFileList([{ ...file, name: file.name, size: file.size, type: file.type, originFileObj: file } as UploadFile]);
    return false;
  };

    const renderFileList = () => {
      return (
        <List
          dataSource={fileList}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleFileRemove(file)}
                  size="small"
                  type="text"
                  danger
                />
              ]}
            >
              <List.Item.Meta
                avatar={
                    <div style={{ width: 40, height: 40, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UploadOutlined style={{ color: '#1890ff' }} />
                    </div>
                }
                title={
                  <span style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      {file.name || file.originFileObj?.name || '未知文件名'}
                    </span>
                }
                description={
                  <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {formatFileSize(file.size || file.originFileObj?.size)}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      );
    };

  const uploadButton = (
    <div style={{ padding: '30px 0', textAlign: 'center' }}>
      <UploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
      <div style={{ marginTop: 8 }}>点击或拖拽文件至此处上传</div>
      <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
        支持 JPG, PNG, GIF 等图片文件或代码文件，单个文件不超过100MB
      </Text>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      {contextHolder}
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>资产上传</Title>
      <div>
        <Card title="资产上传"
          bordered
          style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', borderRadius: 8 }}
        >
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="large">
              <div>
                <Paragraph strong>资产信息</Paragraph>
                <Divider style={{ margin: '12px 0' }} />
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    value={selectedType}
                    onChange={value => setSelectedType(value)}
                    placeholder="请选择资产类型"
                    style={{ flex: 1, marginRight: 16 }}
                    allowClear={false}
                  >
                    <Select.Option value="code">代码</Select.Option>
                    <Select.Option value="image">图片</Select.Option>
                    <Select.Option value="font">字体</Select.Option>
                  </Select>
                  <Select
                    value={selectedAuthorization}
                    onChange={value => setSelectedAuthorization(value)}
                    placeholder="请选择授权状态"
                    style={{ flex: 1 }}
                    allowClear={false}
                  >
                    <Select.Option value="已授权">已授权</Select.Option>
                    <Select.Option value="可商用">可商用</Select.Option>
                    <Select.Option value="未授权">未授权</Select.Option>
                  </Select>
                </Space.Compact>
              </div>

              <div>
                <Paragraph strong>文件上传</Paragraph>
                <Divider style={{ margin: '12px 0' }} />
                <Dragger
                  name="file"
                  listType="picture-card"
                  className="upload-list-inline"
                  beforeUpload={handleBeforeUpload}
                  fileList={fileList}
                  onRemove={handleFileRemove}
                  showUploadList={false}
                >
                  {fileList.length > 0 ? renderFileList() : uploadButton}
                </Dragger>
              </div>
            </Space>
          </div>

          {error && (
            <Alert
              message="上传错误"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {uploadProgress > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Progress percent={uploadProgress} status="active" />
              <Text type="secondary" style={{ display: 'block', textAlign: 'right', marginTop: 4 }}>
                {uploadProgress}%
              </Text>
            </div>
          )}

          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0 || !selectedType || uploading}
              loading={uploading}
              size="large"
            >
              {uploading ? '上传中' : '开始上传'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UploadResource;