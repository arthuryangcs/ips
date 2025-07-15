import React from 'react';
import { App as AntdApp, Layout, Menu } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { HomeOutlined, DashboardOutlined, UploadOutlined, LoginOutlined, LogoutOutlined, CheckCircleOutlined, AlertOutlined, PictureOutlined, CodeOutlined} from '@ant-design/icons';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadResource from './pages/UploadResource';
import ImageComparison from './pages/ImageComparison';
import CodeComparison from './pages/CodeComparison';
import AssetDetail from './pages/AssetDetail';
import './App.css';
import logo from './logo.svg';
import InfringementCheck from './pages/InfringementCheck';
import RiskMonitoring from './pages/RiskMonitoring';

const { Sider, Content, Footer } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleNavigate = React.useCallback((path: string) => {
    if (path === 'logout') {
      localStorage.removeItem('userInfo');
      navigate('/login');
    } else {
      navigate(path);
    }
  }, [navigate]);

  // 确定当前选中的菜单项
  const getSelectedKey = () => {
    if (currentPath === '/') return 'home';
    if (currentPath === '/upload-resource') return 'upload';
    if (currentPath === '/dashboard') return 'dashboard';
    if (currentPath.includes('/asset-detail')) return 'dashboard';
    if (currentPath === '/infringement') return 'infringement';
    if (currentPath === '/risk') return 'risk';
    if (currentPath === '/version-record') return 'version-record';
    if (currentPath === '/compliance-alert') return 'compliance-alert';
    if (currentPath === '/image-comparison') return 'image-comparison';
    if (currentPath === '/code-comparison') return 'code-comparison';
    if (currentPath === '/login') return 'login';
    return 'home';
  };

  // 检查用户登录状态
  const userInfo = localStorage.getItem('userInfo');
  const isLoggedIn = !!userInfo;

  // 动态生成菜单项
  const baseItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页', onClick: () => handleNavigate('/') },
    {
      key: 'ip-library',
      icon: <DashboardOutlined />,
      label: 'IP资产档案库',
      children: [
        { key: 'upload', icon: <UploadOutlined />, label: '新增资产', onClick: () => handleNavigate('/upload-resource') },
        { key: 'dashboard', icon: <DashboardOutlined />, label: '资产列表', onClick: () => handleNavigate('/dashboard') },
        // { key: 'asset-detail', icon: <CheckCircleOutlined />, label: '资产详情', onClick: () => handleNavigate('/asset-detail/?id=1') },
        // { key: 'version-record', icon: <CheckCircleOutlined />, label: '版本存证记录', onClick: () => handleNavigate('/version-record') }
      ]
    },
    {
      key: 'ip-risk-radar',
      icon: <AlertOutlined />,
      label: 'IP风险雷达',
      children: [
        { key: 'infringement', icon: <CheckCircleOutlined />, label: '侵权风险扫描', onClick: () => handleNavigate('/infringement') },
        { key: 'risk', icon: <AlertOutlined />, label: '权属健康监测', onClick: () => handleNavigate('/risk') },
        { key: 'compliance-alert', icon: <AlertOutlined />, label: '合规性预警', onClick: () => handleNavigate('/compliance-alert') },
        { key: 'image-comparison', icon: <PictureOutlined />, label: '图片检测', onClick: () => handleNavigate('/image-comparison') },
        { key: 'code-comparison', icon: <CodeOutlined />, label: '代码检测', onClick: () => handleNavigate('/code-comparison') }
      ]
    }
  ];

  const items = [...baseItems];
  if (isLoggedIn) {
    // 已登录状态下显示退出登录按钮
    items.push({
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => handleNavigate('logout')
    });
  } else {
    // 未登录状态下显示登录按钮
    items.push({
      key: 'login',
      icon: <LoginOutlined />,
      label: '登录',
      onClick: () => handleNavigate('/login')
    });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => console.log(broken)}
        onCollapse={(collapsed, type) => console.log(collapsed, type)}
      >
        <div style={{ display: 'flex', alignItems: 'center', margin: '16px' }}>
          <img src={logo} alt="Logo" style={{ height: '32px', marginRight: '8px' }} />
          <h1 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>游戏IP数字化管理平台</h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={items}
         defaultOpenKeys={['ip-library', 'ip-risk-radar']}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: '0 24px', marginTop: 24 }}>
          <div style={{ background: '#fff', padding: 24, minHeight: 'calc(100vh - 64px)' }}>
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>游戏IP数字化管理平台 ©{new Date().getFullYear()}</Footer>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <AntdApp>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload-resource" element={<UploadResource />} />
            <Route path="/infringement" element={<InfringementCheck />} />
            <Route path="/asset-detail" element={<AssetDetail />} />
            <Route path="/risk" element={<RiskMonitoring />} />
            <Route path="/version-record" element={<div>版本存证记录页面</div>} />
            <Route path="/compliance-alert" element={<div>合规性预警页面</div>} />
            <Route path="/image-comparison" element={<ImageComparison />} />
            <Route path="/code-comparison" element={<CodeComparison />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AntdApp>
  );
}

export default App;
