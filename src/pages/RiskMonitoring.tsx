import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Progress, Typography, Spin, Alert, List, Tag, Space, Button } from 'antd';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const RiskMonitoring: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!taskId) {
      setError('任务ID不存在');
      setLoading(false);
      return;
    }

    // 获取任务状态
    const fetchTaskStatus = async () => {
      try {
        const response = await axios.get(`/api/tasks/${taskId}`);
        setTask(response.data);
        setError('');

        // 如果任务已完成或失败，停止轮询
        if (response.data.status === 'completed' || response.data.status === 'failed') {
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '获取任务状态失败');
        console.error('获取任务状态错误:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStatus();

    // 设置轮询获取任务进度
    const id = setInterval(fetchTaskStatus, 2000);
    setIntervalId(id);

    // 清理函数
    return () => {
      if (id) clearInterval(id);
    };
  }, [taskId, intervalId]);

  // 状态标签样式
  const getStatusTag = () => {
    if (!task) return null;

    switch (task.status) {
      case 'processing':
        return <Tag color="processing">处理中</Tag>;
      case 'completed':
        return <Tag color="success">已完成</Tag>;
      case 'failed':
        return <Tag color="error">失败</Tag>;
      case 'pending':
        return <Tag color="warning">等待中</Tag>;
      default:
        return <Tag>{task.status}</Tag>;
    }
  };

  if (loading && !task) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <Spin size="large" />
        <div style={{ marginTop: '1rem' }}>正在加载任务状态...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '2rem auto' }}>
        <Alert message="错误" description={error} type="error" showIcon />
        <Button style={{ marginTop: '1rem' }} onClick={() => navigate('/infringement')}>
          返回侵权自检
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <Title level={2}>风险监测</Title>
      <Card style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Paragraph strong>任务ID: {taskId}</Paragraph>
          <Space>{getStatusTag()}</Space>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <Text>总体进度: {task.progress}%</Text>
          <Progress percent={task.progress} status={task.status === 'processing' ? 'active' : undefined} />
          <Text type="secondary">
            已完成: {task.completed_files}/{task.total_files} 个文件
          </Text>
        </div>

        {task.status === 'completed' && (
          <div>
            <Alert message="检测完成" description="文件相似度检测已完成" type="success" showIcon />
            <List
              header={<div>检测结果摘要</div>}
              dataSource={[
                { title: '总文件数', description: task.total_files },
                { title: '相似文件数', description: '0 (模拟数据)' },
                { title: '高风险文件', description: '0 (模拟数据)' },
                { title: '中等风险文件', description: '0 (模拟数据)' },
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta title={item.title} description={item.description} />
                </List.Item>
              )}
            />
          </div>
        )}

        {task.status === 'failed' && (
          <Alert message="检测失败" description="文件检测过程中出现错误，请重试" type="error" showIcon />
        )}
      </Card>
    </div>
  );
};

export default RiskMonitoring;