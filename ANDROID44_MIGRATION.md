# Android 4.4 支持迁移指南

## 版本降级说明

为了支持 Android 4.4 (API 19)，项目进行了以下重大版本降级：

### 核心框架
- **Expo SDK**: 50 → 46
- **React Native TV OS**: 0.73.7 → 0.69.8
- **React**: 18.2.0 → 18.0.0
- **TypeScript**: 5.3.3 → 4.3.5

### 重要变更
1. **移除了 expo-router**
   - 原因：expo-router 在 Expo SDK 46 中不可用
   - 影响：需要使用传统的 React Navigation 进行路由管理
   - 入口文件从 `expo-router/entry` 改为 `node_modules/expo/AppEntry.js`

2. **降级的依赖包**
   - expo-av: 13.10.x → 12.0.4
   - react-native-reanimated: 3.6.2 → 2.9.1
   - react-native-screens: 3.29.0 → 3.15.0
   - react-native-svg: 14.1.0 → 12.3.0
   - 其他相关依赖也相应降级

## 迁移步骤

### 1. 清理现有环境
```bash
# 删除 node_modules 和缓存
yarn clean-modules
# 或
rm -rf node_modules
yarn cache clean

# 清理 Android 构建
yarn clean
```

### 2. 安装新依赖
```bash
yarn install
```

### 3. 重新构建
```bash
yarn prebuild
yarn build
```

## 代码迁移注意事项

### 路由系统
由于移除了 expo-router，需要：
1. 将所有基于文件的路由改为 React Navigation
2. 更新所有 `useRouter()` 和 `Link` 组件的使用
3. 手动配置导航结构

### API 变更
某些 API 在旧版本中可能不同：
- 检查 Expo SDK 46 文档
- 测试所有使用 Expo 模块的功能
- 特别注意 expo-av、expo-linking 等模块的 API 变化

### 性能考虑
- React Native 0.69 的性能可能不如 0.73
- Reanimated 2.9 功能较 3.6 有限
- 需要重新测试动画和手势交互

## 兼容性测试清单

- [ ] 应用启动和初始化
- [ ] 视频播放功能
- [ ] 网络请求和数据加载
- [ ] 导航和路由
- [ ] 动画效果
- [ ] 手势操作
- [ ] 深度链接
- [ ] TV 遥控器支持
- [ ] 在 Android 4.4 设备上实际测试

## 已知限制

1. **Android 4.4 系统限制**
   - 不支持某些现代 Web API
   - TLS 1.2 支持有限
   - 某些 CSS 特性不可用

2. **依赖包限制**
   - 某些第三方库可能不完全支持 API 19
   - 需要逐个测试关键功能

3. **性能影响**
   - 旧版本框架性能较低
   - 包体积可能增大

## 回滚方案

如果需要回滚到原版本：
```bash
git checkout HEAD -- package.json app.json
yarn install
yarn prebuild
```

## 构建 Android 4.4 版本

使用 GitHub Actions 自动构建：
1. 进入仓库的 Actions 标签
2. 选择 "Build Android 4.4 APK" 工作流
3. 点击 "Run workflow"
4. 等待构建完成并下载 APK

生成的 APK 文件名格式：`orionTV.{version}-android44.apk`
