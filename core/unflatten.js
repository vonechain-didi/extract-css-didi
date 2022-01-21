/**
 * 把一级对象扩展为多级对象，方便后面替换样式
 */

const utils = require('./utils');
const con = require('./const');

const {SUFFIX_DEEP, SUFFIX_COMMON, SAME_SELECTOR, LEVEL_FLAG, SUFFIX_SAME_FILE_COMMON, HAS_PATCHED} = con;
const logs = {};

const handleLog = function(prop, obj, selector, name){
  if(
    obj[prop+SUFFIX_COMMON] || 
    obj[prop+SUFFIX_DEEP] || 
    obj[prop+SUFFIX_SAME_FILE_COMMON]
  ){
    !logs[name] && (logs[name]=[]);
    logs[name].push({
      selector,
      dir: obj.dir,
      prop,
      value: obj[prop],
      type: (obj[prop+SUFFIX_COMMON]&&SUFFIX_COMMON) || (obj[prop+SUFFIX_DEEP]&&SUFFIX_DEEP) || (obj[prop+SUFFIX_SAME_FILE_COMMON]&&SUFFIX_SAME_FILE_COMMON)
    })
  }
}


const validateProp = function(prop, obj, selector, fileName){
  if(
    prop !== 'dir' && 
    prop !== HAS_PATCHED &&
    prop !== SAME_SELECTOR && 
    !prop.includes(SUFFIX_COMMON) && 
    !prop.includes(SUFFIX_DEEP) && 
    !prop.includes(SUFFIX_SAME_FILE_COMMON) &&
    !obj[prop+SUFFIX_COMMON] && 
    !obj[prop+SUFFIX_DEEP] && 
    !obj[prop+SUFFIX_SAME_FILE_COMMON]
  ){
    return true
  } else {
    handleLog(prop, obj, selector, fileName);
    return false;
  }
}

const assignCss = function(dir, selector, collect, mergedCss){
  const dirs = dir.split(LEVEL_FLAG);
  let temp = collect;
  dirs.push(selector)
  temp = utils.getInnermostLevel(dirs, temp)
  Object.assign(temp, mergedCss);
}

const handleProcess = function(flatten, collect, fileName){
  for(const selector in flatten){ //flatten[selector]肯定是一个对象
    const css = flatten[selector];
    let tempSelf = {};
    let tempSame = {};
    for(const prop in css){
      if(validateProp(prop, css, selector, fileName)){
        tempSelf[prop] = css[prop];
      } else if (prop===SAME_SELECTOR){
        // 如果存在那肯定是一个数组
        const same = css[prop]; 
        same.forEach(item=>{
          const key = item.dir;
          !tempSame[key] && (tempSame[key]={});
          for(const k in item){
            if(validateProp(k, item, selector, fileName)){
              tempSame[key][k] = item[k];
            }
          }
        })
      }
    }

    if(!utils.isEmptyObject(tempSelf)){
      if(!css.dir){
        !collect[selector] && (collect[selector]={});
        Object.assign(collect[selector], tempSelf);
      } else {
        assignCss(css.dir, selector, collect, tempSelf);
      }
    }

    if(!utils.isEmptyObject(tempSame)){
      for(const path in tempSame){
        if(!utils.isEmptyObject(tempSame[path])){
          assignCss(path, selector, collect, tempSame[path]);
        }
      }
    }
  }
}

const unflatten = function(lists){
  lists.forEach(list => {
    const flattenCss = utils.deepClone(list.flattenCss);
    let unflattenCss = null;
    if(utils.isObject(flattenCss)){
      unflattenCss = {};
      handleProcess(flattenCss, unflattenCss, list.path);
    } else if(utils.isArray(flattenCss)){
      unflattenCss = [];
      flattenCss.forEach((fc, index)=>{
        unflattenCss[index] = {};
        handleProcess(fc, unflattenCss[index], list.path);
      })
    }
    list.unflattenCss = unflattenCss;
  });

  return {lists, logs};
}




module.exports = unflatten;