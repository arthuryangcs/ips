import React from 'react';
import { App as AntdApp, Layout, Menu, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { DashboardOutlined, UploadOutlined, LoginOutlined, LogoutOutlined, CheckCircleOutlined, AlertOutlined, PictureOutlined, CodeOutlined} from '@ant-design/icons';
import { SearchOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadResource from './pages/UploadResource';
import ImageComparison from './pages/ImageComparison';
import CodeComparison from './pages/CodeComparison';
import AssetDetail from './pages/AssetDetail';
import './App.css';
import InfringementCheck from './pages/InfringementCheck';
import RiskMonitoring from './pages/RiskMonitoring';
import ExternalInfringementCheck from './pages/ExternalInfringementCheck';
import RiskAlert from './pages/RiskAlert';

const { Sider, Content, Footer, Header } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
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
    if (currentPath === '/image-comparison') return 'image-comparison';
    if (currentPath === '/code-comparison') return 'code-comparison';
    if (currentPath === '/external-infringement') return 'external-infringement';
    if (currentPath === '/risk-alert') return 'risk-alert';
    if (currentPath === '/login') return 'login';
    return 'home';
  };

  // 检查用户登录状态
  const userInfo = localStorage.getItem('userInfo');
  const isLoggedIn = !!userInfo;

  // 动态生成菜单项
  const baseItems = [
    { key: 'home', icon: <DashboardOutlined />, label: '仪表盘', onClick: () => handleNavigate('/') },
    {
      key: 'ip-library',
      icon: <CheckCircleOutlined />,
      label: 'IP资产档案库',
      children: [
        { key: 'upload', icon: <UploadOutlined />, label: '新增资产', onClick: () => handleNavigate('/upload-resource') },
        { key: 'dashboard', icon: <DashboardOutlined />, label: '资产列表', onClick: () => handleNavigate('/dashboard') },
        // { key: 'asset-detail', icon: <CheckCircleOutlined />, label: '资产详情', onClick: () => handleNavigate('/asset-detail/?id=1') },
      ]
    },
    {
      key: 'ip-risk-radar',
      icon: <AlertOutlined />,
      label: 'IP资产监测',
      children: [
        { key: 'risk-alert', icon: <AlertOutlined />, label: '风险预警', onClick: () => handleNavigate('/risk-alert') }
      ]
    },
    {
      key: 'ip-tools',
      icon: <AlertOutlined />,
      label: '自检工具',
      children: [
        { key: 'external-infringement', icon: <AlertOutlined />, label: '外部侵权检测', onClick: () => handleNavigate('/external-infringement') },
        { key: 'infringement', icon: <CheckCircleOutlined />, label: '侵权风险扫描', onClick: () => handleNavigate('/infringement') },
        { key: 'risk', icon: <AlertOutlined />, label: '权属健康监测', onClick: () => handleNavigate('/risk') },
        { key: 'image-comparison', icon: <PictureOutlined />, label: '图片检测', onClick: () => handleNavigate('/image-comparison') },
        { key: 'code-comparison', icon: <CodeOutlined />, label: '代码检测', onClick: () => handleNavigate('/code-comparison') }
      ]
    }
  ];

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
    <Layout>
        <Header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '64px', padding: 8, background: colorBgContainer, zIndex: 1000, boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={'logo.svg'} alt="Logo" style={{ height: '32px', marginRight: '16px' }} />
              <h1 style={{ fontSize: '24px', margin: 0 }}>游戏知识产权管理平台</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <SearchOutlined style={{ fontSize: '18px' }} />
              <BellOutlined style={{ fontSize: '18px' }} />
              {isLoggedIn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserOutlined style={{ fontSize: '18px'}} />
                  <span>{JSON.parse(userInfo || '{}').username || '用户'}</span>
                </div>
              ) : null}
            </div>
          </div>
        </Header>
    <Layout style={{ minHeight: '100vh', marginTop: '64px' }}>
      <Sider
          style={{ position: 'fixed', top: '64px', left: 0, height: 'calc(100vh - 64px)', zIndex: 999, overflowY: 'auto'  }}
          breakpoint="lg"
          collapsedWidth="0"
          onBreakpoint={(broken) => console.log(broken)}
          onCollapse={(collapsed) => setIsCollapsed(collapsed)}
          theme="light"
        >
        <Menu
          // style={{position: 'fixed'}}
          theme="light"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={items}
         defaultOpenKeys={['ip-library', 'ip-risk-radar', 'ip-tools']}
        />
      </Sider>
      <Layout style={{ marginLeft: isCollapsed ? '0' : '200px', transition: 'margin-left 0.3s ease' }}>
        <Content style={{ padding: 0 }}>
          {/* <div style={{ background: '#fff', padding: 24, minHeight: 'calc(100vh - 64px)' }}> */}
            {children}
          {/* </div> */}
        </Content>
        <Footer style={{ textAlign: 'center' }}>游戏知识产权管理平台 ©{new Date().getFullYear()}</Footer>
      </Layout>
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
            <Route path="/risk" element={<RiskMonitoring />} /><Route path="/risk-alert" element={<RiskAlert />} />
            <Route path="/image-comparison" element={<ImageComparison />} />
            <Route path="/code-comparison" element={<CodeComparison />} />
            <Route path="/external-infringement" element={<ExternalInfringementCheck />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AntdApp>
  );
}

export default App;
