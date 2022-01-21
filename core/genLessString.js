const utils = require('./utils');
const sort = require('./cssSort');
const con = require('./const');

const { DIVIDE_SELECTORS, SAME_LEVEL_REG, CHILD_LEVEL_REG } = con;
// TODO genCommon ====>>> 相同的选择器整合到一起
/**
 * 如下面的样式
 "#talkbubblee .fileBox, #talkbubble .fileBox": {
    "line-height": "20px"
  }
  "#talkbubblee .imgMsg, #talkbubble .imgMsg": {
    "cursor": "pointer",
    "line-height": "10px",
    "border": "1px solid #E4E4E4"
  }
  "#talkbubblee .imgMsg img, #talkbubble .imgMsg img": {
    "max-width": "120px"
  }


  优化后
  "#talkbubblee, #talkbubble":{

    ".fileBox": {
      "line-height": "20px"
    }

    ".imgMsg": {
      "cursor": "pointer",
      "line-height": "10px",
      "border": "1px solid #E4E4E4"

      "img": {
        "max-width": "120px"
      }
    }
  }

  相同父级的再进行比较，如上面优化后的第一级  "#talkbubblee, #talkbubble"此选择器，如果#talkbubblee/#talkbubble同时存在样式的话需进行比对
  "#talkbubble": {
    "line-height": "23px",
    "font-size": "14px",
    "min-width": "30px",
    "max-width": "62%",
    "min-height": "23px",
    "position": "relative",
    "margin-left": "10px",
    "padding": "7px 10px"
  }
  "#talkbubblee": {
    "line-height": "23px",
    "font-size": "14px",
    "min-width": "30px",
    "max-width": "63%",
    "min-height": "23px",
    "position": "relative",
    "margin-right": "10px",
    "padding": "7px 10px"
  }

  优化后
  "#talkbubblee, #talkbubble":{
    "line-height": "23px",
    "font-size": "14px",
    "min-width": "30px",
    "min-height": "23px",
    "position": "relative",
    "margin-right": "10px",
    "padding": "7px 10px"
  }
  "#talkbubble": {
    "max-width": "62%",
  }
  "#talkbubblee": {
    "max-width": "63%"
  }


  整合上面两步优化后的结果为
  "#talkbubblee, #talkbubble":{
    "line-height": "23px",
    "font-size": "14px",
    "min-width": "30px",
    "min-height": "23px",
    "position": "relative",
    "margin-right": "10px",
    "padding": "7px 10px"

    ".fileBox": {
      "line-height": "20px"
    }

    ".imgMsg": {
      "cursor": "pointer",
      "line-height": "10px",
      "border": "1px solid #E4E4E4"

      "img": {
        "max-width": "120px"
      }
    }
  }

  "#talkbubble": {
    "max-width": "62%",
  }
  "#talkbubblee": {
    "max-width": "63%"
  }


  基于less 还可再进一步优化
  "#talkbubblee.fullOfEmoji": {
    "max-width": "61%"
  },
  "#talkbubble.fullOfEmoji": {
    "max-width": "62%"
  },
  "#talkbubblee.samllFullOfEmoji": {
    "max-width": "60%"
  },
  "#talkbubble.samllFullOfEmoji": {
    "max-width": "61%"
  }

  结合前面的优化结果
   "#talkbubble": {
      "max-width": "62%",

      "&.fullOfEmoji": {
        "max-width": "62%"  // 这个属性已经与父级重复了，可优化掉
      }
      "&.samllFullOfEmoji": {
        "max-width": "61%"
      }
    }
    "#talkbubblee": {
      "max-width": "63%"

      "&.fullOfEmoji": {
        "max-width": "61%"
      }
      "&.samllFullOfEmoji": {
        "max-width": "60%"
      }
    }
 */
//  提取出来的公共样式
const genCommon = function(cssObj){
  if(utils.isEmptyObject(cssObj)){
    return '';
  }
  // console.log(JSON.stringify(cssObj))
  let str = '/**\n* 自动生成 \n*/\n\n';
  for(const selector in cssObj){
    const temp = selector.replace(DIVIDE_SELECTORS, ',\n');
    str += `${temp} {\n`;
    const css = cssObj[selector];
    const sortedProps = sort(css);
    sortedProps.forEach(key=>{
      str+=`\t${key}: ${css[key]};\n`;
    })
    // for(const key in css){
    //   // str+=`\t${key}: ${css[key].replace(' !important','')} !important;\n`;
    //   str+=`\t${key}: ${css[key]};\n`;
    // }
    str += '}\n';
  }
  return str;
}




// genEach 每个文件重新生成新的样式
/**
 *
[
  {
    ".popper-member-card": {
      "top": "61px !important"
    },
    ".popper-member-card .popper__arrow": {
      "display": "none"
    }
  },
  {
    ".member-card-main-class": {
      "position": "relative"
    },
    ".user-high-level-border": {
      "background-image": "url(../../assets/images/wjt_highbg_62.png)"
    },
    ".user-low-level-border": {
      "background-image": "url(../../assets/images/wjt_lowbg_62.png)"
    },
    ".userLevelClass": {
      "position": "absolute",
      "top": "-11px",
      "height": "14px",
      "width": "28px",
      "left": "50%",
      "margin-left": "-16px",
      "&.lower": {
        "top": "-16px"
      },
      "&.higher": {
        "margin-left": "-14px"
      }
    }
  }
]
 */
let space = '\t';
let spaceCount = 1;
let style = {
  style:'',
  common: ''
}
const genEach = function(lists){
  lists.forEach(list => {
    const {type, path: fp, tagInfo, importInfo, common, unflattenCss} = list;
    // 先把css对象转字符串
    style = {
      style:'',
      common: ''
    }
    if(utils.isObject(unflattenCss)){
      spaceCount = 0;
      walk(unflattenCss, 'style');
      if(common&&common['-1']){
        spaceCount = 0;
        walk(common['-1'], 'common')
      }
      list.cssString = styleWrap(type, style, tagInfo, importInfo);
      
    } else if(utils.isArray(unflattenCss)){
      unflattenCss.forEach((cssObj, i)=>{
        style = {
          style:'',
          common: ''
        }
        spaceCount = 1;
        walk(cssObj, 'style');
        if(common&&common[i]){
          spaceCount = 1;
          walk(common[i], 'common')
        }
        list.cssString = (list.cssString||'')+'\n'+styleWrap(type, style, tagInfo[i], importInfo[i]);
      })
    }
    
  });
  return lists;
}

const walk = function(obj, prop){
  /***********css属性排序 */
  const sortedProps = sort(obj);
  sortedProps.forEach(key=>{
    const value = obj[key];
    if(typeof value==='string'){
      style[prop] += `${spaceCount>0?space.repeat(spaceCount):''}${key}: ${value};\n`;
    } else if(typeof value==='object'){
      const tspace = spaceCount>0?space.repeat(spaceCount):'';
      let temp = key;
      if(prop==='common'){
        temp = temp.replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ')
      }
      temp = temp.replace(DIVIDE_SELECTORS,',\n'+tspace);
      style[prop] += `${tspace}${temp} {\n`;
      spaceCount++;
      walk(value, prop);
      spaceCount--;
      style[prop] += `${spaceCount>0?space.repeat(spaceCount):''}}\n`;
    }
  })
  
  /***********css属性不排序 */
  // for(const key in obj){ // key 可能是样式属性或者选择器
  //   const value = obj[key];
  //   if(typeof value==='string'){
  //     style[prop] += `${spaceCount>0?space.repeat(spaceCount):''}${key}: ${value};\n`;
  //   } else if(typeof value==='object'){
  //     const tspace = spaceCount>0?space.repeat(spaceCount):'';
  //     let temp = key;
  //     if(prop==='common'){
  //       temp = temp.replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ')
  //     }
  //     temp = temp.replace(DIVIDE_SELECTORS,',\n'+tspace);
  //     style[prop] += `${tspace}${temp} {\n`;
  //     spaceCount++;
  //     walk(value, prop);
  //     spaceCount--;
  //     style[prop] += `${spaceCount>0?space.repeat(spaceCount):''}}\n`;
  //   }
  // }
  
}

const styleWrap = function(type, style, tagInfo, importInfo){
  if(importInfo){
    if(type==='vue'){
      return `${tagInfo}\n${space}${importInfo}\n${style.common}\n${style.style}</style>`;
    } else {
      return `${importInfo}\n${style.common}\n${style.style}`;
    }
  }
  if(!style.style.trim() && style.common.trim()){
    return '';
  }

  if(type==='vue'){
    return `${tagInfo}\n${style.common}\n${style.style}</style>`;
  }
  return `${style.common}\n${style.style}`;
}


module.exports = {
  genCommon,
  genEach
};



