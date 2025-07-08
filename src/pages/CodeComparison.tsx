import React, { useState } from 'react';
import { Card, Button, Input, Progress, message } from 'antd';
import { CodeOutlined, SyncOutlined } from '@ant-design/icons';

const CodeComparison: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [code1, setCode1] = useState<string>('');
  const [code2, setCode2] = useState<string>('');
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // 简单的代码相似度计算实现（实际应用中可替换为更复杂的算法）
  const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;
    
    // 移除空白字符以提高比较准确性
    const cleanStr1 = str1.replace(/\s+/g, '');
    const cleanStr2 = str2.replace(/\s+/g, '');
    
    if (!cleanStr1 || !cleanStr2) return 0;
    
    const maxLength = Math.max(cleanStr1.length, cleanStr2.length);
    let matches = 0;
    
    // 比较字符匹配度
    for (let i = 0; i < Math.min(cleanStr1.length, cleanStr2.length); i++) {
      if (cleanStr1[i] === cleanStr2[i]) {
        matches++;
      }
    }
    
    return Math.round((matches / maxLength) * 100);
  };

  const handleCompare = () => {
    if (!code1.trim() || !code2.trim()) {
      messageApi.warning('请输入两段代码进行比较');
      return;
    }

    setLoading(true);
    setSimilarity(null);

    // 模拟计算延迟
    setTimeout(() => {
      const score = calculateSimilarity(code1, code2);
      setSimilarity(score);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ padding: '20px' }}>
      {contextHolder}
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>代码相似度检测</h2>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
        <Card title="代码一" style={{ width: '45%' }}>
          <Input.TextArea
            rows={15}
            placeholder="请输入或粘贴代码"
            value={code1}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode1(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
          />
        </Card>

        <Card title="代码二" style={{ width: '45%' }}>
          <Input.TextArea
            rows={15}
            placeholder="请输入或粘贴代码"
            value={code2}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode2(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
          />
        </Card>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <Button
          type="primary"
          icon={<SyncOutlined spin={loading} />
          }
          onClick={handleCompare}
          loading={loading}
          size="large"
        >
          对比代码相似度
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
              <span style={{ color: 'green' }}>两段代码非常相似</span>
            ) : similarity > 30 ? (
              <span style={{ color: 'orange' }}>两段代码存在部分相似</span>
            ) : (
              <span style={{ color: 'red' }}>两段代码差异较大</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeComparison;