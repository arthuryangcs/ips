import React, { useState } from 'react';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button, message, Select, Typography, Card, Progress, Space, Divider, Alert, List, Form, DatePicker, Input, Radio, InputNumber } from 'antd';
import type { UploadFile, RcFile } from 'antd/es/upload';
import Dragger from 'antd/es/upload/Dragger';
import axios from 'axios';
import { Steps } from 'antd';
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface UploadResourceProps {
  onSuccess?: () => void;
  userInfo?: any;
}

const UploadResource: React.FC<UploadResourceProps> = ({ onSuccess }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [certificateInfo, setCertificateInfo] = useState<any>(null);

  // 步骤定义
  const steps = [
    { title: '基础信息' },
    { title: '权属登记' },
    { title: '上传资源' },
  ];

  // 资产类型选项
  const assetTypeOptions = [
    { label: '角色美术', value: 'character_art' },
    { label: '商标', value: 'trademark' },
    { label: '代码', value: 'code' },
    { label: '图片', value: 'image' },
    { label: '字体', value: 'font' },
  ];

  // 所属项目选项
  const projectOptions = [
    { label: '王者荣耀', value: '王者荣耀' },
    { label: '最终幻想', value: '最终幻想' },
    { label: '使命召唤', value: '使命召唤' },
  ];

  // 资产评级选项
  const assetLevelOptions = [
    { label: '常规', value: 'regular' },
    { label: '重要', value: 'important' },
    { label: '核心', value: 'core' },
  ];

  // 文件处理工具函数
  const getFileExtension = (filename: string | undefined): string => {
    if (typeof filename !== 'string') return '';
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.slice(lastDotIndex).toLowerCase() : '';
  };

  const formatFileSize = (size: number | undefined): string => {
    if (typeof size !== 'number') return '未知大小';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (filename: string | undefined): string => {
    const extWithDot = getFileExtension(filename);
    const ext = extWithDot.replace(/^\./, '').toUpperCase();
    if (['JPG', 'PNG', 'GIF', 'JPEG'].includes(ext)) return '图片';
    if (['JS', 'TS', 'JSX', 'TSX', 'HTML', 'CSS', 'SCSS', 'JSON', 'MD'].includes(ext)) return '代码';
    return ext || '未知类型';
  };

  // 步骤导航处理
  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 定义各步骤需要验证的字段
  const stepFields = [
    ['resourceType', 'assetName', 'assetNo', 'project', 'assetLevel', 'completionDate', 'declarant'], // 步骤1: 基础信息
    ['creationType', 'creator', 'commissionContract'], // 步骤2: 权属登记
    [] // 步骤3: 上传资源无需额外字段验证
  ];

  // 表单提交处理
  const handleSubmit = async () => {
    try {
      // 验证当前步骤表单
      if (currentStep < 2) {
        // 只验证当前步骤的字段
        await form.validateFields(stepFields[currentStep]);
        next();
        return;
      }

      // 最后一步，提交所有数据
      const values = await form.validateFields();
      await handleUpload(values);
    } catch (errorInfo) {
      console.error('表单验证失败:', errorInfo);
    }
  };

  // 文件上传处理
  const handleUpload = async (formValues: any) => {
    // 获取用户信息
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) {
      setError('请先登录后再新增资产');
      return;
    }
    const userInfo = JSON.parse(userInfoStr);
    if (!userInfo || !userInfo.id) {
      setError('用户信息不完整，请重新登录');
      return;
    }

    if (!fileList || fileList.length === 0) {
      setError('请选择至少一个文件');
      return;
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      // 添加文件
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('files', file.originFileObj as File);
        }
      });

      // 添加表单数据
      formData.append('userId', userInfo.id);
      
      // 转换表单数据为蛇形命名
      const convertToSnakeCase = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(convertToSnakeCase);
        return Object.keys(obj).reduce((acc, key) => {
          const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          acc[snakeKey] = convertToSnakeCase(obj[key]);
          return acc;
        }, {} as any);
      };
      
      // const snakeCaseAssetInfo = convertToSnakeCase(formValues);
      const snakeCaseAssetInfo = formValues;
      formData.append('assetInfo', JSON.stringify(snakeCaseAssetInfo));

      // 商标特殊处理
      if (formValues.resourceType === 'trademark' && formValues.trademarkRegNo) {
        formData.append('trademarkRegNo', formValues.trademarkRegNo);
      }

      // 上传到服务器
      const response = await axios.post('/api/assets/create', formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      });

      // 保存存证信息
      setCertificateInfo(response.data.certificate);

      messageApi.success({
        content: '资产新增成功',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      });

      if (onSuccess) {
        onSuccess();
      }

      // 重置表单
      form.resetFields();
      setFileList([]);
      setCurrentStep(0);
    } catch (error: any) {
      console.error('上传错误:', error);
      setError(error.response?.data?.message || '资产新增失败，请重试');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 文件移除处理
  const handleFileRemove = (file: UploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
    setError('');
  };

  // 文件上传前处理
  const handleBeforeUpload = (file: RcFile) => {
    // 检查文件大小，限制100MB
    const isLt100M = file.size / 1024 / 1024 < 100;
    if (!isLt100M) {
      setError('文件大小不能超过100MB');
      return false;
    }

    // 添加到文件列表
    setFileList([...fileList, { ...file, name: file.name, size: file.size, type: file.type, originFileObj: file } as UploadFile]);
    return false;
  };

  // 渲染文件列表
  const renderFileList = () => {
    return (
      <List
        dataSource={fileList}
        renderItem={(file) => (
          <List.Item
            actions={[
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => handleFileRemove(file)}
                size="small"
                type="text"
                danger
              />
            ]}
          >
            <List.Item.Meta
              avatar={
                  <div style={{ width: 40, height: 40, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadOutlined style={{ color: '#1890ff' }} />
                  </div>
              }
              title={
                <span style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    {file.name || file.originFileObj?.name || '未知文件名'}
                  </span>
              }
              description={
                <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                  {formatFileSize(file.size || file.originFileObj?.size)} · {getFileType(file.name || file.originFileObj?.name)}
                </span>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    return (
      <div>
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          {renderBasicInfo()}
        </div>
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          {renderOwnershipInfo()}
        </div>
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          {renderResourceUpload()}
        </div>
      </div>
    );
  };

  // 基础信息表单
  const renderBasicInfo = () => (
    <div>
      <Form.Item
        name="resourceType"
        label="资产类型"
        rules={[{ required: true, message: '请选择资产类型' }]}
      >
        <Select placeholder="请选择资产类型" options={assetTypeOptions} />
      </Form.Item>

      <Form.Item
        name="assetName"
        label="资产名称"
        rules={[{ required: true, message: '请输入资产名称' }]}
      >
        <Input placeholder="请输入资产名称" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="assetNo"
        label="资产编号"
        rules={[{ required: true, message: '请输入资产编号' }]}
      >
        <Input placeholder="系统自动生成，可修改" />
      </Form.Item>

      <Form.Item
        name="project"
        label="所属项目"
        rules={[{ required: true, message: '请选择所属项目' }]}
      >
        <Select placeholder="请选择所属项目" options={projectOptions} />
      </Form.Item>

      <Form.Item
        name="assetLevel"
        label="资产评级"
        rules={[{ required: true, message: '请选择资产评级' }]}
      >
        <Select placeholder="请选择资产评级" options={assetLevelOptions} />
      </Form.Item>

      <Form.Item
        name="completionDate"
        label="创作完成日期"
        rules={[{ required: true, message: '请选择创作完成日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="declarant"
        label="资产申报人"
        rules={[{ required: true, message: '请输入资产申报人' }]}
      >
        <Input placeholder="部门，XXX" />
      </Form.Item>
    </div>
  );

  // 权属登记表单
  const renderOwnershipInfo = () => (
    <div>
      <Form.Item
        name="creationType"
        label="创作类型"
        rules={[{ required: true, message: '请选择创作类型' }]}
      >
        <Radio.Group>
          <Radio value="self">自有创作</Radio>
          <Radio value="commissioned">委托创作</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="creator"
        label="创作人"
        rules={[{ required: true, message: '请输入创作人' }]}
      >
        <Input placeholder={form.getFieldValue('creationType') === 'self' ? '部门，XXX' : '请输入创作人信息'} />
      </Form.Item>

      <Form.Item
        name="commissionContract"
        label="委托合同"
        rules={[
          {
            required: form.getFieldValue('creationType') === 'commissioned',
            message: '请上传委托合同'
          }
        ]}
        style={{ display: form.getFieldValue('creationType') === 'commissioned' ? 'block' : 'none' }}
      >
          <Dragger
            name="contract"
            beforeUpload={(file) => {
              const isPdf = file.type === 'application/pdf';
              if (!isPdf) {
                setError('请上传PDF格式的合同文件');
                return false;
              }
              return false;
            }}
            showUploadList={true}
          >
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <UploadOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <div style={{ marginTop: 8 }}>点击或拖拽委托合同文件至此处上传</div>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                支持 PDF 格式，单个文件不超过20MB
              </Text>
            </div>
          </Dragger>
        </Form.Item>
    </div>
  );

  // 资源上传表单
  const renderResourceUpload = () => (
    <div>
      <Form.Item
        name="files"
        valuePropName="fileList"
        getValueFromEvent={() => fileList}
        rules={[{ required: true, message: '请上传至少一个文件' }]}
      >
        <Dragger
          name="files"
          listType="picture-card"
          className="upload-list-inline"
          beforeUpload={handleBeforeUpload}
          fileList={fileList}
          onRemove={handleFileRemove}
          multiple
          showUploadList={false}
        >
          {fileList.length > 0 ? renderFileList() : (
            <div style={{ padding: '30px 0', textAlign: 'center' }}>
              <UploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div style={{ marginTop: 8 }}>点击或拖拽文件至此处上传</div>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                支持多文件上传，单个文件不超过100MB
              </Text>
            </div>
          )}
        </Dragger>
      </Form.Item>

      {form.getFieldValue('resourceType') === 'trademark' && (
        <Form.Item
          name="trademarkRegNo"
          label="商标注册号"
          rules={[{ required: true, message: '请输入商标注册号' }]}
        >
          <Input placeholder="请输入商标注册号" />
        </Form.Item>
      )}
    </div>
  );

  // 渲染存证信息
  const renderCertificateInfo = () => (
    certificateInfo && (
      <Card title="资产存证信息" bordered style={{ marginTop: 20 }}>
        <Paragraph strong>存证编号: {certificateInfo.certificateNo}</Paragraph>
        <Paragraph>存证平台: {certificateInfo.platform}</Paragraph>
        <Paragraph>存证时间: {certificateInfo.timestamp}</Paragraph>
        <Paragraph>文件哈希: {certificateInfo.fileHash}</Paragraph>
        <Button type="primary" onClick={() => window.open(certificateInfo.verifyUrl)}>司法验证</Button>
      </Card>
    )
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      {contextHolder}
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>新增资产</Title>
      <Card
        bordered
        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', borderRadius: 8 }}
      >
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        {error && (
          <Alert
            message="操作错误"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={{ creationType: 'self', resourceType: 'image' }}
        >
          {renderStepContent()}
        </Form>

        {uploadProgress > 0 && (
          <div style={{ marginBottom: 16, marginTop: 16 }}>
            <Progress percent={uploadProgress} status="active" />
            <Text type="secondary" style={{ display: 'block', textAlign: 'right', marginTop: 4 }}>
              {uploadProgress}%
            </Text>
          </div>
        )}

        {renderCertificateInfo()}

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          {currentStep > 0 && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={prev}
              style={{ marginRight: 8 }}
              disabled={uploading}
            >
              上一步
            </Button>
          )}
          <Button
            type="primary"
            icon={currentStep < 2 ? <ArrowRightOutlined /> : null}
            onClick={handleSubmit}
            loading={uploading}
          >
            {currentStep < 2 ? '下一步' : '提交资产'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default UploadResource;