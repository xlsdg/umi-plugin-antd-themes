const Path = require("path");
const ServeStatic = require("serve-static");
const RimRaf = require("rimraf");
const Fs = require("fs");

const AntdProMergeLess = require("antd-pro-merge-less");
const Slash2 = require("slash2");

export default function (api) {
  const { cwd, absOutputPath, absNodeModulesPath } = api.paths;
  const outputPath = absOutputPath;
  const tempPath = Slash2(Path.join(absNodeModulesPath, ".antd-themes"));
  const userConfig = api.userConfig.antdThemes;

  if (!(userConfig && userConfig.themes && userConfig.themes.length > 0)) {
    return;
  }

  // 增加中间件
  api.addMiddewares(() => ServeStatic(tempPath));

  // 增加一个对象，用于 layout 的配合
  api.addHTMLHeadScripts(() => [
    {
      content: `window.antd_themes = ${JSON.stringify(userConfig.themes)}`,
    },
  ]);

  // 配置
  api.describe({
    key: "antdThemes",
    config: {
      schema(joi) {
        return joi.object({
          themes: joi.array(),
          options: joi.object(),
        });
      },
    },
  });

  // 编译完成之后
  api.onBuildComplete(({ err }) => {
    if (err) {
      return;
    }

    api.logger.info("💄  build theme");

    try {
      if (Fs.existsSync(Slash2(Path.join(outputPath, "theme")))) {
        RimRaf.sync(Slash2(Path.join(outputPath, "theme")));
      }
      Fs.mkdirSync(Slash2(Path.join(outputPath, "theme")));
    } catch (error) {
      // console.log(error);
    }

    AntdProMergeLess(
      cwd,
      userConfig.themes.map((theme) => ({
        ...theme,
        fileName: Slash2(Path.join(outputPath, "theme", theme.fileName)),
      })),
      userConfig.options
    )
      .then(() => {
        api.logger.log("🎊  build theme success");
      })
      .catch((e) => {
        console.log(e);
      });
  });

  // dev 之后
  api.onDevCompileDone(({ isFirstCompile }) => {
    if (!isFirstCompile) {
      return;
    }

    api.logger.info("cache in :" + tempPath);
    api.logger.info("💄  build theme");

    // 建立相关的临时文件夹
    try {
      if (Fs.existsSync(tempPath)) {
        RimRaf.sync(tempPath);
      }

      Fs.mkdirSync(tempPath);

      if (Fs.existsSync(Slash2(Path.join(tempPath, "theme")))) {
        RimRaf.sync(Slash2(Path.join(tempPath, "theme")));
      }

      Fs.mkdirSync(Slash2(Path.join(tempPath, "theme")));
    } catch (error) {
      // console.log(error);
    }

    AntdProMergeLess(
      cwd,
      userConfig.themes.map((theme) => ({
        ...theme,
        fileName: Slash2(Path.join(tempPath, "theme", theme.fileName)),
      })),
      userConfig.options
    )
      .then(() => {
        api.logger.log("🎊  build theme success");
      })
      .catch((e) => {
        console.log(e);
      });
  });
}
