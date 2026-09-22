import type { DeployConfig, VaultConfig } from './shared/types.ts'

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

/**
 * 发布配置：文本进 content/（提交进仓库），图片进 R2。
 *
 * 为什么是这个边界：见 docs/SPEC.md 的「九、上云」。
 * 一句话版本——文本要进 git（你要能 diff 自己的笔记），图片不进 git（732 MB 放不进任何仓库），
 * 而线上的站点壳由 Cloudflare Workers Assets 托管、图片由 R2 出。
 *
 * 凭证（R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY）放 `.env.local`，
 * 不在这个文件里。这个文件是要提交的。
 */
export const deploy: DeployConfig = {
  contentDir: 'content',

  /**
   * 只有这些扩展名会被当成"资源"上传。**但真正的上传集合是笔记正文引用到的那些图**
   * ——这个白名单只是第二道闸：白名单之外的东西（字体、视频、yarn.lock）一律不传。
   *
   * 当前的决定是「严格只传图片」。想放开字体就把 '.ttf' / '.woff2' 加进来，
   * 想放开视频就加 '.mp4' / '.mp3'——上传集合会自动跟着变，不用改代码。
   */
  assetExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.bmp', '.avif'],

  /**
   * 不想上传的目录前缀（section 内相对路径，比如 '杂项/个人网站'）。
   * 默认空：当前没有任何目录需要排除。
   */
  assetExclude: [],

  /** 这些不是内容，是构建产物，同步进快照时会跳过 */
  contentSkipFiles: ['package-lock.json', 'yarn.lock'],

  r2: {
    /**
     * 项目用的桶。2026-09-22 的实际情况：账号里唯一的桶是 `file-bucket`，
     * 它同时装着用户的私人文件（pdf_files/、印制电路工/、以及几个 yaml 配置）。
     *
     * MioNote 在桶里只用各 section 的 id 作前缀（web-frontend/、interview/、soft-exam/、
     * csharp/、japanese/），不会覆盖别人的对象；`--prune` 也只删自己上传过的（从账本出发，
     * 不列桶）。但**混用一个桶的代价是真的**：想单独锁域名或清理时会互相牵连。
     * 哪天想分开，建个新桶、把这里改掉、重跑 publish 就行（域名变了会自动重传）。
     */
    bucket: 'file-bucket',
    /**
     * 桶里的文件夹。MioNote 的 1078 张图会放在 `file-bucket/MioNote/…` 下，
     * 而不是铺在桶根和你的 pdf_files/、印制电路工/、几个 yaml 混在一起。
     *
     * 改这个值等于换一套 key：下次 `bun run publish` 会把所有图传到新前缀下
     * （旧的那些会被认成"已不在上传集合"，加 --prune 才删）。
     */
    prefix: 'MioNote',
    /**
     * 公共访问域名。`.env.local` 里的 R2_PUBLIC_BASE 优先于这里——
     * 这里写的是"没有本地配置时用它"，好在 CI 上也能构建。
     */
    publicBase: 'https://cdn.tak1na.cn',
  },
}
