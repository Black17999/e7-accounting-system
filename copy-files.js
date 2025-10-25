const fs = require('fs-extra');
const path = require('path');

console.log('🔨 开始构建 public 目录...\n');

try {
  // 清空并重建public目录
  fs.emptyDirSync('public');
  console.log('✅ 已清空 public 目录');

  // 要复制的文件列表
  const files = [
    'index.html',
    'auth.html',
    'reset-password.html',
    'splash.html',
    'style.css',
    'splash.css',
    'main-modular.js',
    'manifest.json',
    'sw.js'
  ];

  // 复制文件
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copySync(file, path.join('public', file));
      console.log(`✅ 已复制: ${file}`);
    } else {
      console.warn(`⚠️  文件不存在: ${file}`);
    }
  });

  // 复制目录
  const dirs = ['assets', 'components', 'modules'];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.copySync(dir, path.join('public', dir));
      console.log(`✅ 已复制目录: ${dir}`);
    } else {
      console.warn(`⚠️  目录不存在: ${dir}`);
    }
  });

  console.log('\n🎉 构建完成！public 目录已就绪\n');
} catch (err) {
  console.error('❌ 构建失败:', err);
  process.exit(1);
}