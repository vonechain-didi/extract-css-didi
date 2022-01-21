/**
 * 把多级对象变为一级对象，方便后面的比较
 */

const utils = require('./utils');
const con = require('./const');

const {KEEP_CSS_RULE_REG, SAME_SELECTOR, LEVEL_FLAG} = con;

let path = [];
let root = {};

const flatten = function(lists){
  lists.forEach(list=>{
    const cssJson = utils.deepClone(list.filteredSameInheritCss);
    if(utils.isObject(cssJson)){
      list.flattenCss = flattenObject(cssJson)
    } else if(utils.isArray(cssJson)){
      list.flattenCss = [];
      cssJson.forEach(css=>list.flattenCss.push(flattenObject(css)));
    }
  })
  return lists;
}

// 把深度二级及以上的对象拿到一级来
const flattenObject = function(obj){
  if(utils.isEmptyObject(obj)){
    return {};
  }
  root = {};
  // 单独处理第一级数据
  collectFirstLevel(obj);

  for(const key in root){
    path = [];
    handleDeepLevel(root[key],key);
  }
  
  return root;

}

// 
const collectFirstLevel = function(obj){
  for(const key in obj){
    // 大量数据时 typeof 比 utils.isObject 性能好
    if(typeof obj[key] === 'object'){
      root[key] = obj[key];
    }
  }
}


const handleDeepLevel = function(obj, rootKey){
  if(rootKey){
    // rootCopy[rootKey] = obj;
    
    path.push(rootKey);

    if(KEEP_CSS_RULE_REG.test(rootKey)){
      return;
    }
  }

  for(const key in obj){
    if(utils.isEmptyObject(obj[key]) || key === SAME_SELECTOR){
      continue;
    }
    let temp = obj[key];
    if(typeof temp === 'object'){
      delete(obj[key]);
      temp.dir = path.join(LEVEL_FLAG);

      // 防止后面覆盖前面的,先增加一个$$$$same属性暂存一下
      if(root[key]){
        !root[key][SAME_SELECTOR] && (root[key][SAME_SELECTOR]=[]);
        root[key][SAME_SELECTOR].push(temp)
      } else {
        root[key] = temp;
      }
      
      if(KEEP_CSS_RULE_REG.test(key)){
        // 伪类选择器 @media @keyframes 只拿第一层到外面，里面的结构保持不动
        // TODO 这些选择器里面的样式有可能与外层重复，需要进一步优化
        /**
         *  .css{
         *    font-size: 14px;
         *    color: #fff;
         *    .aaaa{
         *      font-size: 16px;
         *      font-weight: 600;
         *    }
         *  }
         *  .css:hover{
         *    font-size: 14px; =====>>>> 此处font-size可移除
         *    color: #000;
         *    .aaaa{
         *      font-weight: 600; =====>>>> 此处font-weight可移除
         *    }
         *  }
         */
        continue;
      }
      path.push(key);
      handleDeepLevel(temp)
      path.pop();
    }
  }
}

module.exports = flatten;