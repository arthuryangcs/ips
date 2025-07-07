import React, { useState, useRef } from 'react';
import { Upload, Button, Space, Card, Divider, Progress, message } from 'antd';
import { UploadOutlined, SyncOutlined } from '@ant-design/icons';
import { getBase64 } from '../utils/imageUtils';

const ImageComparison: React.FC = () => {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (side: 'left' | 'right', file: any) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        message.error('请上传图片文件');
        reject(new Error('不是有效的图片文件'));
        return;
      }

      getBase64(file).then(base64 => {
        if (side === 'left') {
          setImage1(base64);
        } else {
          setImage2(base64);
        }
        resolve(true);
      }).catch(err => {
        message.error('图片处理失败');
        reject(err);
      });
    });
  };

  const compareImages = () => {
    if (!image1 || !image2) {
      message.warning('请先上传两张图片');
      return;
    }

    setLoading(true);
    setSimilarity(null);

    // 模拟图片相似度计算
    setTimeout(() => {
      // 在实际应用中，这里应该调用后端API或更复杂的前端算法
      const randomSimilarity = Math.floor(Math.random() * 100) + 1;
      setSimilarity(randomSimilarity);
      setLoading(false);
    }, 1500);
  };

  const uploadProps = (side: 'left' | 'right') => ({
    beforeUpload: async (file: File) => {
      if (!file.type.startsWith('image/')) {
        message.error('请上传图片文件');
        return false;
      }
      try {
        const base64Url = await getBase64(file);
        if (side === 'left') {
          setImage1(base64Url);
        } else {
          setImage2(base64Url);
        }
        return false;
      } catch (err) {
        message.error('图片处理失败');
        return false;
      }
    },
    showUploadList: false,
    maxCount: 1,
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>图片相似度检测</h2>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
        <Card title="图片一" style={{ width: '45%' }}>
          <Upload {...uploadProps('left')}>
            <Button icon={<UploadOutlined />}>上传图片</Button>
          </Upload>
          {image1 && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <img
                src={image1}
                alt="图片一"
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>
          )}
        </Card>

        <Card title="图片二" style={{ width: '45%' }}>
          <Upload {...uploadProps('right')}>
            <Button icon={<UploadOutlined />}>上传图片</Button>
          </Upload>
          {image2 && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <img
                src={image2}
                alt="图片二"
                style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
              />
            </div>
          )}
        </Card>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Button
          type="primary"
          icon={<SyncOutlined spin={loading} />}
          onClick={compareImages}
          loading={loading}
          size="large"
        >
          对比图片相似度
        </Button>
      </div>

      {similarity !== null && (
        <div style={{ textAlign: 'center' }}>
          <h3>相似度结果: {similarity}%</h3>
          <Progress
            percent={similarity}
            size={24}
            status={similarity > 70 ? 'success' : similarity > 30 ? 'active' : 'exception'}
            format={(percent) => `${percent}%`}
          />
          <div style={{ marginTop: '15px' }}>
            {similarity > 70 ? (
              <span style={{ color: 'green' }}>两张图片非常相似</span>
            ) : similarity > 30 ? (
              <span style={{ color: 'orange' }}>两张图片存在部分相似</span>
            ) : (
              <span style={{ color: 'red' }}>两张图片差异较大</span>
            )}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageComparison;