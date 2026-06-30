#!/usr/bin/env node
// 修复 Next.js 14.x Windows 构建 ENOENT 错误
// 此脚本修补 node_modules 中的文件以处理 ENOENT（文件不存在）错误。
// 这些错误在 Windows 上 output: "standalone" 模式下偶发。
//
// 修复位置:
//   collect-build-traces.js:
//     1. 读取 .nft.json 的 catch 中增加 ENOENT 降级
//     2. 第二个 includes/excludes 循环中读取 .nft.json 的 catch 中增加 ENOENT 降级
//   index.js (writeStandaloneDirectory):
//     3. 复制文件到 standalone 目录时跳过不存在的文件
//   index.js (writeClientSsgManifest):
//     4. 写入 _ssgManifest.js 前先创建 buildId 目录，防止目录不存在导致 ENOENT
//   index.js (writeFileUtf8):
//     5. writeFileUtf8 写入前自动创建父目录，根因修复所有 writeFileUtf8 调用的 ENOENT 问题

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

  for (const fix of fixes) {
    // 检查补丁是否已应用：标记文本存在 → 跳过
    if (content.includes(fix.marker)) {
      console.log(`[fix-next-build-traces] 跳过（补丁已应用，标记: ${fix.marker.slice(0, 30)}...）`);
      applied++;
      continue;
    }

    // 确认原始代码存在，否则报错
    if (!content.includes(fix.original)) {
      console.error(`[fix-next-build-traces] 找不到目标代码，跳过补丁 (marker: ${fix.marker.slice(0, 30)}...)`);
      continue;
    }

    content = content.replace(fix.original, fix.replacement);
    applied++;
    console.log(`[fix-next-build-traces] 补丁 ${applied}/${fixCount} 已应用`);
  }

  if (applied > 0) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`[fix-next-build-traces] 文件已更新: ${path.basename(filePath)}（${applied} 个补丁）`);
  } else {
    console.log(`[fix-next-build-traces] ${path.basename(filePath)}: 所有补丁已存在，无需更新`);
  }
  return true;
}

// ===== 补丁定义 =====

const traceFixes = [
  {
    // 补丁 1: 读取 existingTrace 时 ENOENT 降级为空对象
    marker: "existingTrace = { files: [] }",
    original:
      'const existingTrace = JSON.parse(await _promises.default.readFile(traceOutputPath, "utf8"));',
    replacement: `let existingTrace;
                try {
                    existingTrace = JSON.parse(await _promises.default.readFile(traceOutputPath, "utf8"));
                } catch (e) {
                    if ((0, _iserror.default)(e) && e.code === "ENOENT") {
                        existingTrace = { files: [] };
                    } else {
                        throw e;
                    }
                }`,
  },
  {
    // 补丁 2: 读取 traceContent 时 ENOENT 降级为空 JSON
    marker: 'return \'{"files":[]}\'',
    original:
      'const traceContent = JSON.parse(await _promises.default.readFile(traceFile, "utf8"));',
    replacement: `const traceContent = JSON.parse(await _promises.default.readFile(traceFile, "utf8").catch((e)=>{
                if ((0, _iserror.default)(e) && e.code === "ENOENT") {
                    return '{"files":[]}';
                }
                throw e;
            }));`,
  },
];

const standaloneFixes = [
  {
    // 补丁 3: writeStandaloneDirectory 中复制文件时跳过不存在的源文件
    marker: "copyFile ENOENT guard",
    original:
      'await _fs.promises.copyFile(filePath, outputPath);',
    replacement:
      `await _fs.promises.copyFile(filePath, outputPath).catch((e)=>{
                if (e.code === "ENOENT") {
                    // 跳过不存在的文件（Windows standalone 构建中偶发）
                } else {
                    throw e;
                }
            });`,
  },
  {
    // 补丁 4: writeClientSsgManifest 中创建 buildId 目录后再写入 _ssgManifest.js
    // 修复 Next.js 14.x Windows 构建在 "Collecting build traces" 阶段因目录不存在导致的 ENOENT 错误
    marker: "writeClientSsgManifest mkdir guard",
    original:
      'await writeFileUtf8(_path.default.join(distDir, _constants1.CLIENT_STATIC_FILES_PATH, buildId, "_ssgManifest.js"), clientSsgManifestContent);',
    replacement:
      `const _ssgDir = _path.default.join(distDir, _constants1.CLIENT_STATIC_FILES_PATH, buildId);
    await _fs.promises.mkdir(_ssgDir, { recursive: true });
    await writeFileUtf8(_path.default.join(_ssgDir, "_ssgManifest.js"), clientSsgManifestContent);`,
  },
];

const indexWriteFixes = [
  {
    // 补丁 5: writeFileUtf8 创建父目录后再写入
    // 根因修复：所有通过 writeFileUtf8 写入的文件，父目录不存在时自动创建，防止 ENOENT
    marker: "writeFileUtf8 mkdirp guard",
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

let allOk = true;
allOk = patchFile(traceFilePath, traceFixes) && allOk;
allOk = patchFile(indexFilePath, standaloneFixes) && allOk;
allOk = patchFile(indexFilePath, indexWriteFixes) && allOk;

if (!allOk) {
  process.exit(1);
}
