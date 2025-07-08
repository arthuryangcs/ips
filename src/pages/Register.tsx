import React from 'react';
import { Form, Input, Button, Card, Layout, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Content } = Layout;

const Register: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/register', {
        username: values.username,
        email: values.email,
        password: values.password
      });
      messageApi.success(`注册成功，${values.username}！请使用您的账号登录`, 3);
      // 等待 2s
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/login');
    } catch (error: any) {
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          messageApi.error(error.response.data.message, 3);
        } else {
          messageApi.error(`注册失败，状态码：${error.response.status}`, 3);
        }
      } else if (error.request) {
        messageApi.error('网络错误，无法连接到服务器，请检查网络设置', 3);
      } else {
        messageApi.error('注册失败，请稍后重试', 3);
      }
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Validation failed:', errorInfo);
    messageApi.error('表单验证失败，请检查输入内容');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', padding: '24px' }}>
        <Card title="用户注册" style={{ width: 360 }}>
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            scrollToFirstError
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 4, message: '用户名至少4个字符!' },
                { max: 20, message: '用户名最多20个字符!' },
              ]}
            >
              <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱!' },
                { type: 'email', message: '请输入有效的邮箱地址!' },
              ]}
            >
              <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6个字符!' },
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="请确认密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
                注册
              </Button>
              已有账号? <Link to="/login">立即登录</Link>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Register;