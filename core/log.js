const gf = require('./generateFile')
const utils = require('./utils');
const con = require('./const');
const path = require('path')
const fse = require('fs-extra')

const {SUFFIX_DEEP, SUFFIX_COMMON, LEVEL_FLAG, SUFFIX_SAME_FILE_COMMON} = con;
const msgMap = {
  [SUFFIX_DEEP]: '继承规则提升',
  [SUFFIX_COMMON]: '文件间的相同样式提升',
  [SUFFIX_SAME_FILE_COMMON]: '当前文件相同样式提升',
}

const log = function(data={}, fileLists, outPut){
  if(utils.isEmptyObject(data)){
    return;
  }
  const logDir = path.join(process.cwd(), outPut);
  fse.ensureDirSync(logDir)
  return Promise.resolve().then(()=>{
    let str = '';
    const files = fileLists.map(name=>name.replace(process.cwd(), ''));
    str+= `/**** 以下${files.length}个文件存在样式变动 ******/\n [\n\t${files.join('\n\t')}\n]\n\n /**** 以下为变动详情 *****/\n`;
    for(const name in data){
      const infos = data[name]
      str+=`\nvvvvvvvvvvvvvvvv ${name.replace(process.cwd(), '')} start vvvvvvvvvvvvvvvv\n`;
      infos.forEach(item=>{
        str += `${(item.dir||'').replace(LEVEL_FLAG, ' ')} ${item.selector} =====> ${item.prop}: ${item.value} >>> ${msgMap[item.type]}\n`
      })
      str+=`\n^^^^^^^^^^^^^^^^ ${name.replace(process.cwd(), '')} end ^^^^^^^^^^^^^^^^\n\n`;
    }
    const d = new Date();
    gf.append(path.join(logDir, `log${d.toLocaleDateString().replace(/\//g,'-')}T${d.toLocaleTimeString('en-US', { hour12: false }).replace(/(\d\d):(\d\d):(\d\d)/, '$1h$2m$3s')}.txt`),str, ()=>{
      console.log('日志记录完成')
    })
  })

}

module.exports = log;