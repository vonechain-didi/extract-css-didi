const fsp = require('fs/promises')
const gf = require('./generateFile')
const path = require('path')

//  destPath: 'src/assets/css/common.less', // 生成的css 文件路径
//  insertPath: 'src/main.js', 

const insert = function(css, options, type, fileLists, sortFile){
  if(!css){
    return;
  }
  if(type==='common'){
    if(!options.destPath){
      throw new Error('没有配置公共样式表的路径')
    }
    const genPath = path.join(process.cwd(),options.destPath)
    gf.append(genPath, css, ()=>{
      console.log('成功生成公共样式表')
    })

    if(options.insertInfos){
      gf.getAbsolutePath(options.insertInfos.insertFile).then(dir=>{
        fsp.readFile(dir, 'utf8').then(data=>{
          // console.log(data)
          if(data.includes(options.insertInfos.insertContent)){
            return;
          }
          if(options.insertInfos.insertPosition){
            data = data.replace(options.insertInfos.insertPosition, `${options.insertInfos.insertPosition}\n${options.insertInfos.insertContent}\n`);
          } else {
            data = data+`\n${options.insertInfos.insertContent}\n`;
          }

          gf.write(dir, data, ()=>{
            console.log('成功插入',dir)
          })
        });
      })
    }
  }

  if(type==='each'){
    css.forEach((file,i)=>{
      const fp = file.path;
      // if(fileLists.includes(fp)){
      //   gf.write(fp,(file.keepContent||'')+file.cssString, ()=>{
      //     // console.log(fp, '成功')
      //   })
      // }
      gf.write(fp,(file.keepContent||'')+file.cssString, ()=>{})
    })
  }

}








module.exports = insert;