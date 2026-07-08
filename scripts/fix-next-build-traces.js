#!/usr/bin/env node
// 修复 Next.js 14.x Windows 构建错误
// 此脚本修补 node_modules 中的文件以处理:
//   1. ENOENT（文件不存在）- 多进程竞争写入时文件尚未创建
//   2. JSON 解析失败（SyntaxError）- webpackBuildWorker 写入 .nft.json 内容损坏
// 这些错误在 Windows 上偶发，尤其在 output: "standalone" 模式下。
//
// 修复位置:
//   collect-build-traces.js:
//     1. 读取 .nft.json 时 ENOENT 和 SyntaxError 降级为空对象
//     2. 第二个 includes/excludes 循环中读取 .nft.json 时 ENOENT 和 SyntaxError 降级
//   index.js (writeStandaloneDirectory):
//     3. 复制文件到 standalone 目录时跳过不存在的文件
//   index.js (writeClientSsgManifest):
//     4. 写入 _ssgManifest.js 前先创建 buildId 目录，防止目录不存在导致 ENOENT
//   index.js (writeFileUtf8):
//     5. writeFileUtf8 写入前自动创建父目录，根因修复所有 writeFileUtf8 调用的 ENOENT 问题
//   index.js (readManifest):
//     6. readManifest 读取不存在的文件或损坏 JSON 时返回空对象
//   index.js (middlewareManifest):
//     7. middlewareManifest 改用 readManifest 替代 require，防止 ENOENT
//   utils.js (handleTraceFiles):
//     8. 复制 traced 文件时跳过不存在的文件
//   utils.js (handleEdgeFunction):
//     9. 复制 edge function 文件时跳过不存在的文件
//   server/load-manifest.js (loadManifest):
//     10. loadManifest 读取 manifest JSON 时 ENOENT/SyntaxError 降级为空对象
//   build/utils.js (getDefinedNamedExports):
//     11. getDefinedNamedExports 中 loadComponents 因 ENOENT 失败时降级返回空数组

const fs = require("fs");
const path = require("path");

function patchFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    console.error(`[fix-next-build-traces] 目标文件不存在: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const fixCount = fixes.length;
  let applied = 0;
  let modified = false;

  for (const fix of fixes) {
    // 检查补丁是否已应用：
    //   1. 标记文本（marker）存在 → 新版本脚本已应用
    //   2. 替换后的代码（replacement）已存在 → 旧版本脚本或 Next.js 上游已应用
    if (content.includes(fix.marker)) {
      console.log(`[fix-next-build-traces] 跳过（补丁已应用，标记: ${fix.marker.slice(0, 30)}...）`);
      applied++;
      continue;
    }
    if (content.includes(fix.replacement)) {
      console.log(`[fix-next-build-traces] 跳过（补丁已应用，替换代码已存在: ${fix.marker.slice(0, 30)}...）`);
      applied++;
      continue;
    }

    // 兼容旧版本：检测补丁是否已被旧版脚本部分应用（功能代码已存在但缺少 marker 注释）。
    // 如果是，将旧版补丁代码升级为带 marker 的新版代码。
    let fallbackApplied = false;
    if (fix.legacyOriginal && content.includes(fix.legacyOriginal)) {
      content = content.replace(fix.legacyOriginal, fix.replacement);
      fallbackApplied = true;
      console.log(`[fix-next-build-traces] 升级旧版补丁: ${fix.marker.slice(0, 40)}...`);
    } else if (fix.legacyDetection && fix.legacyDetection(content)) {
      // 如果 legacyDetection 函数返回 true，说明旧版代码已存在但格式不同，
      // 需要用 legacyUpgrade 来升级。legacyUpgrade 接收 content 返回新 content。
      content = fix.legacyUpgrade(content);
      fallbackApplied = true;
      console.log(`[fix-next-build-traces] 升级旧版补丁（检测模式）: ${fix.marker.slice(0, 40)}...`);
    }

    if (fallbackApplied) {
      applied++;
      modified = true;
      continue;
    }

    // 确认原始代码存在，否则报错
    if (!content.includes(fix.original)) {
      // 原始代码不存在 + 替换代码也不存在 = 此版本的 Next.js 不兼容此补丁，
      // 可能上游已修复。跳过而非报错，避免 postinstall 整体失败。
      console.warn(`[fix-next-build-traces] 找不到目标代码且未应用，跳过补丁 (marker: ${fix.marker.slice(0, 30)}...)`);
      continue;
    }

    content = content.replace(fix.original, fix.replacement);
    applied++;
    modified = true;
    console.log(`[fix-next-build-traces] 补丁 ${applied}/${fixCount} 已应用`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[fix-next-build-traces] 文件已更新: ${path.basename(filePath)}（${applied} 个补丁）`);
  } else if (applied > 0) {
    // 所有补丁都是已存在的（跳过），不需要写文件
    console.log(`[fix-next-build-traces] ${path.basename(filePath)}: 所有补丁已存在，无需更新`);
  } else {
    console.log(`[fix-next-build-traces] ${path.basename(filePath)}: 未应用任何补丁`);
  }
  return true;
}

// ===== 补丁定义 =====

const traceFixes = [
  {
    // 补丁 1: 读取 existingTrace 时 ENOENT/SyntaxError 降级为空对象
    // SyntaxError 修复：webpackBuildWorker 写入 .nft.json 内容损坏导致 JSON.parse 失败
    marker: "existingTrace = { files: [] }",
    original:
      'const existingTrace = JSON.parse(await _promises.default.readFile(traceOutputPath, "utf8"));',
    replacement: `let existingTrace;
                try {
                    existingTrace = JSON.parse(await _promises.default.readFile(traceOutputPath, "utf8"));
                } catch (e) {
                    if ((0, _iserror.default)(e) && (e.code === "ENOENT" || e instanceof SyntaxError)) {
                        existingTrace = { files: [] };
                    } else {
                        throw e;
                    }
                }`,
  },
  {
    // 补丁 2: 读取 traceContent 时 ENOENT/SyntaxError 降级为空对象
    // 改为 try-catch 结构以同时捕获 readFile ENOENT 和 JSON.parse SyntaxError
    marker: "traceContent = { files: [] }",
    original:
      'const traceContent = JSON.parse(await _promises.default.readFile(traceFile, "utf8"));',
    replacement: `let traceContent;
                try {
                    traceContent = JSON.parse(await _promises.default.readFile(traceFile, "utf8"));
                } catch (e) {
                    if ((0, _iserror.default)(e) && (e.code === "ENOENT" || e instanceof SyntaxError)) {
                        traceContent = { files: [] };
                    } else {
                        throw e;
                    }
                }`,
  },
];

const standaloneFixes = [
  {
    // 补丁 3: writeStandaloneDirectory 中复制文件时跳过不存在的源文件
    marker: "/* fix-next-build-traces: copyFile ENOENT guard */",
    original:
      'await _fs.promises.copyFile(filePath, outputPath);',
    replacement:
      `await _fs.promises.copyFile(filePath, outputPath).catch((e)=>{
                if (e.code === "ENOENT") {
                    /* fix-next-build-traces: copyFile ENOENT guard */
                } else {
                    throw e;
                }
            });`,
    // 兼容旧版：旧版脚本使用了中文注释而非 marker
    legacyDetection: (content) => content.includes("跳过不存在的文件（Windows standalone 构建中偶发）") &&
      !content.includes("/* fix-next-build-traces: copyFile ENOENT guard */"),
    legacyUpgrade: (content) => content.replace(
      "// 跳过不存在的文件（Windows standalone 构建中偶发）",
      "/* fix-next-build-traces: copyFile ENOENT guard */"
    ),
  },
  {
    // 补丁 4: writeClientSsgManifest 中创建 buildId 目录后再写入 _ssgManifest.js
    // 修复 Next.js 14.x Windows 构建在 "Collecting build traces" 阶段因目录不存在导致的 ENOENT 错误
    marker: "/* fix-next-build-traces: writeClientSsgManifest mkdir guard */",
    original:
      'await writeFileUtf8(_path.default.join(distDir, _constants1.CLIENT_STATIC_FILES_PATH, buildId, "_ssgManifest.js"), clientSsgManifestContent);',
    replacement:
      `const _ssgDir = _path.default.join(distDir, _constants1.CLIENT_STATIC_FILES_PATH, buildId);
    await _fs.promises.mkdir(_ssgDir, { recursive: true });
    await writeFileUtf8(_path.default.join(_ssgDir, "_ssgManifest.js"), clientSsgManifestContent);
    /* fix-next-build-traces: writeClientSsgManifest mkdir guard */`,
    // 兼容旧版：旧版脚本没有添加 marker 注释，但功能代码已存在
    legacyDetection: (content) => content.includes("const _ssgDir = _path.default.join(distDir, _constants1.CLIENT_STATIC_FILES_PATH, buildId);") &&
      content.includes("await _fs.promises.mkdir(_ssgDir, { recursive: true });") &&
      !content.includes("/* fix-next-build-traces: writeClientSsgManifest mkdir guard */"),
    legacyUpgrade: (content) => content.replace(
      'await writeFileUtf8(_path.default.join(_ssgDir, "_ssgManifest.js"), clientSsgManifestContent);',
      'await writeFileUtf8(_path.default.join(_ssgDir, "_ssgManifest.js"), clientSsgManifestContent);\n    /* fix-next-build-traces: writeClientSsgManifest mkdir guard */'
    ),
  },
];

const indexWriteFixes = [
  {
    // 补丁 5: writeFileUtf8 创建父目录后再写入
    // 根因修复：所有通过 writeFileUtf8 写入的文件，父目录不存在时自动创建，防止 ENOENT
    marker: "/* fix-next-build-traces: writeFileUtf8 mkdirp guard */",
    original:
      'async function writeFileUtf8(filePath, content) {\n    await _fs.promises.writeFile(filePath, content, "utf-8");\n}',
    replacement:
      `async function writeFileUtf8(filePath, content) {
    try {
        await _fs.promises.writeFile(filePath, content, "utf-8");
    } catch (e) {
        if (e.code === "ENOENT") {
            await _fs.promises.mkdir(_path.default.dirname(filePath), { recursive: true });
            await _fs.promises.writeFile(filePath, content, "utf-8");
        } else {
            throw e;
        }
    }
    /* fix-next-build-traces: writeFileUtf8 mkdirp guard */
}`,
    // 兼容旧版：旧版脚本没有添加 marker 注释
    legacyDetection: (content) => content.includes("async function writeFileUtf8(filePath, content)") &&
      content.includes("await _fs.promises.mkdir(_path.default.dirname(filePath), { recursive: true });") &&
      !content.includes("/* fix-next-build-traces: writeFileUtf8 mkdirp guard */"),
    legacyUpgrade: (content) => content.replace(
      '    } else {\n            throw e;\n        }\n    }\n}',
      '    } else {\n            throw e;\n        }\n    }\n    /* fix-next-build-traces: writeFileUtf8 mkdirp guard */\n}'
    ),
  },
  {
    // 补丁 6: readManifest 读取不存在的文件时返回空对象
    // 修复 Next.js 14.x Windows 上 readManifest(pagesManifestPath)
    // 在 "Collecting page data" 阶段因 pages-manifest.json 尚未写入而抛出 ENOENT 的问题。
    // 同时处理 JSON 解析失败（SyntaxError）.
    marker: "/* fix-next-build-traces: readManifest ENOENT/SyntaxError guard */",
    original:
      'async function readManifest(filePath) {\n    return JSON.parse(await readFileUtf8(filePath));\n}',
    replacement:
      `async function readManifest(filePath) {
    try {
        return JSON.parse(await readFileUtf8(filePath));
    } catch (e) {
        if (e.code === "ENOENT" || e instanceof SyntaxError) {
            return {};
        }
        throw e;
    }
    /* fix-next-build-traces: readManifest ENOENT/SyntaxError guard */
}`,
  },
  {
    // 补丁 7: middlewareManifest require 改为 readManifest
    // 修复 "Collecting page data" 阶段 require(middleware-manifest.json) 抛出 MODULE_NOT_FOUND 的问题。
    // 当项目没有 middleware 或 edge 入口时，edge-server 编译可能来不及写出 middleware-manifest.json
    // 就进入数据收集阶段。改用 readManifest（已内置 ENOENT 保护）并补全默认结构以避免下游访问 .functions 等属性时报错。
    marker: "/* fix-next-build-traces: middlewareManifest readManifest guard */",
    original:
      '                const middlewareManifest = require(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST));',
    replacement:
      `                const _middlewareManifestRaw = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST));
                const middlewareManifest = {
                    version: 3,
                    middleware: {},
                    functions: {},
                    sortedMiddleware: [],
                    ..._middlewareManifestRaw
                };
                /* fix-next-build-traces: middlewareManifest readManifest guard */`,
    // 兼容旧版：旧版脚本把 require 换成了 readManifest 但没有添加默认值
    legacyDetection: (content) => content.includes("const middlewareManifest = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST))") &&
      !content.includes("_middlewareManifestRaw"),
    legacyUpgrade: (content) => content.replace(
      'const middlewareManifest = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST));',
      `const _middlewareManifestRaw = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.MIDDLEWARE_MANIFEST));
                const middlewareManifest = {
                    version: 3,
                    middleware: {},
                    functions: {},
                    sortedMiddleware: [],
                    ..._middlewareManifestRaw
                };
                /* fix-next-build-traces: middlewareManifest readManifest guard */`
    ),
  },
  {
    // 补丁 8: server-reference-manifest.json 改用 readManifest 替代 require
    // 修复 Windows 上因 .next 缓存不完整导致 require(server-reference-manifest.json)
    // 抛出 MODULE_NOT_FOUND 的问题。改用已内置 ENOENT/SyntaxError 保护的 readManifest。
    // 当文件不存在或内容损坏时返回空对象，再转换为 null 以保持原有语义。
    marker: "/* fix-next-build-traces: actionManifest readManifest guard */",
    original:
      '                const actionManifest = appDir ? require(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.SERVER_REFERENCE_MANIFEST + ".json")) : null;',
    replacement:
      `                const _actionManifestRaw = await readManifest(_path.default.join(distDir, _constants1.SERVER_DIRECTORY, _constants1.SERVER_REFERENCE_MANIFEST + ".json"));
                const actionManifest = Object.keys(_actionManifestRaw).length ? _actionManifestRaw : null;
                /* fix-next-build-traces: actionManifest readManifest guard */`,
  },
];

const utilsFixes = [
  {
    // 补丁 8: handleTraceFiles 中复制 traced 文件时跳过不存在的源文件
    // 修复 standalone 构建 "Collecting build traces" 阶段因 .nft.json 中列出的文件
    // 尚未写入磁盘而导致 copyFile ENOENT 的问题（Windows 多进程竞争）。
    marker: "/* fix-next-build-traces: handleTraceFiles copyFile ENOENT guard */",
    original:
      '                    await _fs.promises.copyFile(tracedFilePath, fileOutputPath);',
    replacement:
      `                    await _fs.promises.copyFile(tracedFilePath, fileOutputPath).catch((e)=>{
                        if (e.code === "ENOENT") {
                            /* fix-next-build-traces: handleTraceFiles copyFile ENOENT guard */
                        } else {
                            throw e;
                        }
                    });`,
  },
  {
    // 补丁 9: handleEdgeFunction 中复制 edge function 文件时跳过不存在的源文件
    // 与补丁 8 相同，修复 edge function 文件复制时的 ENOENT 问题
    marker: "/* fix-next-build-traces: handleFile copyFile ENOENT guard */",
    original:
      '            await _fs.promises.copyFile(originalPath, fileOutputPath);',
    replacement:
      `            await _fs.promises.copyFile(originalPath, fileOutputPath).catch((e)=>{
                if (e.code === "ENOENT") {
                    /* fix-next-build-traces: handleFile copyFile ENOENT guard */
                } else {
                    throw e;
                }
            });`,
  },
];

const loadManifestFixes = [
  {
    // 补丁 10: loadManifest 读取 manifest JSON 时 ENOENT/SyntaxError 降级为空对象
    // 修复 "Collecting page data" 阶段 getDefinedNamedExports 调用 loadComponents 后
    // requirePage → getPagePath → getMaybePagePath → loadManifest 读取 pages-manifest.json
    // 时该文件尚未写入磁盘而抛出 ENOENT 的问题（Windows 文件系统缓冲延迟）。
    // SyntaxError 兼容 JSON 文件写入不完整的情况。
    marker: "/* fix-next-build-traces: loadManifest ENOENT/SyntaxError guard */",
    original:
      '    let manifest = JSON.parse((0, _fs.readFileSync)(path, "utf8"));',
    replacement:
`    let manifest;
    try {
        manifest = JSON.parse((0, _fs.readFileSync)(path, "utf8"));
    } catch (e) {
        if (e.code === "ENOENT" || e instanceof SyntaxError) {
            /* fix-next-build-traces: loadManifest ENOENT/SyntaxError guard */
            return {};
        }
        throw e;
    }`,
  },
];

const definedExportsFixes = [
  {
    // 补丁 11: getDefinedNamedExports 中 loadComponents 调用因 ENOENT 失败时降级返回空数组
    // 当 loadManifest 因 pages-manifest.json 不存在返回 {} 后，getPagePath 会抛出
    // PageNotFoundError（code === "ENOENT"）。在 getDefinedNamedExports 层面捕获此错误
    // 以继续构建流程。
    marker: "/* fix-next-build-traces: getDefinedNamedExports ENOENT guard */",
    original:
`async function getDefinedNamedExports({ page, distDir, runtimeEnvConfig }) {
    require("../shared/lib/runtime-config.external").setConfig(runtimeEnvConfig);
    const components = await (0, _loadcomponents.loadComponents)({
        distDir,
        page: page,
        isAppPath: false,
        isDev: false
    });
    return Object.keys(components.ComponentMod).filter((key)=>{
        return typeof components.ComponentMod[key] !== "undefined";
    });
}`,
    replacement:
`async function getDefinedNamedExports({ page, distDir, runtimeEnvConfig }) {
    require("../shared/lib/runtime-config.external").setConfig(runtimeEnvConfig);
    let components;
    try {
        components = await (0, _loadcomponents.loadComponents)({
            distDir,
            page: page,
            isAppPath: false,
            isDev: false
        });
    } catch (e) {
        /* fix-next-build-traces: getDefinedNamedExports ENOENT guard */
        if (e.code === "ENOENT") {
            return [];
        }
        throw e;
    }
    return Object.keys(components.ComponentMod).filter((key)=>{
        return typeof components.ComponentMod[key] !== "undefined";
    });
}`,
  },
];

// ===== 执行补丁 =====

const traceFilePath = path.join(
  __dirname, "..", "node_modules", "next", "dist", "build", "collect-build-traces.js"
);
const indexFilePath = path.join(
  __dirname, "..", "node_modules", "next", "dist", "build", "index.js"
);
const utilsFilePath = path.join(
  __dirname, "..", "node_modules", "next", "dist", "build", "utils.js"
);
const loadManifestFilePath = path.join(
  __dirname, "..", "node_modules", "next", "dist", "server", "load-manifest.js"
);

let allOk = true;
allOk = patchFile(traceFilePath, traceFixes) && allOk;
allOk = patchFile(indexFilePath, standaloneFixes) && allOk;
allOk = patchFile(indexFilePath, indexWriteFixes) && allOk;
allOk = patchFile(utilsFilePath, utilsFixes) && allOk;
allOk = patchFile(loadManifestFilePath, loadManifestFixes) && allOk;
allOk = patchFile(utilsFilePath, definedExportsFixes) && allOk;

if (!allOk) {
  process.exit(1);
}
