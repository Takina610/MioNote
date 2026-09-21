import type { VaultConfig } from './shared/types.ts'

/**
 * 你的笔记从哪儿来。
 *
 * 加一个新笔记文件夹＝在这里加一行。修改后 Vite 会自动重启，不用手改别的地方。
 *
 * publish 的三个值：
 *   'public'  可以发布到云端，任何人可读
 *   'private' 可以发布到云端，但需要登录才能读（这一版还没实现鉴权）
 *   'never'   永不发布。只在本地阅读器里读得到
 *
 * 默认值是 'never'：新加文件夹时如果你忘了写 publish，它不会被发布出去。
 * 反过来的默认（默认公开 + 黑名单）意味着某天新建一个文件夹就会在没人察觉的情况下上云。
 */
export const vault: VaultConfig = {
  sections: [
    {
      id: 'web-frontend',
      name: 'Web 前端',
      root: 'D:/UniversityCodeLearning/Web Front-end development',
      publish: 'public',
      icon: 'folder-views',
      note: '黑马课程练习与笔记；659 个 html 是可运行的 demo',
    },
    {
      id: 'interview',
      name: '面试',
      root: 'D:/UniversityCodeLearning/面试',
      publish: 'public',
      icon: 'folder-target',
      note: 'Redis / MySQL / JVM 等八股，每篇是一串问答',
    },
    {
      id: 'soft-exam',
      name: '软考',
      root: 'D:/UniversityCodeLearning/软考',
      publish: 'public',
      icon: 'folder-docs',
      note: '988 张配图，体量最大',
    },
    {
      id: 'csharp',
      name: 'C#',
      root: 'D:/WorkCodeLearning/Csharp',
      publish: 'public',
      icon: 'folder-src',
      note: '笔记在 笔记/ 下，ConsoleApp1 是练习工程',
    },
    {
      id: 'japanese',
      name: '日语',
      root: 'D:/WorkCodeLearning/JapenseStu',
      publish: 'public',
      icon: 'folder-i18n',
      note: '按课文顺序，单词篇 + 语法篇成对出现',
    },
    {
      id: 'xray',
      name: 'Xray',
      root: 'D:/WorkCodeLearning/Xray',
      publish: 'never',
      icon: 'folder-keys',
      note: '含 SSH 私钥与真实服务器参数，绝不发布',
    },
    {
      id: 'personal',
      name: '个人发展',
      root: 'D:/WorkCodeLearning/PersonalDev',
      publish: 'never',
      icon: 'folder-home',
      note: '简历与私人材料，绝不发布',
    },
  ],

  // 这些目录名一旦匹配就整棵跳过，不会出现在内容树里
  ignoreDirs: [
    '.git',
    'node_modules',
    'bin',
    'obj',
    '.vs',
    '.vscode',
    '.idea',
    'dist',
    'build',
    '.next',
    '.nuxt',
    '.cache',
    '__pycache__',
    '.venv',
    'vendor',
  ],

  // Web 前端目录下有 22 个脚手架自带的 README，全是模板说明，不是笔记
  ignoreFiles: ['README.md', 'desktop.ini', 'Thumbs.db'],

  demoExtensions: ['.html', '.htm'],

  codeExtensions: [
    '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.vue',
    '.css', '.scss', '.less', '.json', '.yaml', '.yml',
    '.txt', '.xml', '.ini', '.sh', '.ps1', '.py',
    '.java', '.cs', '.sql', '.md',
  ],

  maxCodeBytes: 512 * 1024,
}
