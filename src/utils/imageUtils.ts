/**
 * 将文件转换为base64字符串
 * @param file - 要转换的文件对象
 * @returns Promise<string> - 解析为base64字符串的Promise
 */
export const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * 比较两张图片的相似度（简化版）
 * @param img1 - 第一张图片的base64字符串
 * @param img2 - 第二张图片的base64字符串
 * @returns Promise<number> - 解析为相似度百分比的Promise
 */
export const compareImageSimilarity = async (img1: string, img2: string): Promise<number> => {
  // 在实际应用中，这里应该实现更复杂的图像比对算法
  // 简化版本：随机生成一个50-100之间的相似度值
  return new Promise(resolve => {
    setTimeout(() => {
      const similarity = 50 + Math.random() * 50;
      resolve(Math.round(similarity));
    }, 1000);
  });
};