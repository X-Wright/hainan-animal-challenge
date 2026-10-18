# 海南动物科学知识大挑战

为 2026 年中国农业大学动物嘉年华海南特色畜禽展台制作的互动科普小游戏。Vue 3 + Vite，纯前端运行，无需账号、后台或数据库。题库和动物插画均随项目提供，运行时不依赖在线图片、字体或 API。

现场目标设备为 **OPPO Pad 4 Pro，仅横屏展示和验收**。该设备官方屏幕参数为 **3392×2400 物理分辨率、7:5 比例**（[OPPO 官方产品页](https://store.oppo.com/cn/app/product/index?skuId=33979)）。浏览器的 CSS 视口会受设备像素比、浏览器工具栏和缩放影响，并不等于物理分辨率；界面使用响应式布局，不将 3392×2400 硬编码为网页尺寸。

## 已实现

- 鸡、鸭、猪、羊、鹅五个独立关卡，完整 25 道题，进入关卡随机打乱题目顺序。
- 单选题一次作答，答对加 20 分；立即显示正误、正确答案和科普解释。
- 每关 5 题，满分 100 分；成绩、答对题数、四档称号、重新挑战和返回首页。
- 统一风格的本地 SVG 动物插画，海南热带主题、页面与题目过渡、答题反馈、结果彩纸与分数动画。
- 针对 OPPO Pad 4 Pro 横屏展示优化的响应式布局；尊重系统“减少动态效果”设置。本项目不以竖屏展示为验收目标。
- 可见的全屏入口，浏览器不支持时提供提示；音效默认关闭，可手动开启。
- 页面包含“中国农业大学动物科学技术学院 · 中国农业大学三亚研究院”标识。

## 安装与本地运行

使用 Node.js **22.12 或更新的 22.x 版本**，并安装 npm。首次在项目目录执行：

```sh
npm install
npm run dev
```

在终端显示的本机地址打开网页，默认是 `http://localhost:5173/`。已有锁文件时可使用 `npm ci` 做可复现安装。

### 展台平板通过局域网访问

已提供构建产物时，电脑只需安装 Node.js，**无需安装项目依赖**，双击根目录的 **`双击启动网站.cmd`**，或在项目目录运行：

```sh
npm run serve
```

`scripts/serve.mjs` 使用 Node.js 内置 HTTP 服务提供 `dist/`，默认端口为 **4173**。电脑与 OPPO Pad 4 Pro 连接同一个 Wi-Fi，将终端输出的平板访问地址（例如 `http://192.168.1.10:4173/`）在平板浏览器横屏打开。地址以电脑实际输出为准；不要在平板输入 `localhost`。也可直接执行 `node scripts/serve.mjs`；如需更换端口，执行 `node scripts/serve.mjs 4174`。

如果尚无 `dist/`，请先执行 `npm install`、`npm run build`。开发调试时可用 `npm run dev -- --host 0.0.0.0`，其默认端口为 5173；展台使用已构建的 `dist/` 服务。

Windows 防火墙若询问，允许 Node.js 在当前可信的专用网络上访问。访客 Wi-Fi 如启用了设备隔离，需改用允许设备互访的网络。电脑需持续开机且终端保持运行。正式展览优先使用 HTTPS 部署地址，局域网方案可作为现场备用。

## 修改题目和素材

题库位于 **`src/data/questions.js`**，`questionBank` 按动物 ID 分组：`chicken`、`duck`、`pig`、`goat`、`goose`。`animals` 提供动物名称等元数据。每题格式为：

```js
{
  id: 'chicken-1', // 全题库唯一 ID
  question: '母鸡没有公鸡也能下蛋吗？',
  options: ['可以', '不可以', '只有夏天可以'],
  answer: 0, // 数组下标：A=0、B=1、C=2
  explanation: '母鸡不需要公鸡也可以产蛋，但没有受精的鸡蛋无法孵出小鸡。',
}
```

当前界面和计分规则按 **每关 5 题、每题 3 个选项、每题 20 分** 设计，请保持此结构。修改正确答案后同步更新 `tests/questions.test.js` 的题库答案验收表，运行测试并重新构建。

动物素材位于 **`public/animals/`**，文件名与动物 ID 对应，例如 `chicken.svg`。替换时保持文件名，建议保留 SVG 的 `viewBox`，使用本地素材以免影响现场网络环境下的展示。

主要文件：

```text
src/App.vue                 首页、答题、成绩与交互
src/game.js                 随机出题、作答防重、计分、进度与称号
src/data/questions.js       独立题库与动物资料
src/components/Icon.vue     轻量 SVG 图标
src/style.css               主题、响应式布局与动画
public/animals/             五种本地动物 SVG
tests/game.test.js          核心游戏逻辑验收
tests/questions.test.js     题库数量、格式、唯一性与答案验收
scripts/export-offline.mjs  将构建产物导出为离线单文件 HTML
scripts/serve.mjs           无第三方依赖的 dist 本地 HTTP 服务
双击启动网站.cmd            Windows 本地服务启动入口
vite.config.js              Vite 配置，使用相对资源路径
```

## 测试、构建与预览

```sh
npm test
npm run build
npm run preview
```

`npm test` 使用 Node.js 内置测试运行器，无需安装额外测试框架。覆盖题库数量和答案、防止重复计分、未答禁止前进、非法答案、随机打乱保留题目，以及五个关卡全对 100 分和全错 0 分。构建成功后，**`dist/` 就是可直接部署到静态托管服务的完整站点**。

`npm run preview` 默认在 `http://localhost:4173/` 提供构建产物，可使用同 Wi-Fi 的平板访问电脑的实际 Network 地址。预览服务器适合验收和临时现场备用，长期在线使用静态托管服务。

### 无互联网环境

**方式一：离线单文件。** 在完成构建后运行：

```sh
npm run build
npm run offline
```

`npm run offline` 调用 `scripts/export-offline.mjs`，将构建后的 CSS、JavaScript 和五种动物 SVG 全部内联，生成根目录文件 **`海南动物科学知识大挑战-离线版.html`**。可将这个 HTML 文件拷贝到平板，尝试通过浏览器打开，无需同时拷贝素材文件夹。修改源代码或素材后，请重新构建并重新导出，避免使用旧版离线文件。

离线单文件的浏览器运行结果尚待验证，**Android 文件管理器能否将 HTML 交给目标浏览器打开，以及 OPPO Pad 4 Pro 上的 `file://` 支持，需要在实机确认**。如果文件打开方式受到系统或浏览器限制，使用下面的局域网方案。

**方式二：本地 HTTP 服务。** 构建后的页面、代码、题库和插画均在 `dist/` 内。保留 `dist/` 与 `scripts/serve.mjs` 的相对目录结构，在装有 Node.js 的电脑上运行 `npm run serve`，或双击 `双击启动网站.cmd`；该服务不依赖 `node_modules/`。电脑和平板连接同一个可互访的本地 Wi-Fi 即可使用，无需互联网。普通 `dist/index.html` 请通过此 HTTP 服务访问，直接双击可能被浏览器的模块安全策略拦截。

这不是安装型 PWA，未包含 Service Worker 离线缓存；在线部署地址首次加载仍需要网络。运行时不向后台写入数据，刷新页面会开始新的游戏。

## 部署到 Vercel

项目包含 `vercel.json`，配置了 `npm run build` 和 `dist` 输出目录。

1. 将完整源代码（包括 `package-lock.json`）上传到自己的 GitHub 仓库。
2. 在 Vercel 新建项目并导入该仓库，若仓库含多个项目，将本项目目录设为 Root Directory。
3. Framework Preset 选择 Vite，Build Command 为 `npm run build`，Output Directory 为 `dist`，Node.js 使用 22.x。
4. 点击 Deploy，等待部署成功，用返回的 HTTPS 地址在平板横屏浏览器打开。

后续推送修改会触发新的部署。也可将 `dist/` 上传到支持预构建静态文件的托管服务。仓库中另提供 `netlify.toml`，Netlify 的构建命令同为 `npm run build`，发布目录为 `dist`。

## 部署到 GitHub Pages

已提供 **`.github/workflows/deploy.yml`**，推送到 `main` 时执行安装、测试、构建和发布。`vite.config.js` 的 `base: './'` 使站点资源适用于仓库子路径。

1. 在 GitHub 创建仓库，将本项目内容放到仓库根目录，并推送到 `main`。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 在 **Actions** 页面查看 “Deploy to GitHub Pages” 工作流。如需立即部署，可用 **Run workflow** 手动启动。
4. 等待构建和部署均成功，在 **Settings → Pages** 或工作流部署结果中打开站点 URL。

如果默认分支不是 `main`，修改工作流的 `on.push.branches`。若本项目位于仓库子目录，需相应调整工作流的工作目录、锁文件路径和上传目录，或将本项目单独作为仓库。

**目前 Sites 托管连接出错，尚未实际部署上线。** 本交付包含部署配置与可构建源代码，`dist/` 可直接用于静态部署；只有托管平台显示部署成功并返回可访问地址后才算上线。

## 展前快速验收

1. 使用 **OPPO Pad 4 Pro 横屏**打开站点，确认五个动物入口首屏可见。按平板浏览器的实际 CSS 视口检查布局，不把 3392×2400 物理像素当作网页视口；无需进行手机或平板竖屏验收。
2. 进入每个关卡，确认共 5 题；分别尝试答对、答错和快速连点，检查解析、下一题和得分。
3. 完成一轮，确认称号、分数、答对题数；检查重新挑战和返回动物选择。
4. 检查全屏与退出全屏。部分平板浏览器限制全屏 API，普通浏览器窗口仍可完整操作。
5. 按现场需要开启音效，确认默认静音；检查浏览器缩放为 100%，避免过大的系统字体影响首屏布局。
6. 在平板实测 `海南动物科学知识大挑战-离线版.html` 的文件打开方式和完整答题流程；同时备好本地 `dist/` HTTP 服务。若之后完成线上部署，再将正式地址加入书签。

本仓库的自动化测试针对题库和游戏状态逻辑；实际设备触摸手感、音量和浏览器全屏能力请按以上清单在展前确认。
