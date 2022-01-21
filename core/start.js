const path = require('path')
const customConfig = require('./getCustomConfig')
const Dependencies = require('./dependencies')
const css2Object = require('./css2object')
const extract = require('./extract')
const obj2css = require('./object2css')
const genLess = require('./genLessString')
const unflatten = require('./unflatten')
const gf = require('./generateFile')
const insert = require('./insert')
const log = require('./log')

const defaulConfig = {
  entry: 'src/main.js', // 入口文件  String|Array
  // entry: 'src/sytles/reset.less',
  // entry: 'optimise_style/test/Set.vue',
  exclude: [], // 排除某个文件或文件夹
  include: ['src/routes/router.js','src/routes/chat.js'], // 这里可指定保留一些文件,注意保留子文件就必须保留父文件
  destPath: 'src/assets/css/common.less', // 生成的css 文件路径
  insertInfos: {
    insertFile: 'src/main.js',
    insertContent: 'import "./assets/css/common.less"',
    // insertPosition: '// insert-common-less'
  }, // 默认插入 字符串类型的entry文件里
  logOutPut: 'logs'
}
const custom = customConfig();
console.log('自定义配置', custom)
const config = { ...defaulConfig, ...custom }


// const ENTRY = 'src/main.js';
// const entry = ['src/main.js', 'src/routes/chat.js']



const Dep = new Dependencies(config);
/**
 * 
 * @param {*} options 
 * options 支持以下属性
 * {
 *  sortFile - filePath 给单个文件css属性进行排序
 *  sortFiles - Boolean 给所有文件css属性进行排序
 * }
 */
function start(options = {}){
  Dep.run((data, styles)=>{
    // console.log(data, data.length);
    // console.log(JSON.stringify(data));
    // console.log(JSON.stringify(styles))
    let currentCommonInfos = null;
    let currentCommonIndex = -1;
    styles.forEach((item,i) => {
      const css = item.data;
      // console.log(item.path)
      if(typeof css === 'string'){
        item.cssJson = css2Object(css)
      } else if(Array.isArray(css)){
        item.cssJson = css.map(str=>css2Object(str))
      }
      delete item.data
      if(item.path.endsWith(config.destPath)){
        currentCommonInfos = item;
        currentCommonIndex = i;
      }
    });
    console.log(styles.length,1)
    if(currentCommonIndex>-1){
      console.log('已存在抽离过的公共样式文件');
      styles.splice(currentCommonIndex,1);
      // gf.writeJson(path.join(process.cwd(), './temp/temp_currentCommon.json'),currentCommonInfos, ()=>{
      //   console.log('000')
      // })
    }
    // console.log(JSON.stringify(styles))
    // gf.writeJson(path.join(process.cwd(), './temp/temp.json'),styles, ()=>{
    //   console.log('111')
    // })

    // gf.write(path.join(process.cwd(), './temp/temp.txt'),JSON.stringify(styles), ()=>{
    //   console.log('111')
    // })
    if(options.sortFile || config.sortFile){
      // 给单个文件排序
      const filePath = path.join(process.cwd(), options.sortFile || config.sortFile);
      const file = styles.filter(item=>item.path===filePath);
      if(file.length){
        sortAttrHandler(file);
      } else {
        throw new Error('cannot find the file ' + options.sortFile);
      }
    } else if (options.sortFiles || config.sortFiles){
      // 给所有文件排序
      sortAttrHandler(styles);
    } else {
      const cssHandled = extract(styles, currentCommonInfos);
      // console.log(cssHandled)
      // gf.writeJson(path.join(process.cwd(), './temp/temp_flatten.json'),cssHandled.flatened, ()=>{
      //   console.log('222')
      // })

      // 公共的样式都已经抽离出来 下面需要把样式以特定格式放入项目文件里
      // TODO 优化点 处理公共样式与处理每个文件的样式可同时进行，逻辑独立，没有依赖关系 

      /**======== 处理公共的样式 start==============**/
      
      // gf.writeJson(path.join(process.cwd(), './temp/temp_common.json'),cssHandled.common, ()=>{
      //   console.log('333')
      // })
      
      const commonCss = obj2css(cssHandled.common);
      // gf.writeJson(path.join(process.cwd(), './temp/temp_common_css.json'),commonCss, ()=>{
      //   console.log('444')
      // })

      const lessStr = genLess.genCommon(commonCss);
      insert(lessStr, config, 'common');
      // gf.write(path.join(process.cwd(), './temp/temp_common_css.less'),lessStr, ()=>{
      //   console.log('555')
      // })
      /**======== 处理公共的样式 end==============**/



      /**======== 处理每个文件的样式 start==============**/
      const {lists, logs} = unflatten(cssHandled.flatened);
      const changedFileLists = Object.keys(logs);
          /**======== 记录日志 start ===============**/
            log(logs, changedFileLists, config.logOutPut);
          /**======== 记录日志 end =================**/
      // gf.writeJson(path.join(process.cwd(), './temp/temp_unflatten.json'),lists, ()=>{
      //   console.log('666')
      // })

      // 生成less样式字符串
      const flists = genLess.genEach(lists);

      insert(flists, null, 'each', changedFileLists);
      // gf.writeJson(path.join(process.cwd(), './temp/temp_lessfiles.json'),flists, ()=>{
      //   console.log('777')
      // })
      // console.log(flists)
      

      

      /**======== 处理每个文件的样式 end==============**/
    }
    
  })
}

const sortAttrHandler = function(filelists){
  const { flatened } = extract(filelists, null, true);
  const {lists, logs} = unflatten(flatened);
  const changedFileLists = Object.keys(logs);
  log(logs, changedFileLists, config.logOutPut);
  const flists = genLess.genEach(lists);
  insert(flists, null, 'each');
}

module.exports = start;
