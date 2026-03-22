今年公司一直在推行前后端分离开发，刚好有个活动开发的需求，于是想用react多页面应用去实现。该项目在create-react-app(@3.0.1)脚手架的基础上开发。



### 准备工作



下载安装create-react-app(@3.0.1,其他版本配置可能略微不同)脚手架，并将CRA中的配置全部反编译到当前项目（方法参考：https://juejin.im/post/5a5d5b815188257327399962）



### 建立文件夹规范约束



规范如下（参考微信小程序的文件夹规范）
![640](https://github.com/user-attachments/assets/f6fed085-ab4e-4f27-8629-1a0d33585e06)


### 修改webpack配置


 首先修改config文件夹下的paths.js文件，新增如下函数：

 ```code

// 添加获取多页html模板方法

const getMultiPageHtml = (filePath) => {
  return globby.sync(filePath, {
          expandDirectories: {
            files: ['*.html']
          }
        })
        .reduce((arr, file) => {
          let key = file.replace(/(^src\/|\.html$)/g, '');
          return arr.concat([[ 
            key,                        // 入口 chunk key（用文件路径可保证key唯一性）
            resolveApp(file),            //html template url
            resolveApp(`src/${key}.js`)  //入口js文件 url
          ]])
        }, []);
}

```

paths.js导出值中新增multiPageList值

![640 (1)](https://github.com/user-attachments/assets/c67a5953-833a-4b54-b607-6ed0e6788c3f)

修改webpack.config.js文件，新增如下函数：

```code

// 新增获取多页面配置
  const getMultiPageConfig = (files) => {
    return files.reduce((data, file) => {
      const [key, template, appJs] = file;
      if( fs.existsSync( appJs ) ){
        data.entryJs[key] = [
          isEnvDevelopment &&
            require.resolve('react-dev-utils/webpackHotDevClient'),
          appJs
        ].filter(Boolean);
        data.htmlPlugins.push(
          new HtmlWebpackPlugin(
            Object.assign(
              {},
              {
                inject: true,
                chunks: [key],
                template: template,
                filename: `${key}.html`
              },
              isEnvProduction
                ? {
                    minify: {
                      removeComments: true,
                      collapseWhitespace: true,
                      removeRedundantAttributes: true,
                      useShortDoctype: true,
                      removeEmptyAttributes: true,
                      removeStyleLinkTypeAttributes: true,
                      keepClosingSlash: true,
                      minifyJS: true,
                      minifyCSS: true,
                      minifyURLs: true,
                    },
                  }
                : undefined
            )
          )
        )
      }
      return data;
    }, {
      entryJs: { },
      htmlPlugins: [ ]
    })
  }
  const { entryJs, htmlPlugins } = getMultiPageConfig(paths.multiPageList);

```
接着修改entry 和 plugins 配置项：
![640 (2)](https://github.com/user-attachments/assets/b7c42c06-60e7-4960-85d3-3f84ca6cd389)
![640 (3)](https://github.com/user-attachments/assets/a0561ab4-35e9-4d57-9637-4056f9608f81)


自此一个基于CRA的多页面应用webpack配置完成了，其他配置优化可根据自身需求调整。

### 当前配置的优点

配置后不需要手动添加入口文件和htmlWebpackPlugin，只要根据文件目录规范能够自动生成。

支持多层级文件夹，生成后的文件夹与源文件夹目录结构保持一致。

### 缺点

由于当前开发活动页面较少，暂未发现问题，如您在使用中有问题欢迎留言讨论。
