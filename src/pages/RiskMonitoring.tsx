import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Progress, Typography, Spin, Alert, List, Tag, Space, Button } from 'antd';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;

const RiskMonitoring: React.FC = () => {
  const location = useLocation();
  const taskId = new URLSearchParams(location.search).get('taskId');
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [error, setError] = useState('');
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // 获取用户信息
  const getUserInfo = () => {
    const userInfoStr = localStorage.getItem('userInfo');
    return userInfoStr ? JSON.parse(userInfoStr) : null;
  };

  // 获取用户所有任务
  const fetchUserTasks = async () => {
    try {
      setTasksLoading(true);
      const userInfo = getUserInfo();
      if (!userInfo?.id) {
        setError('未登录或用户信息无效');
        return;
      }
      const response = await axios.get(`/api/users/${userInfo.id}/tasks`);
      setUserTasks(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取用户任务列表失败');
    } finally {
      setTasksLoading(false);
    }
  };

  // 切换任务
  const handleTaskSelect = (selectedTaskId: string) => {
    navigate(`/risk?taskId=${selectedTaskId}`);
  };

  // 加载用户任务列表
  useEffect(() => {
    fetchUserTasks();
  }, []);

  // 如果没有taskId且有用户任务，自动跳转到最新任务
  useEffect(() => {
    if (!taskId && userTasks.length > 0) {
      handleTaskSelect(userTasks[0].id.toString());
    }
  }, [taskId, userTasks, handleTaskSelect]);

  // 加载当前任务状态
  useEffect(() => {
    if (!taskId) {
      setError('任务ID不存在');
      setLoading(false);
      return;
    }

    const fetchTaskStatus = async () => {
      try {
        const response = await axios.get(`/api/tasks/${taskId}`);
        setTask(response.data);
        setError('');

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          intervalId && clearInterval(intervalId);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '获取任务状态失败');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskStatus();
    const id = setInterval(fetchTaskStatus, 2000);
    setIntervalId(id);

    return () => id && clearInterval(id);
  }, [taskId]);

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

      {/* 用户任务列表 */}
      <Card style={{ marginTop: '1rem', marginBottom: '2rem' }}>
        <Title level={3}>我的任务列表</Title>
        {tasksLoading ? (
          <Spin size="small" />
        ) : error ? (
          <Alert message="错误" description={error} type="error" showIcon />
        ) : (
          <List
            pagination={{
              pageSize: 5
            }}
            dataSource={userTasks}
            renderItem={item => (
              <List.Item
                onClick={() => handleTaskSelect(item.id)}
                style={{ cursor: 'pointer', backgroundColor: item.id.toString() === taskId ? '#f0f7ff' : 'transparent' }}
              >
                <List.Item.Meta
                  title={`任务 ${item.id}`}
                  description={`状态: ${item.status} | 创建时间: ${new Date(item.created_at).toLocaleString()}`}
                />
                <Tag color={item.status === 'completed' ? 'success' : item.status === 'failed' ? 'error' : 'processing'}>
                  {item.status === 'completed' ? '已完成' : item.status === 'failed' ? '失败' : '处理中'}
                </Tag>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 当前任务详情 */}
      <Card style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Paragraph strong>任务ID: {taskId}</Paragraph>
          <Space>{getStatusTag()}</Space>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <Text>总体进度: {task?.progress || 0}%</Text>
          <Progress percent={task?.progress || 0} status={task?.status === 'processing' ? 'active' : undefined} />
          <Text type="secondary">
            已完成: {task?.completed_files || 0}/{task?.total_files || 0} 个文件
          </Text>
        </div>

        {task?.status === 'completed' && (
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

        {task?.status === 'failed' && (
          <Alert message="检测失败" description="文件检测过程中出现错误，请重试" type="error" showIcon />
        )}
      </Card>
    </div>
  );
};

export default RiskMonitoring;