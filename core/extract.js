const utils = require('./utils');
const flatten = require('./flatten');
const con = require('./const');

const {SUFFIX_DEEP, SUFFIX_COMMON, SAME_SELECTOR, HAS_PATCHED, DO_NOT_CHECK_REG, INHERIT_CSS_PROPS, START_WITH_LETTER, SUFFIX_SAME_FILE_COMMON, ROOT_SELECTOR, SAME_LEVEL_REG, CHILD_LEVEL_REG, LEVEL_FLAG, LEVEL_FLAG_REG} = con;


const filterEmpty = function(lists){
  const res = [];
  lists.forEach(list => {
    if(utils.isObject(list.cssJson)){
      !utils.isEmptyObject(list.cssJson) && res.push(list);
    } else if(utils.isArray(list.cssJson)){
      const flag = list.cssJson.some(item=>!utils.isEmptyObject(item));
      flag && res.push(list);
    }
  });
  return res;
}
let dirRecord = [];
const handleInheritProps = function(lists, oldcss){
  let oldKeys = null;
  if(oldcss){
    oldKeys = Object.keys(oldcss);
  }
  lists.forEach(list=>{
    const cssJson = list.cssJson;
    dirRecord = [];
    if(utils.isObject(cssJson)){
      list.filteredSameInheritCss = getFilteredCss(cssJson, list.path, oldcss, oldKeys);
    } else if(utils.isArray(cssJson)){
      dirRecord = [];
      list.filteredSameInheritCss = [];
      cssJson.forEach(css=>list.filteredSameInheritCss.push(getFilteredCss(css,list.path, oldcss, oldKeys)));
    }
  })
  return lists;
}

const getFilteredCss = function(cssObj,file, oldcss, oldKeys){
  const temp = utils.deepClone(cssObj);
  removeSameInheritCss(temp,file, oldcss, oldKeys, null);
  return temp;
}

const removeSameInheritCss = function(cssObj,file,oldcss,oldKeys,dir, parent={}){
  const temp = {};
  const child = {};
  const subs = [];
  // 先广度遍历把css样式属性获取到，然后再深度遍历子集
  for(const selector in cssObj){
    if(INHERIT_CSS_PROPS.includes(selector) && typeof cssObj[selector]==='string'){
      child[selector] = cssObj[selector];
      child[selector+'$$_FROM_$$'] = dirRecord.join(LEVEL_FLAG);
      if(child[selector]===parent[selector]){
        // 这里开始去除子集的样式
        // delete cssObj[selector];
        // 如果在公共文件里有存在相近父级上有相同的样式不同的值也不能提升
        if(oldcss){
          let parentDir = parent[selector+'$$_FROM_$$'];
          let tempSel = dirRecord.join(LEVEL_FLAG);
          let rest = tempSel.replace(parentDir, '');
          rest = rest.split(LEVEL_FLAG).filter(sel=>sel);

          if(!rest.length){
            cssObj[selector+SUFFIX_DEEP] = true;
          } else {
            const parentDirs = parentDir.split(LEVEL_FLAG);
            let re = '';
            rest.forEach(val=>{
              parentDirs.push(val);
              const str = formatSelector(parentDirs.join(' '))?.trim();
              if(str){
                re && (re = (re+'|'));
                re += `${str},|${str}$`;
              }
            })
            const reg = new RegExp(re);
            let canHoisted = true;
            for(let i=0;i<oldKeys.length;i++){
              const key = oldKeys[i];
              if(reg.test(key)){
                if(oldcss[key][selector] && oldcss[key][selector]!==child[selector]){
                  canHoisted = false;
                  break;
                }
              }
            }
            if(canHoisted){
              cssObj[selector+SUFFIX_DEEP] = true;
            }
          }
          
        } else {
          cssObj[selector+SUFFIX_DEEP] = true;
        }
      }
    } else if(typeof cssObj[selector]==='object' && !DO_NOT_CHECK_REG.test(selector)){
      temp[selector] = cssObj[selector];
      subs.push(cssObj[selector]);
    } else if(DO_NOT_CHECK_REG.test(selector)){
      subs.push(cssObj[selector]);
    }
  }
  // 先 深度移除多余的属性
  const keys = Object.keys(temp);
  if(keys.length){
    dir && dirRecord.push(dir);
    keys.forEach(selector=>{
      removeSameInheritCss(temp[selector],file, oldcss, oldKeys, selector, {...parent, ...child});
    });
    dirRecord.pop();
  }


  // 把兄弟级别具有继承属性的相同值的属性提升到父级
  // 必须所有兄弟级都有的属性才能提升
  // 注意： 兄弟级不提升，由于兄弟级元素在dom里不一定是兄弟元素，不是兄弟元素就不能提升样式
  // if(subs.length>1){
  //   const sameCss = {};

  //   for(i=0;i<subs.length;i++){
  //     const css = subs[i];
  //     if(i===0){
  //       // 默认第一个css对象里的继承属性都是需要提升的，然后再检查是否在其他兄弟对象里出现
  //       for(const prop in css){
  //         if(INHERIT_CSS_PROPS.includes(prop) && typeof css[prop]==='string' && !css[prop+SUFFIX_DEEP]){
  //           sameCss[prop] = css[prop]
  //         }
  //       }
  //       if(utils.isEmptyObject(sameCss)){
  //         return;
  //       }
  //     } else {
  //       for(const key in sameCss){
  //         if(sameCss[key]!==css[key]){
  //           delete sameCss[key];
  //         }
  //       }
  //       if(utils.isEmptyObject(sameCss)){
  //         return;
  //       }
  //     }
  //   }
  //   console.log('=================')
  //   console.log(cssObj)
  //   const sameKeys = {};
  //   Object.keys(sameCss).forEach(prop=>{
  //     sameKeys[prop+SUFFIX_BREAD] = true;
  //   });
  //   Object.assign(cssObj, sameCss)
  //   temp.map(css=>{
  //     Object.assign(css, sameKeys)
  //   })
  // }
  

}


/**==========version1 start============ */
// version1 比较机制是拿到一个样式类，如果下一个文件存在这个样式类 就进行比较，两两之间的比较
// 这样会有以下两个问题
// 1，这种方式会导致抽出来的公共样式影响到具有相同样式类的其他文件
// 2，同一文件里相同样式类也被抽到公共的样式表里了
// 需要先把所有文件里相同样式类都拿出来一起比较，再抽出相同的样式 具体做法参考version2
// 
const common = {};
const patch = function(lists){
  const len = lists.length;
  console.log('总共数量', len);
  for(let i=0;i<len-1;i++){
    for(let j=i+1;j<len;j++){
      prepareCompare(lists[i], lists[j], i===len-2)
    }
  }

}

const prepareCompare = function(prev, next, isLast){
  const {path: prevPath, flattenCss: prevCss} = prev;
  const {path: nextPath, flattenCss: nextCss} = next;
  // console.log(prevPath, nextPath);
  // flattenCss 可能是对象或者数组，两个文件比较产生四种可能组合
  if(utils.isObject(prevCss)){
    if(utils.isObject(nextCss)){
      startCompare(prevCss, nextCss, prevPath, nextPath, isLast);
    } else if(utils.isArray(nextCss)){
      nextCss.forEach(next=>{
        startCompare(prevCss, next, prevPath, nextPath, isLast);
      })
    }
  } else if (utils.isArray(prevCss)){
    prevCss.forEach(prev=>{
      if(utils.isObject(nextCss)){
        startCompare(prev, nextCss, prevPath, nextPath, isLast);
      } else if(utils.isArray(nextCss)){
        nextCss.forEach(next=>{
          startCompare(prev, next, prevPath, nextPath, isLast);
        })
      }
    })
  }

}

const startCompare = function(prev, next, prevPath, nextPath, isLast){

  for(const selector in prev){
    if(next[selector]){
      compareAndExtract(selector, prev[selector], next[selector], prevPath, nextPath, prev);
    } else if(prev[selector][SAME_SELECTOR]){ // 同一个文件里相同的样式类
      compareAndExtract(selector, prev[selector], {}, prevPath, null, prev);
    }
  }
  // 最后一轮比较的话需要把最后一个文件单组拿出来处理与之前的文件比较剩下的具有SAME_SELECTOR属性的样式类
  if(isLast){
    for(const selector in next){
      if(next[selector][SAME_SELECTOR]){ // 同一个文件里相同的样式类
        compareAndExtract(selector, next[selector], {}, nextPath, null, next);
      }
    }
  }
}
/**
  common: {
    selector: [
      {
        prop: xxx,
        value: xxx,
        dirs: [],
        paths: [] 
      }
    ]

  }
 */
const compareAndExtract = function(selector, prev, next, prevPath, nextPath, obj){

  for(const prop in prev){
    if(invalidProp(prop, prev, next)){
      continue;
    }
    // 去除顶级标签为选择器的情况，如果以标签选择器背提到公共文件里，则此标签变为全局样式
    // 除非所有文件里都有此标签选择器并有共同的样式表，项目里基本不会满足此条件
    if(START_WITH_LETTER.test(selector)&&!obj[selector].dir && prop!==SAME_SELECTOR){
      console.log(selector, prevPath, obj[selector].dir, prop)
      continue;
    } else if(next[prop] && (prev[prop] === next[prop])){
      setCommonSelector(prop, selector, prev, next, prevPath, nextPath);
    // }
    } else if (prop===SAME_SELECTOR){ // $$$$same 属性值是一个数组
      // 
      const prevSame = prev[prop];
      // prev.$$$$same 自身比较
      const len = prevSame.length;
      compareWithSelf(prevSame, selector, prev, prevPath);
      // if(len>1){
      //   for(let i=0;i<len-1;i++){
      //     const ps = prevSame[i];
      //     // console.log('ps===>',selector,ps)
      //     for(const key in ps){
      //       if(invalidProp(key, ps)){
      //         continue;
      //       }
      //       if(ps[key]===prev[key]){
      //         setCommonSelector(key, selector, prev, ps, prevPath, null);
      //       }
      //     }
      //     for(let j=i+1;j<len;j++){
      //       const ns = prevSame[j];
      //       for(const k in ps){
      //         if(invalidProp(k, ps, ns)){
      //           continue;
      //         }
      //         if(ps[k]===ns[k]){
      //           setCommonSelector(k, selector, ps, ns, prevPath, null);
      //         }
      //       }
      //     }
      //   }
      // } else if (len===1){
      //   const ps = prevSame[0];
      //     for(const key in ps){
      //       if(invalidProp(key, ps)){
      //         continue;
      //       }
      //       if(ps[key]===prev[key]){
      //         setCommonSelector(key, selector, prev, ps, prevPath, null);
      //       }
      //     }
      // }
      // next.$$$$same 先与前一个文件样式比较，然后自身比较
      const nextSame = next[prop];
      const len1 = nextSame?.length || 0;
      compareWithSelf(nextSame, selector, prev, nextPath);
      // if(len1>1){
      //   for(let i=0;i<len1-1;i++){
      //     const ps = nextSame[i];
      //     for(const key in ps){
      //       if(invalidProp(key, ps)){
      //         continue;
      //       }
      //       if(ps[key]===prev[key]){
      //         setCommonSelector(key, selector, prev, ps, nextPath, null);
      //       }
      //     }
      //     for(let j=i+1;j<len1;j++){
      //       const ns = nextSame[j];
      //       for(const k in ps){
      //         if(invalidProp(k, ps, ns)){
      //           continue;
      //         }
      //         if(ps[k]===ns[k]){
      //           setCommonSelector(k, selector, ps, ns, nextPath, null);
      //         }
      //       }
      //     }
      //   }
      // } else if (len1===1){
      //   const ps = nextSame[0];
      //     for(const key in ps){
      //       if(invalidProp(key, ps)){
      //         continue;
      //       }
      //       if(ps[key]===prev[key]){
      //         setCommonSelector(key, selector, prev, ps, prevPath, nextPath);
      //       }
      //     }
      // }

      // prev.$$$$same 与 next.$$$$same 比较
      if(len&&len1){
        prevSame.forEach(ps=>{
          for(const key in ps){
            if(invalidProp(key, ps)){
              continue;
            }
            nextSame.forEach(ns=>{
              if(ns[key] && (ns[key]===ps[key]) && !invalidProp(key, ns)){
                setCommonSelector(key, selector, ps, ns, prevPath, nextPath);
              }
            })
          }
        });
      }

    }
  }

}

const compareWithSelf = function(same, selector, prev, path){
  const len = same?.length||0;
  if(len>1){
    for(let i=0;i<len-1;i++){
      const ps = same[i];
      // console.log('ps===>',selector,ps)
      for(const key in ps){
        if(invalidProp(key, ps)){
          continue;
        }
        if(ps[key]===prev[key]){
          setCommonSelector(key, selector, prev, ps, path, null);
        }
      }
      for(let j=i+1;j<len;j++){
        const ns = same[j];
        for(const k in ps){
          if(invalidProp(k, ps, ns)){
            continue;
          }
          if(ps[k]===ns[k]){
            setCommonSelector(k, selector, ps, ns, path, null);
          }
        }
      }
    }
  } else if (len===1){
    const ps = same[0];
      for(const key in ps){
        if(invalidProp(key, ps)){
          continue;
        }
        if(ps[key]===prev[key]){
          setCommonSelector(key, selector, prev, ps, path, null);
        }
      }
  }
}

const setCommonSelector = function(prop, selector, prev, next, prevPath, nextPath){
  !common[selector] && (common[selector] = []);
      // common[selector].paths.push(`${prevPath}=${nextPath}==>${prop}=${prev[prop]}`) 
      // common[selector][prop] = prev[prop];
  let findIndex = -1;
  for(let i=0;i<common[selector].length;i++){
    if((common[selector][i].prop===prop) && (common[selector][i].value === prev[prop])){
      findIndex = i;
      break;
    }
  }
  prev[prop+SUFFIX_COMMON] = true;
  next && (next[prop+SUFFIX_COMMON] = true);
  if(findIndex>-1){
    const {dirs, paths} = common[selector][findIndex];
    prev.dir && !dirs.includes(prev.dir) && dirs.push(prev.dir);
    !paths.includes(prevPath) && paths.push(prevPath);
    next?.dir && !dirs.includes(next.dir) && dirs.push(next.dir);
    nextPath && !paths.includes(prevPath) && paths.push(prevPath);

    // common[selector][findIndex].dirs.push(prev.dir, next.dir);
    // common[selector][findIndex].paths.push(prevPath, nextPath);
  } else {
    common[selector].push({
      prop: prop,
      value: prev[prop],
      dirs: [],
      paths: []
    });
    const len = common[selector].length;
    const {dirs, paths} = common[selector][len-1];
    prev?.dir && dirs.push(prev.dir);
    paths.push(prevPath);
    next?.dir && !dirs.includes(next.dir) && dirs.push(next.dir);
    nextPath && paths.push(nextPath);
  }
}

/**==========version1 end============ */

/**==========version2 start========== */
// 需要先把所有文件里相同样式类都拿出来一起比较，再抽出相同的样式
// 同一文件内的相同样式抽出来后只能放在原文件里，不能放在公共的样式表里
const commonV2 = {};
const patchV2 = function(lists, oldInfos){
  const len = lists.length;
  console.log('总共数量', len);
  for(let i=0;i<len;i++){
    prepareCompareV2(lists[i], lists.slice(i+1), oldInfos)
  }
}
// const sameSelectorInfos = [];
const prepareCompareV2 = function(current, rest, oldInfos){
  const currentFlattenCss = current.flattenCss;
  const oldCss = oldInfos?.flattenCss;
  const oldKeys = Object.keys(oldCss||{});
  // flattenCss 可能是对象或者数组
  // sameSelectorInfos = [];
  if(utils.isObject(currentFlattenCss)){
    for(const selector in currentFlattenCss){
      // 排除比较过的样式类 或者不需比较的类
      if(isUsefulSelector(selector, currentFlattenCss[selector])){
        currentFlattenCss[selector][HAS_PATCHED] = true;
        findSameSelectorInfos(selector, currentFlattenCss, current, rest, -1, oldCss, oldKeys);
      }
      if(currentFlattenCss[selector][SAME_SELECTOR]){
        // currentFlattenCss[selector][HAS_PATCHED] = true;
        // 进行同文件比较
        // 抽出相同的样式放入当前文件里，不能放入公共的文件
        compareWithSelfV2(selector, currentFlattenCss[selector], current, -1);
      }
    }
  } else if (utils.isArray(currentFlattenCss)){
    currentFlattenCss.forEach((item, i)=>{
      for(const selector in item){
        if(isUsefulSelector(selector, item[selector])){
          item[selector][HAS_PATCHED] = true;
          findSameSelectorInfos(selector, item, current, rest, i, oldCss, oldKeys);
        } 
        if(item[selector][SAME_SELECTOR]){
          // item[selector][HAS_PATCHED] = true;
          // 进行同文件比较
          // 抽出相同的样式放入当前文件里，不能放入公共的文件
          compareWithSelfV2(selector, item[selector], current, i);
        }
      }

    })
  }

}

const findSameSelectorInfos = function(seletcor, css, current, rest, cindex, oldCss, oldKeys){
  const same = [];
  /**
   * same 
   * [{
   *  css //用于所有文件相同样式类的比较
   *  from/index  // 用于同一文件内部相同样式类的比较后的一些属性修改
   * }]
   * //  from/index 无效了
   */
  let saveFiles = [];
  rest.forEach(list=>{
    const nextFlattenCss = list.flattenCss;
    if(utils.isObject(nextFlattenCss)){
      if(nextFlattenCss[seletcor]){
        nextFlattenCss[seletcor][HAS_PATCHED] = true;
        same.push({
         css: nextFlattenCss[seletcor],
         from: list.path,
         index: -1
        });
        saveFiles.push(list.path);
      }
    } else if (utils.isArray(nextFlattenCss)){
      nextFlattenCss.forEach((item, i)=>{
        if(item[seletcor]){
          item[seletcor][HAS_PATCHED] = true;
          same.push({
            css: item[seletcor],
            from: list.path,
            index: i
           });
           saveFiles.push(list.path);
        }
      })
    }
  });
  if(same.length){
    same.unshift({
      css: css[seletcor],
      from: current.path,
      index: cindex
    });
    saveFiles.push(current.path);
    saveFiles = [...new Set(saveFiles)]
    startCompareV2(seletcor, same, oldCss, oldKeys, saveFiles.length)
  }

}

const startCompareV2 = function(selector, lists, oldCss,oldKeys, fileNums){
  // 这里需要抽所有文件都相同的样式，所以只需拿出第一个文件的样式与剩余的比较即可
  // 如果已经存在公共文件了，需要比对此选择器是否已经在公共样式里的

  // 下面三种比较机制， 
  // 第一种，漏掉了所有SAME_SELECTOR部分的比较
  // 第二种，漏掉了非首个元素后的所有SAME_SELECTOR部分的相互比较
  // 第三种，把所有样式都拿出来做个映射表。

  // const len = lists.length;

  /*************第一种机制 开始，只比较第一层，不比较SAME_SELECTOR部分*********** */
  // const first = lists[0].css;
  // for(const prop in first){
  //   if(invalidProp(prop, first)){
  //     continue;
  //   }
  //   if(prop===SAME_SELECTOR){
      
  //     // 进行同文件比较
  //     // 抽出相同的样式放入当前文件里，不能放入公共的文件
  //     // compareWithSelfV2(first[prop], selector, )
  //     // 同文件比较放在这里不全面

  //     continue;
  //   }

  //   let i = 1;
  //   let dirs = first.dir?[first.dir]:[ROOT_SELECTOR];
  //   for(; i<len; i++){
  //     const temp = lists[i].css;
  //     if(temp[prop] !== first[prop]){
  //       break;
  //     }
  //     const dir = temp.dir || ROOT_SELECTOR;
  //     !dirs.includes(dir) && dirs.push(dir);
  //   }
  //   if(i===len){
  //     // 判断是否在公共样式里存在
  //     const tempSel = selector.replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ');
  //     if(oldCss){
  //       if(dirs.includes(ROOT_SELECTOR)){
  //         // 公共样式表里存在这个类说明已经被抽离过的样式
  //         if(oldCss[tempSel]){
  //           continue;
  //         }
  //         // if(oldCss[tempSel] && oldCss[tempSel][prop]){
  //         //   continue;
  //         // }
  //       } else {
  //         const tempCommonSels = Object.keys(oldCss);
  //         let cSel = dirs[0].replace(LEVEL_FLAG_REG, ' ') + ' '+ tempSel;
  //         let n = 0;
  //         for(;n<tempCommonSels.length;n++){
  //           if(tempCommonSels[n].includes(cSel)){
  //             break;
  //             // if(oldCss[tempCommonSels[n]][prop]){
  //             //   break;
  //             // }
  //           }
  //         }
  //         if(n!==tempCommonSels.length){
  //           continue;
  //         }
  
  //       }
  //     }
      
  //     !commonV2[selector] && (commonV2[selector]=[]);
      
  //     // 需要把所有文件的dir 收集起来
  //     // commonV2[selector].prop = prop;
  //     commonV2[selector].push({
  //       prop,
  //       value: first[key],
  //       dirs
  //     });

  //     // 给属性标记为已提到公共样式里
  //     lists[0].css[prop+SUFFIX_COMMON] = true;
  //     for(let j=1; j<len; j++){
  //       lists[j].css[prop+SUFFIX_COMMON] = true;
  //     }
  //   }
  // }
  /*************第一种机制 结束*********** */

/*************第二种机制 开始，如果lists第一个元素里包含SAME_SELECTOR部分，拿第一个元素里所有属性与后面的比较，包括比较所有SAME_SELECTOR部分*********** */
  // const first = utils.deepClone(lists[0].css);
  // const firstSame = first[SAME_SELECTOR];
  // if(firstSame){
  //   firstSame.forEach(item=>{
  //     for(const prop in item){
  //       if(!invalidProp(prop, item)){
  //         first[prop+'$$__$$'+item.dir] = item[prop];
  //       }
  //     }
  //   })
  // }

  // // if(selector==='.el-checkbox__inner'){
  // //   console.log(JSON.stringify(first))
  // // }
  // for(const key in first){
  //   if(invalidProp(key, first)){
  //     continue;
  //   }
  //   if(key===SAME_SELECTOR){
      
  //     // 进行同文件比较
  //     // 抽出相同的样式放入当前文件里，不能放入公共的文件
  //     // compareWithSelfV2(first[prop], selector, )
  //     // 同文件比较放在这里不全面

  //     continue;
  //   }

  //   let keys = key.split('$$__$$');
  //   let prop = keys[0];
  //   let suffixDir = keys[1];

  //   let i = 1;
  //   let dirs = (suffixDir||first.dir)?[suffixDir||first.dir]:[ROOT_SELECTOR];
  //   for(; i<len; i++){
  //     const temp = lists[i].css;
  //     if(temp[prop] !== first[key] && !temp[SAME_SELECTOR]){
  //       break;
  //     } else {
  //       let exist = false;
  //       if(temp[prop] === first[key]){
  //         exist = true;
  //         const dir = temp.dir || ROOT_SELECTOR;
  //         !dirs.includes(dir) && dirs.push(dir);
  //       }
  //       const same = temp[SAME_SELECTOR];
  //       if(same){
  //         same.forEach(item=>{
  //           if(item[prop]===first[key]){
  //             exist = true;
  //             const dir = item.dir || ROOT_SELECTOR;
  //             !dirs.includes(dir) && dirs.push(dir);
  //           }
  //         });
  //       }
  //       if(!exist){
  //         break;
  //       }
  //     }

  //   }
  //   if(i===len){
  //     // 判断是否在公共样式里存在
  //     const tempSel = selector.replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ');
  //     if(oldCss){
  //       if(dirs.includes(ROOT_SELECTOR)){
  //         // 公共样式表里存在这个类说明已经被抽离过的样式
  //         if(oldCss[tempSel]){
  //           continue;
  //         }
  //         // if(oldCss[tempSel] && oldCss[tempSel][prop]){
  //         //   continue;
  //         // }
  //       } else {
  //         const tempCommonSels = Object.keys(oldCss);
  //         let cSel = dirs[0].replace(LEVEL_FLAG_REG, ' ') + ' '+ tempSel;
  //         let n = 0;
  //         for(;n<tempCommonSels.length;n++){
  //           if(tempCommonSels[n].includes(cSel)){
  //             break;
  //             // if(oldCss[tempCommonSels[n]][prop]){
  //             //   break;
  //             // }
  //           }
  //         }
  //         if(n!==tempCommonSels.length){
  //           continue;
  //         }
  
  //       }
  //     }
      
  //     !commonV2[selector] && (commonV2[selector]=[]);
      
  //     // 需要把所有文件的dir 收集起来
  //     // commonV2[selector].prop = prop;
  //     commonV2[selector].push({
  //       prop,
  //       value: first[key],
  //       dirs
  //     });

  //     // 给属性标记为已提到公共样式里
  //     if(!suffixDir){
  //       lists[0].css[prop+SUFFIX_COMMON] = true;
  //     } else {
  //       console.log(suffixDir, first.from, JSON.stringify(lists))
  //       for(let m=0;m<firstSame.length;m++){
  //         if(firstSame[m].dir===suffixDir){
  //           firstSame[m][prop+SUFFIX_COMMON] = true;
  //         }
  //       }
  //     }
      
  //     for(let j=1; j<len; j++){
  //       if(lists[j].css[prop]===first[key]){
  //         lists[j].css[prop+SUFFIX_COMMON] = true;
  //       }
  //       if(lists[j].css[SAME_SELECTOR]){
  //         lists[j].css[SAME_SELECTOR].forEach(item=>{
  //           if(item[prop]===first[key]){
  //             item[prop+SUFFIX_COMMON] = true;
  //           }
  //         })
  //       } 
  //     }
  //   }
  // }
  /*************第二种机制 结束*********** */

  /*************第三种机制 开始  把所有样式都拿出来*********** */
  // 这里需要把具有相同的样式抽出来进行比较
  // if(selector==='.info-name'){
  //   console.log(JSON.stringify(lists))
  // }
  const stylesMap = {};
  lists.forEach(list=>{
    /** list
     {
      css: css[seletcor],
      from: current.path,
      index: cindex
    }
    */
    const css = list.css;
    for(const key in css){
      if(invalidProp(key, css)){
        continue;
      }
      const selectorVal = `${key}$$__$$${css[key]}`;
      !stylesMap[selectorVal] && (stylesMap[selectorVal]=[]);
      stylesMap[selectorVal].push({
        dir: css.dir||ROOT_SELECTOR,
        from: list.from
      }) 
    }
    if(css[SAME_SELECTOR]){
      css[SAME_SELECTOR].forEach(item=>{
        for(const prop in item){
          if(invalidProp(prop, item)){
            continue;
          }
          const selectorVal = `${prop}$$__$$${item[prop]}`;
          !stylesMap[selectorVal] && (stylesMap[selectorVal]=[]);
          stylesMap[selectorVal].push({
            dir: item.dir||ROOT_SELECTOR,
            from: list.from
          }) 
        }
      })
    }
  });
  // if(selector==='.submit-btn'){
  //   console.log(JSON.stringify(stylesMap), fileNums);
  //   console.log('\n');
  //   console.log(JSON.stringify(lists));
  //   console.log('\n');
  // }
  for(const prop in stylesMap){
    const arr = prop.split('$$__$$');
    const infos = stylesMap[prop];
    const dirs = [];
    const files = [];
    infos.forEach(info=>{
      !dirs.includes(info.dir) && dirs.push(info.dir);
      !files.includes(info.from) && files.push(info.from);
    })
    // 对于选择器没有父级选择器（即没有dir属性），要提到公共样式里的前提是具有相同选择器的所有文件都要有此样式
    const index = dirs.indexOf(ROOT_SELECTOR);
    const flen = files.length;
    if(index>-1 && flen<fileNums){
      // dirs.splice(index,1);
      continue;
    }
    
    if(dirs.length && flen>1){
      if(index===-1 && dirs.length===flen){

      } else if(flen<fileNums){
        // 再次校验含有dir文件的样式需含有arr[0]]=arr[1]
        const temp = [];

        dirs.forEach((dir,index)=>{
          for(let i=0;i<lists.length;i++){
            const css = lists[i].css;
            let sameDir = false;
            let end = true;
            if(css.dir===dir){
              sameDir = true;
              if(css[arr[0]]===arr[1]){
                end = false;
              }
            } else if (css[SAME_SELECTOR]){
              // const isExist = false;
              for(let j=0;j<css[SAME_SELECTOR].length;j++){
                const item = css[SAME_SELECTOR][j];
                // if(item.dir===dir && item[arr[0]]===arr[1]){
                //   isExist = true;
                //   break;
                // }
                if(item.dir===dir){
                  sameDir = true;
                  if(item[arr[0]]===arr[1]){
                    end = false;
                    break;
                  }
                }
              }
              

              // end = !css[SAME_SELECTOR].some(item=>item.dir===dir && item[arr[0]]===arr[1]);
            }

            if(sameDir&&end){
              temp.push(index);
              break;
            }
          }
        })

        temp.reverse();
        temp.forEach(i=>{
          dirs.splice(i,1);
        })

        if(!dirs.length){
          continue;
        }
      }
      
      // if(selector==='.submit-btn'){
      //   console.log(JSON.stringify(dirs), arr[0], arr[1]);
      // }
      if(oldCss){
        // console.log(JSON.stringify(oldCss))
        // return;
        const tempSel = formatSelector(selector);
        if(dirs.includes(ROOT_SELECTOR)){
          // 公共样式表里存在这个类说明已经被抽离过的样式
          if(oldCss[tempSel]){
            continue;
          }
          let n = 0;
          for(;n<oldKeys.length;n++){
            if(oldKeys[n].includes(tempSel)){
              break;
            }
          }
          if(n!==oldKeys.length){
            continue;
          }
        } else {
          // const tempCommonSels = Object.keys(oldCss);
          let cSel = formatSelector(selector, dirs[0]); 
          
          let n = 0;
          for(;n<oldKeys.length;n++){
            if(oldKeys[n].includes(cSel)){
              break;
            }
          }
          if(n!==oldKeys.length){
            continue;
          }
  
        }
      }




      !commonV2[selector] && (commonV2[selector]=[]);
      
      // 需要把所有文件的dir 收集起来
      // commonV2[selector].prop = prop;
      commonV2[selector].push({
        prop: arr[0],
        value: arr[1],
        dirs
      });

      lists.forEach(list=>{
        if(list.css[arr[0]]===arr[1]){
          if(fileNums===files.length){
            list.css[arr[0]+SUFFIX_COMMON] = true;
          } else {
            dirs.includes(list.css.dir) && (list.css[arr[0]+SUFFIX_COMMON] = true);
          }
         
        }
        if(list.css[SAME_SELECTOR]){
          list.css[SAME_SELECTOR].forEach(item=>{
            if(item[arr[0]]===arr[1]){
              dirs.includes(item.dir) && (item[arr[0]+SUFFIX_COMMON] = true);
            }
          })
        }
      })
    } 
    // else if(!dirs.length && files.length===fileNums) {
    //   if(oldCss){
    //     // console.log(JSON.stringify(oldCss))
    //     // return;
    //     const tempSel = formatSelector(selector);
    //     if(oldCss[tempSel]){
    //       continue;
    //     }
    //     let n = 0;
    //     for(;n<oldKeys.length;n++){
    //       if(oldKeys[n].includes(tempSel)){
    //         break;
    //       }
    //     }
    //     if(n!==oldKeys.length){
    //       continue;
    //     }
    //   }

    //   !commonV2[selector] && (commonV2[selector]=[]);
      
    //   // 需要把所有文件的dir 收集起来
    //   // commonV2[selector].prop = prop;
    //   commonV2[selector].push({
    //     prop: arr[0],
    //     value: arr[1],
    //     dirs: [ROOT_SELECTOR]
    //   });

    //   lists.forEach(list=>{
    //     if(list.css[arr[0]]===arr[1]){
    //       list.css[arr[0]+SUFFIX_COMMON] = true;
    //     }
    //     if(list.css[SAME_SELECTOR]){
    //       list.css[SAME_SELECTOR].forEach(item=>{
    //         if(item[arr[0]]===arr[1]){
    //           item[arr[0]+SUFFIX_COMMON] = true;
    //         }
    //       })
    //     }
    //   })

    // }
    
  }
  /*************第三种机制 结束*********** */
  
}

const formatSelector = function(selector, dir){
  if(!dir){
    return selector.replace(SAME_LEVEL_REG, '$1').replace(/,.*/g,'').replace(CHILD_LEVEL_REG, ' > ');
  } else {
    const temp = dir.replace(LEVEL_FLAG_REG, ' ') + ' '+ selector;
    return temp.replace(SAME_LEVEL_REG, '$1').replace(/,.*/g,'').replace(CHILD_LEVEL_REG, ' > ');
  }
}

const isUsefulSelector = function(selector, css){
  if(START_WITH_LETTER.test(selector) || css[HAS_PATCHED] || DO_NOT_CHECK_REG.test(selector)){
    return false;
  }
  return true
}


const compareWithSelfV2 = function(selector, css, list, index){
  const same = css[SAME_SELECTOR];
  const len = same?.length||0;
  const dirs = [css.dir||ROOT_SELECTOR];
  if(len>1){
    // 找出每个相同的样式
    for(const key in css){
      if(invalidProp(key, css)){
        continue;
      }
      let i = 0;
      for(;i<len;i++){
        if(same[i][key]!==css[key]){
          break;
        }
        const temp = same[i].dir || ROOT_SELECTOR;
        !dirs.includes(temp) && dirs.push(temp);
      }
      if(i===len){
        setCommonSelectorV2(key, selector, css, same, list, index, dirs);
      }
    }
    
  } else if (len===1){
    const ps = same[0];
      for(const key in css){
        if(invalidProp(key, css)){
          continue;
        }
        if(ps[key]===css[key]){
          const temp = ps.dir || ROOT_SELECTOR;
          !dirs.includes(temp) && dirs.push(temp);
          setCommonSelectorV2(key, selector, css, ps, list, index, dirs);
        }
      }
  }
}

const setCommonSelectorV2 = function(prop, selector, css, ps, list, i, dirs){
  const sel = getSelector(selector, dirs);
  if(!list.common){
    list.common = {
      [i]: {
        [sel]: {}
      }
    }
  } else if(!list.common[i]){
    list.common[i] = {
      [sel]: {}
    }
  } else if (!list.common[i][sel]){
    list.common[i][sel] = {};
  }
  if(list.common[i][sel][prop]?.includes('!important')){
    // 不能覆盖
  } else {
    list.common[i][sel][prop] = css[prop];
  }
  
  css[prop+SUFFIX_SAME_FILE_COMMON] = true;
  // console.log(css, list.path)
  if(utils.isObject(ps)){
    ps[prop+SUFFIX_SAME_FILE_COMMON] = true;
  } else if(utils.isArray(ps)){
    ps.forEach(item=>(item[prop+SUFFIX_SAME_FILE_COMMON]=true));
  }
}

const getSelector = function(selector, dirs){
  if(dirs.length>0){
    const index = dirs.indexOf(ROOT_SELECTOR)
    if(index>-1){
      dirs.splice(index,1)
    }
    if(dirs.length){
      let str = '';
      dirs.forEach(dir=>{
        str += `${dir.replace(LEVEL_FLAG_REG, ' ')} ${selector},`;
      })
      return str.slice(0,-1);
    } else {
      return selector;
    }
  } else {
    return selector;
  }
};

/**==========version2 end========== */
const invalidProp = function(prop, prev, next){
  return prop==='dir' || 
         prop === HAS_PATCHED || 
         prop === SAME_SELECTOR || 
         prop.includes(SUFFIX_DEEP) || 
         prop.includes(SUFFIX_COMMON) || 
         prop.includes(SUFFIX_SAME_FILE_COMMON) || 
         prev[prop+SUFFIX_DEEP] || 
         prev[prop+SUFFIX_COMMON] || 
         prev[prop+SUFFIX_SAME_FILE_COMMON] || 
         (next && (next[prop+SUFFIX_DEEP] || next[prop+SUFFIX_COMMON] || next[prop+SUFFIX_SAME_FILE_COMMON]))||
         typeof prev[prop] !== 'string';
}

const extract = function(lists, oldInfos, sortAttr){
  // 去除空的样式表
  const availLists = filterEmpty(lists);
  // 把具有继承属性相同的值提到父级上
  const handledInheritLists = handleInheritProps(availLists, oldInfos?.cssJson);

  const flatened = flatten(handledInheritLists);
  if(sortAttr){
    // 给css属性排序，就不需要进行下面的比对流程了
    return { flatened };
  }

  let flattenOldInfos = null
  if(oldInfos){
    oldInfos.filteredSameInheritCss = oldInfos.cssJson;
    flattenOldInfos = flatten([oldInfos]);
  }
  const startTime = process.hrtime.bigint();
  console.info('开始比对：', startTime, '纳秒');
  patchV2(flatened, flattenOldInfos&&flattenOldInfos[0]);
  const endTime = process.hrtime.bigint();
  console.info('比对完成：', endTime, '纳秒');
  const delta = endTime-startTime;
  console.info(`对比耗时：${delta} 纳秒 ===> ${parseInt(delta)/1000000000} 秒`)
  return {flatened, common: commonV2}
}


module.exports = extract