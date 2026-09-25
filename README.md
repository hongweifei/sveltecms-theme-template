# SvelteCMS 主题模板

从零到发布一个 SvelteCMS 主题的起点。  
**clone即用，一条命令起一切**：
框架自动装配进仓内 `.sveltecms/`（gitignore，不用管），`pnpm dev` 起完整站点并热挂载你的主题。

## 三步上手

```bash
# 1. 改名为你的主题（config.name / 显示名 / npm 包名一并替换）
node scripts/rename.mjs aurora

# 2. 装本仓依赖
pnpm install

# 3. 起！首次自动 clone 框架并装配 .sveltecms/（慢几分钟，之后增量），
#    然后完整站点 + 你的主题，改动秒级热更新
pnpm dev
```

打开 http://localhost:5180 ——进 `/admin` 首次注册用户即管理员，侧栏
「主题」里选中 `aurora` 并激活。之后改 `theme/` 下代码：布局、模板、loader
都随模块图 HMR 即时生效。

还要做：中文文案与 `label`/`description`/`author` 自行改（rename 脚本刻意不动
自然语言）；用不到的示例删掉（每个示例都有 `[示例·…]` 注释标记）。

## 仓库结构

```
theme/             主题源码（唯一事实源；发布 zip 时内容直接落 zip 根）
  theme.config.ts  声明入口（布局/模板/区块/设置/定制器/文案/依赖全在这接线）
  theme.customizer.ts  定制器面板（引用 settings 字段 key）
  layouts/         default（带页头页脚 + 前台插槽挂点）· blank（落地页）
  templates/       home / list / detail / 404，各配一个 loader
    loader-utils.ts  分页与集合选择的共用小helper
  blocks/          动态区区块的渲染件
  locales/         zh-CN / en（themeLabels，必须 default 导出）
  theme.test.ts    契约自检（改名/加设置项后跑一次即发现问题）
scripts/
  rename.mjs       一键改名
  ensure-host.mjs  宿主自动装配（clone + install + 生成层补齐 + 同步主题）
  sync-watch.mjs   theme/ 热同步（pnpm dev 的 watch 侧）
  package.mjs      打发布 zip + SHA-256
.sveltecms/        框架 checkout（自动创建，gitignore，勿手改）
```

## 常用命令

```bash
pnpm dev          # 起完整站点(5180) + 主题热同步
pnpm test         # vitest（契约自检）
pnpm check        # svelte-check 类型门禁——唯一裁判
pnpm package      # dist/<name>-<version>.zip + SHA-256
```

宿主版本控制：默认 clone `master`；`SVELTECMS_REF=<分支/标签>` 锁版本；
`SVELTECMS_HOST_PULL=1 pnpm ensure` 刷新到上游最新（默认锁 clone 时 commit，
行为可复现）；`SVELTECMS_REPO=<git URL>` 换框架源。

## 语法提示（IDE 零配置可用）

打开本仓的 VS Code / Cursor 应**没有任何红线**——类型链路是刻意设计的：

| 机制 | 文件 | 作用 |
| --- | --- | --- |
| 宿主类型层 | `tsconfig.json`（extends `.sveltecms/.svelte-kit/tsconfig.json` + include 宿主 `app.d.ts`） | `ThemeConfig` / `TemplateLoaderContext` / `TemplateCMSAPI` 全类型可跳读 |
| Svelte 语言服务 | `svelte.config.js`（runes: true + vitePreprocess） | `.svelte` 里 `$state/$derived/$props` 正确解析，按 Svelte 5 写 |
| loader↔组件绑定 | `theme.config.ts` 里逐条 `ThemeTemplateDeclaration<XxxData>` | 组件声明了 loader 不提供的必填 prop 时**编译即错** |
| TS 版本对齐 | 本仓 `typescript`（`pnpm check` 同版本） | 提示与门禁同源 |

**主题直接 `import type … from '$lib/cms/types/theme'`**，不需要额外的类型出口
包——主题源码会被同步进宿主的 `data/themes/<name>/`，本就在宿主项目根内，别名
天然可解析。代价：脱离 `.sveltecms/` 宿主检出时本仓无法单独 typecheck，
`pnpm check` 已前置 `ensure` 自动兜住。

## 主题能力清单（theme.config.ts 的字段）

| 字段 | 一行说明 | 模板示例 |
| --- | --- | --- |
| `layouts` / `defaultLayout` | 布局表；模板可用 `layout` 指定，缺省回落 defaultLayout | ✅ 两个 |
| `templates[]` | `type` 决定 URL 语义（home/list/detail/search/page/404 内置，可自定义 + `match`）；`loader` 供数据 | ✅ 四个 |
| `templates[].match` | `{ pattern, priority }` 控制路由候选顺序；loader 抛 NotFoundError 即「拒单」试下一个 | 注释示例 |
| `blocks` | 动态区区块渲染件，键须与 CTB 组件名一致 | ✅ |
| `settings` | 站长设置（9 种字段类型 + `cssVar` 直连 CSS 变量 + `source` 由平台现算下拉项） | ✅ |
| `customizer` | 把设置分面板做实时预览 | ✅ |
| `locales` | 前台文案，注入为 `themeLabels` | ✅ |
| `menus` | 主题可贡献菜单项（站长自持导航数据，通常不需要） | 未示例 |
| `assets` | 当前仅声明性字段——样式/脚本由布局自己 import（默认主题即此实践） | 未示例 |
| `requires` | `collections` 校验集合存在；`plugins` 要求插件已启用 | ✅ |
| 生命周期 | `onActivate` / `onDeactivate` / `onSettingsChange` 已接线 | 未示例 |

模板可用的运行时 API：`ctx.cms.content`（query / findById / findBySlug /
findRelated）、`ctx.cms.collections`、`ctx.cms.menus`、`ctx.cms.media`、
`ctx.cms.search`、`ctx.cms.i18n`、`ctx.cms.getTerms*`；另有 `settings`、
`params`、`query`、`locale`、`isAdmin`、`origin`、`user`。

## 硬约束（违反 = 不生效，且大多不报错）

- **目录名 = `config.name`**：宿主注册表 `collectThemes()` 拒收不一致者（渲染端
  `ThemePage` 按 `/data/themes/<name>/` 前缀反查组件模块）。不一致的后果是主题
  注册得上、后台看得见、能激活，一渲染却报 not found。本模板的 ensure-host 与
  package 脚本都按 `config.name` 落地，所以你自己发布时也照这条命名。
- **装了不等于生效，必须重新构建**：主题组件是编译期 eager glob（SSR 直出与
  hydration 一致性的前提）。`pnpm add` 只改磁盘，不进 bundle；重启 `node build`
  也拿不到。所以"安装主题"= 加依赖 + 重新构建。
- **`theme.config.ts` 顶层必须纯声明**：前台要 eager 静态加载全部主题，顶层抛
  异常会让前台页面直接报错（逻辑放 loader / 生命周期钩子）。
- **拒单用 `throw NotFoundError`，不要返回空数据**：返回空会被渲染成 200 的
  「未找到」页（软 404，SEO 缺陷）；抛错才让路由器回退、最终输出真实 404。
- **模板声明要显式标注 `Data`**：省略即退回 `any`，loader↔组件约束静默消失。
  同理，检查必须是 `svelte-check`——裸 `tsc` 看不见 `.svelte` 的 props，一样不报错。
- **`locales` 必须 `export default` 扁平 map**：类型已收紧为 `Promise<{ default: ... }>`。
- **`requires.plugins` 是硬的**：依赖插件未启用时主题不可激活/不可分配，渲染期
  转 503；被依赖的插件停用时会被拒绝。

## 发布与上架

两条交付路，产物同源（都按 `theme.config.ts` 的 `name` 认身份）：

```bash
pnpm package      # dist/<name>-<version>.zip + SHA-256
pnpm npm-pkg      # dist/npm/（摊平发布物）→ 打印 npm publish 命令与宿主 shim 写法
git tag v0.1.0 && git push --tags   # CI：挂 Release 资产；配了 NPM_TOKEN 才发 npm
```

`dist/npm/` 是**生成的**，`package.json` 不带 `private`——所以模板自身可以一直
`private: true`（防误发模板），作者不用为了发布去改它。护栏：包名仍是
`sveltecms-theme-template` 或不以 `sveltecms-theme-` 开头时直接拒绝生成，
因为宿主按 `sveltecms-plugin-*` / `data/themes/<name>` 那套约定认包。

### 路 1：zip（后台上传）

安装器会把落地目录名**归一到 `config.name`**（zip 文件名只是解析失败时的回退），
所以不必纠结文件名。装完后台会明示：**要重新构建才生效**。

### 路 2：npm 包

`pnpm add sveltecms-theme-<name>` 之后必须在宿主补一行 shim——宿主收录主题靠
`import.meta.glob('/data/themes/*/theme.config.ts')`，`node_modules` 不在匹配范围：

```ts
// data/themes/<name>/theme.config.ts
export { default } from 'sveltecms-theme-<name>';
```

`pnpm npm-pkg` 会把这三行的确切路径与内容打印出来。**目录名必须等于
`config.name`**，否则宿主注册表 `collectThemes()` 拒收（渲染端按
`/data/themes/<name>/` 前缀反查组件模块）。补完同样要重新构建。

> **样式限制（实测，别踩）**：Tailwind 的自动源检测跳过 `node_modules` 与 `.gitignore`
> 里的路径，所以包内 `.svelte` 写的 utility 类**不会生成任何 CSS**——组件本身确实
> 进了 bundle，表现却是"装上却静默没样式"。
>
> 试过在宿主 `src/app.css` 加 `@source '../node_modules/sveltecms-theme-*/**/*.svelte'`
> 纳源，**未生效**：A/B 构建里符号链接包与普通 `node_modules/<dir>` 两种探针的类名
> 在产物 CSS 中均 0 命中（同批 CSS 里 `text-sm` 有 56 处，排除 grep 目标错误），
> 尽管 Tailwind v4 文档称 `@source` 正是用来覆盖 `node_modules` 排除的。
>
> 因此现状是：**主题自带 CSS**。本模板的布局/模板一律用 Svelte 作用域样式，
> 宿主设计令牌通过 `var(--color-*)` 取用（这些变量由宿主 `:root` 提供，不受
> Tailwind 扫描范围影响）。要用宿主的 utility 类，请把主题以目录形式放进宿主的
> `data/themes/`（zip 安装即如此，那条路在扫描范围内，样式正常）。

版本号唯一事实源 = `theme/theme.config.ts` 的 `version`（`package.mjs` 与
`prepare-npm-pkg.mjs` 都从它读，不另维护第二处）。

## 疑难

- **改了主题不生效** → 确认宿主 dev 在跑且 `.sveltecms/data/themes/<name>/` 有
  你的运行副本（`pnpm ensure` 手动同步一次）；改 `config.name` 后需重启 dev
- **`pnpm check` 报 `$lib` 解析失败** → `pnpm ensure` 重装配（宿主缺生成层）
- **主题列表看不到新主题** → 需重启 dev / 重新构建（编译期 glob 快照）
- **想参考完整实战** → 宿主仓内置的 `data/themes/default`（Linux.do 风格，
  全部扩展点都在真实需求里打磨过）
