import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync, readdirSync, readFileSync, copyFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;

// 1. 把 Vue3 完整版（含运行时模板编译器）覆盖到 static/js/vue.js
//    注意：必须用 global(.prod).js 完整版，不能用 runtime-only 版，否则 mount 时编译 DOM/字符串模板会报 "i.call is not a function"
copyFileSync(
  resolve(root, "node_modules/vue/dist/vue.global.prod.js"),
  resolve(root, "static/js/vue.js")
);

// 2. 游戏逻辑 JS（除 vue.js 外）拼接 + 压缩 -> build/js/all.js
//    用 stdin 把多个文件源码拼成一个，等价于原 gulp 的 concat
const jsDir = resolve(root, "static/js");
const files = readdirSync(jsDir)
  .filter((f) => f.endsWith(".js") && f !== "vue.js")
  .sort();
const concat = files
  .map((f) => readFileSync(resolve(jsDir, f), "utf8"))
  .join("\n;\n");

await esbuild.build({
  stdin: {
    contents: concat,
    resolveDir: jsDir,
    loader: "js",
  },
  bundle: false,
  minify: true,
  format: "iife",
  outfile: resolve(root, "build/js/all.js"),
});

// 3. CSS 压缩 -> build/css/game.css
const cssSrc = resolve(root, "static/game.css");
if (existsSync(cssSrc)) {
  await esbuild.build({
    entryPoints: [cssSrc],
    bundle: true,
    minify: true,
    outfile: resolve(root, "build/css/game.css"),
  });
}

console.log("build done");
