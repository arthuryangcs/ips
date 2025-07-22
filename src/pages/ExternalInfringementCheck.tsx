import { Button, message, Card, Typography, Input, Divider, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Progress } from 'antd';

const { Title, Text } = Typography;

const ExternalInfringementCheck: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [resourceDetails, setResourceDetails] = useState<Array<{resource: any, content: string}>>([]);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const navigate = useNavigate();

  const handleCheck = async () => {
    if (!url) {
      messageApi.error('请输入URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setResourceDetails([]);
    setProgress(0);
    setProgressText('生成特征向量……');
    let p = 0;

    // 创建一个间隔来更新进度条
    const interval = setInterval(() => {
      console.log(p);
      p += 4;
      if (p >= 25 && p < 50) {
        setProgressText('检索相似资产……');
      } else if (p >= 50) {
        setProgressText('资产侵权对比……');
      }
      if (p >= 100) {
        clearInterval(interval);
        setProgress(100);
      } else {
        console.log("setProgress");
        console.log(p);
        setProgress(p);
      }
    }, 300);

    try {
      // 模拟6秒的处理时间
      // await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await axios.post('/api/check-external-url', {
        url
      });

      clearInterval(interval);
      setProgress(100);

      if (response.data && response.data.success) {
        setResult(response.data.result);
        messageApi.success('检测完成');
      } else {
        setError(response.data?.message || '检测失败');
        messageApi.error('检测失败');
      }
    } catch (err) {
      clearInterval(interval);
      setProgress(100);

      setError('网络错误，请重试');
      messageApi.error('网络错误，请重试');
      console.error('Check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!result) {
      messageApi.error('请先完成检测');
      return;
    }

    try {
      const response = await axios.post('/api/generate-report', {
        resultId: result.id
      });

      if (response.data && response.data.reportUrl) {
        window.open(response.data.reportUrl, '_blank');
        messageApi.success('报告生成成功');
      } else {
        messageApi.error('报告生成失败');
      }
    } catch (err) {
      messageApi.error('网络错误，请重试');
      console.error('Report error:', err);
    }
  };

  const getResourceContent = async (resourceId: number) => {
    try {
      // 先获取资源详情
      const resourceResponse = await axios.get(`/api/resources/${resourceId}`);
      const resource = resourceResponse.data;

      // 再获取资源内容
      const contentResponse = await axios.get(
        `/api/resources/${resourceId}/content`,
        { responseType: 'blob' }
      );

      // 根据文件类型处理内容
      const blob = new Blob([contentResponse.data], {
        type: contentResponse.headers['content-type']
      });
      const url = URL.createObjectURL(blob);

      return { resource, content: url };
    } catch (err) {
      messageApi.error('获取资源失败');
      return null;
    }
  };

  // 当result变化时，自动获取资源内容
  useEffect(() => {
    if (result && result.infringementEvidence && result.infringementEvidence.length > 0) {
      const fetchResources = async () => {
        const resources = [];
        for (const item of result.infringementEvidence) {
          const resourceDetail = await getResourceContent(item.id);
          if (resourceDetail) {
            resources.push(resourceDetail);
          }
        }
        setResourceDetails(resources);
      };

      fetchResources();
    }
  }, [result]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      {contextHolder}
      <Title level={2}>外部侵权检测</Title>
      <Card style={{ marginTop: '1rem', padding: '2rem' }} bordered>
        <Text type="secondary" style={{ display: 'block', marginBottom: '1.5rem' }}>
          输入外部作品URL，系统将自动爬取内容并与资产库进行比对
        </Text>

        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            placeholder="请输入URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleCheck}
            disabled={loading}
          >
            开始检测
          </Button>

          {loading && (
            <div style={{ marginTop: '1rem' }}>
              <Progress
                percent={progress}
                status="active"
                strokeWidth={2}
                style={{ marginBottom: '0.5rem' }}
              />
              <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
                {progressText}
              </Text>
            </div>
          )}
        </div>

        <Divider />

        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}

        {result && (
          <div style={{ marginTop: '1rem' }}>
            <Title level={4}>检测结果</Title>
            <Card style={{ marginBottom: '1rem' }}>
              {result.url && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <Text strong>外部作品：</Text>
                  <div/>
                  <img src={result.url} alt="外部作品" style={{ maxWidth: '100%', maxHeight: '400px' }} />
                  <Divider />
                </div>
              )}
              <Text strong>侵权风险: </Text>
              <Text
                style={{ 
                  color: result.riskLevel === '高' ? 'red' : result.riskLevel === '中' ? 'orange' : 'green'
                }}
              >
                {result.riskLevel}
              </Text>
              <Divider />
              <Text strong>侵权依据: </Text>
              <div style={{ marginTop: '0.5rem' }}>
                {result.infringementEvidence.map((item: any, index: number) => (
                  <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f5f5f5', display: 'flex', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 300px', marginRight: '1rem' }}>
                      <Text strong>相似资产: </Text>{item.assetName}
                      <div/>
                      <Text strong> 资产ID: </Text>{item.id}
                      <div/>
                      <Text strong>相似度: </Text>{item.similarity}%
                    </div>
                    <div style={{ flex: '1 1 300px', marginTop: '0' }}>
                      {resourceDetails.length > index && resourceDetails[index] ? (
                        resourceDetails[index].resource.file_type.startsWith('image/') ? (
                          <img src={resourceDetails[index].content} alt={item.assetName} style={{ maxWidth: '100%', maxHeight: '300px' }} />
                        ) : (
                          <a href={resourceDetails[index].content} target="_blank" rel="noopener noreferrer">
                            下载文件
                          </a>
                        )
                      ) : (
                        <Text>资源加载中...</Text>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Divider />
              <Text strong>整改建议: </Text>
              <Text>{result.recommendation}</Text>
            </Card>
            <Button type="primary" onClick={generateReport}>生成PDF报告</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ExternalInfringementCheck;