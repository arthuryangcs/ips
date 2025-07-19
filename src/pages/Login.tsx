import React from 'react';
import { Form, Input, Card, Statistic, Row, Col, Spin, message, Layout, Typography, Button, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    console.log('Received login values: ', values);
    try {
      const response = await axios.post('/api/login', {
        username: values.username,
        password: values.password
      });
      // 保存用户信息到localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      messageApi.success(`欢迎回来，${response.data.user.username}！`, 2);
      // 等待 1s
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          messageApi.error(error.response.data.message, 3);
          console.log(error.response.data.message);
        } else {
          messageApi.error(`登录失败，状态码：${error.response.status}`, 3);
        }
      } else if (error.request) {
        messageApi.error('网络错误，无法连接到服务器，请检查网络设置', 3);
      } else {
        messageApi.error('登录失败，请稍后重试', 3);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundImage: 'url(/login_bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
      <Row gutter={[16, 16]}>
      <Card title="用户登录" style={{ width: 800, height: 270, marginTop: 90, marginRight: 20}}>
          {contextHolder}
          <Form
            name="normal_login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={(errorInfo) => {
              console.log('Login validation failed:', errorInfo);
              messageApi.error('用户名或密码不能为空');
            }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="用户名" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input
                prefix={<LockOutlined className="site-form-item-icon" />}
                type="password"
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                登录
              </Button>
              还没有账号? <Link to="/register">立即注册</Link>
            </Form.Item>
          </Form>
        </Card>
      </Row>
    </div>
);
};

export default Login;