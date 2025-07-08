import React, { useState } from 'react';
import { Upload, Button, message, Progress, Card, Typography } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const InfringementCheck: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleUpload = async (file: any) => {
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('zipFile', file);
    
    // 添加用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.id) {
      formData.append('userId', userInfo.id);
    } else {
      messageApi.error('用户未登录或会话已过期');
      return;
    }

    try {
      const response = await axios.post('/api/upload-zip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (e) => {
          if (e.total) {
            setProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

      if (!response.data || !response.data.taskId) {
        messageApi.error('获取任务ID失败');
        return;
      }

      messageApi.success('压缩包上传成功，正在进行侵权检测');
      // 获取任务ID并跳转到风险监测页面
      navigate(`/risk?taskId=${response.data.taskId}`);
    } catch (error) {
      messageApi.error('压缩包上传失败，请重试');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const beforeUpload = (file: any) => {
    const isZip = file.type === 'application/zip' || file.name.endsWith('.zip');
    if (!isZip) {
      messageApi.error('请上传ZIP格式的压缩包');
      return false;
    }
    const isLt200M = file.size / 1024 / 1024 < 200;
    if (!isLt200M) {
      messageApi.error('压缩包大小不能超过200MB');
      return false;
    }
    return true;
  };

  const uploadButton = (
    <Button
      icon={uploading ? <LoadingOutlined spin /> : <UploadOutlined />}
      loading={uploading}
      disabled={uploading}
      size="large"
      type="primary"
    >
      {uploading ? '上传中...' : '上传压缩包'}
    </Button>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      {contextHolder}
      <Title level={2}>侵权自检</Title>
      <Card
        style={{ marginTop: '1rem', padding: '2rem', textAlign: 'center' }}
        bordered
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: '1.5rem' }}>
          上传包含代码和图片的压缩包，系统将自动检测与资源库的相似度
        </Text>
        <Upload
          name="zipFile"
          beforeUpload={beforeUpload}
          showUploadList={false}
          customRequest={({ file, onSuccess }) => {
            handleUpload(file).then(() => onSuccess?.(null, file));
          }}
        >
          {uploadButton}
        </Upload>
        {uploading && (
          <Progress
            percent={progress}
            status="active"
            style={{ marginTop: '1.5rem' }}
            size="small"
          />
        )}
      </Card>
    </div>
  );
};

export default InfringementCheck;