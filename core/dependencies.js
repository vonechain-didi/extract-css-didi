/**
 * 收集依赖
 */

const path = require('path')
const fsp = require('fs/promises');
const con = require('./const');

const {
  ROUGH_PATH_REG,
  ACCURATE_PATH_REG,
  USEFUL_EXTENSION_REG,
  USELESS_EXTENSION_REG,
  VUE_FILE_REG,
  CSS_FILE_REG,
  LESS_FILE_REG,
  STYLE_WITH_TAG_REG,
  ANNOTATION_REG,
  STYLE_START_REG,
  IMPORT_CSS_REG,
  CSS_CONTENT_REG
  
} = con;


class Dependencies {
  constructor(options = {}){
    this.count = 0;
    this.fileLists = [];
    this.styleLists = [];
    this.done = null;
    // this.total = 0;
    this.entry = options.entry;
    this.exclude = options.exclude && options.exclude.map(p=>this.wraperPath(p)) || [];
    this.destPath = options.destPath;
    // this.include = options.include && options.include.map(p=>this.wraperPath(p)) || [];
    
  }

  wraperPath(p){
    return path.join(process.cwd(),p)
  }

  run(done){
    this.done = done || (()=>{});
    if(typeof this.entry === 'string'){
      this.count++;
      this.getDependencyFiles(this.wraperPath(this.entry));
    } else if(Array.isArray(this.entry)){
      this.entry.map(p=>this.wraperPath(p)).forEach(fp=>{
        this.count++;
        this.getDependencyFiles(fp);
      });
    }
  }

  async getDependencyFiles (fp){
    if(this.fileLists.includes(fp) || fp.includes('node_modules/')){
      this.count--;
      if(this.count==0){
        this.done(this.filterUselessFile(), this.styleLists);
      }
      return;
    }
    this.fileLists.push(fp);

    // console.log(1,fp)
    const fileData = await fsp.readFile(fp, 'utf8');

    // 依赖
    const tempPaths = fileData?.match(ROUGH_PATH_REG);

    // 获取含有的样式
    this.getStyleData(fp, fileData);

    // console.log(fileData)
    // console.log(tempPaths)
    if(tempPaths){
      const filePaths = await this.handlePaths(fp, tempPaths);
      // this.total+=filePaths.length;
      // console.log(`${fp}有 ${filePaths.length} 个依赖文件如下\n`,filePaths);
      filePaths?.forEach(p=>{
        this.count++;
        this.getDependencyFiles(p)
      })
    }
    this.count--;
    if(this.count==0){
      // console.log(this.total);
      this.done(this.filterUselessFile(), this.styleLists)
    }
  }
  
  async handlePaths(fp, paths = []){
    const tempPaths = paths.join(',').match(ACCURATE_PATH_REG);
    // console.log(2,tempPaths)
    return new Promise(async (res, rej)=>{
      const absolutePaths = [];
      let cnt = 0;
      tempPaths.forEach(async p=>{
        const validPath = await this.getFilePath(fp, p);
        // console.log('validPath',validPath)
        if(validPath){
          absolutePaths.push(validPath);
        }
        cnt++;
        if(cnt===tempPaths.length){
          res(absolutePaths);
        }
      });
    })
  }
  
  async getFilePath (parent, child){
    let fp = '';
    if(child.startsWith('@')){
      fp = child.replace('@', process.cwd()+'/src');     
    } else{
      fp = path.join(parent,'..', child)
    }

    if(USEFUL_EXTENSION_REG.test(fp)){
      return fp;
    } else if (USELESS_EXTENSION_REG.test(fp)) {
      // return `${NO_RECORD_FLAG}${fp}`;
      // if(this.include.includes(fp)){
      //   return fp;
      // }
      // 不排除js文件
      return fp;
    } else {
      const lastSlashIndex = fp.lastIndexOf('/');
      const name = fp.slice(lastSlashIndex);
      if(name.includes('.')){
        return ;
      }
      try{
        const finfo = await fsp.stat(fp);
        if(finfo.isDirectory()){
          // console.log('wenjainjia===>',fp);
          return await this.addFileExtensionOrFileName(fp);
        } else {
          return await this.addFileExtensionOrFileName(fp, true)
        }
      } catch(e){
        // console.log('errrrrr', fp, e)
        return await this.addFileExtensionOrFileName(fp, true);
      }
      
    }
    
  }
  
  // TODO 待优化   优先试探顺序 vue/js/css/less
  async addFileExtensionOrFileName(fp, extension){
    try{
      const temp = extension?(fp+'.vue'):path.join(fp, 'index.vue');
      await fsp.access(temp);
      return temp
    } catch(e){
      // console.log(4,fp, e)
      try{
        const temp = extension?(fp+'.js'):path.join(fp, 'index.js');
        await fsp.access(temp);
        // return `${NO_RECORD_FLAG}${temp}`
        // js里面有可能含有导入的组件 mixin router
        // if(this.include.includes(temp)){
        //   return temp;
        // }
        return temp;
      } catch(e){
        // console.log(5,fp, e)
        try{
          const temp = extension?(fp+'.css'):path.join(fp, 'index.css');
          await fsp.access(temp);
          return temp
        } catch(e){
          try{
            const temp = extension?(fp+'.less'):path.join(fp, 'index.less');
            await fsp.access(temp);
            return temp
          } catch(e){
            // console.log(1232143434)
            return '';
          }
        }
      }
    }
  }

  filterUselessFile(){
    return this.fileLists.filter(p=>!USELESS_EXTENSION_REG.test(p))
  }

  getStyleData(fp, data){
    if(USELESS_EXTENSION_REG.test(fp)){
      return;
    }
    
    if(CSS_FILE_REG.test(fp)){
      // 需要把导入的样式列表取出来
      const imps = data.match(IMPORT_CSS_REG);

      this.styleLists.push({
        type: 'css',
        path: fp,
        importInfo: imps&&imps.join('\n'),
        originData: data,
        data: data.replace(ANNOTATION_REG,'')
      });
      return;
    }
    if(LESS_FILE_REG.test(fp)){
      // 需要把导入的样式列表取出来
      const imps = data.match(IMPORT_CSS_REG);
  
      this.styleLists.push({
        type: 'less',
        path: fp,
        importInfo: imps&&imps.join('\n'),
        originData: data,
        data: data.replace(ANNOTATION_REG,'')
      });
      return;
    }
    if(VUE_FILE_REG.test(fp)){
      // console.log('1233', data)
      const styles = data.match(STYLE_WITH_TAG_REG);
      const keepContent = data.replace(STYLE_WITH_TAG_REG, '')
      // console.log(styles)
      
      const tagInfo = {};
      const importInfo = {};
      let cssInfo = [];
      if(styles&&styles.length){
        for(let i=0;i<styles.length;i++){
          const style = styles[i];
          const start = style.match(STYLE_START_REG);
          // console.log(start)
          if(start && start[1]){
            tagInfo[i] = start[1];
          }
          const imps = style.match(IMPORT_CSS_REG);
          // console.log(imps)
          if(imps && imps.length){
            importInfo[i] = imps.join('\n')
          }
          
          const ret = style.match(CSS_CONTENT_REG);
          if(ret&&ret[2]){
            cssInfo.push(ret[2]);
          } else {
            cssInfo.push('');
          }
        }
      }

      if(styles){
        this.styleLists.push({
          type: 'vue',
          path: fp,
          tagInfo,
          importInfo,
          keepContent: keepContent?.trim(),
          originData: data,
          data: cssInfo.map(str=>str.replace(ANNOTATION_REG,''))
        });
      }
      return;
    }

  }
}



module.exports = Dependencies;
