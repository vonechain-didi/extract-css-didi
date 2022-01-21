const utils = require('./utils');
const con = require('./const');

const {LEVEL_FLAG_REG, SAME_LEVEL_REG, CHILD_LEVEL_REG, ROOT_SELECTOR} = con;

const object2css = function(data){
  if(!data || !utils.isObject(data)){
    return;
  }
  const css = {};

  for(const selector in data){
    const sels = data[selector];
    let multiSelector = '';
    // 注意选择器里有逗号的情况，直接拼接会出问题，需要拆开分别拼接
    if(selector.includes(',')){
      multiSelector = selector.split(',');
    }
    sels.forEach(sel=>{
      const dirs = sel.dirs;
      /**
       * "dirs": [],
  
       * "dirs": [
          "#talkbubblee",
          "#talkbubble"
        ],
        "dirs": [
        "#talkbubblee====>>>>.imgMsg",
        "#talkbubble====>>>>.imgMsg"
      ]
       * 
       */
      if(dirs.length&&!dirs.includes(ROOT_SELECTOR)){
        // dirs.forEach(dir => {
        //   let temp = null;
        //   const sels = dir.split('====>>>>');
        //   sels.forEach(path=>{
        //     if(!temp){
        //       !css[path] && (css[path] = {});
        //       temp = css[path];
        //     } else {
        //       !temp[path] && (temp[path] = {});
        //       temp = temp[path];
        //     }
        //   });
        //   !temp[selector] && (temp[selector]={});
        //   temp[selector][sel.prop] = sel.value;
        // });
        let sel_str = '';
        if(dirs.includes(ROOT_SELECTOR)){
          sel_str += `${selector}, `;
        } else {
          dirs.forEach(dir => {
            /**
             * selector => 'as,cs'
             * dir => 'a,b'
             * 
             * 扩展后
             * a as, a cs, b as, b cs
             */
            if(dir.includes(',')){
              dir.split(',').forEach(d=>{
                d = d?.trim();
                if(multiSelector){
                  multiSelector.forEach(s=>{
                    s = s?.trim();
                    sel_str += `${d.replace(LEVEL_FLAG_REG, ' ')} ${s},`;
                  })
                } else {
                  sel_str += `${d.replace(LEVEL_FLAG_REG, ' ')} ${selector},`;
                }
              })
            } else {
              if(multiSelector){
                multiSelector.forEach(s=>{
                  s = s?.trim();
                  sel_str += `${dir.replace(LEVEL_FLAG_REG, ' ')} ${s},`;
                })
              } else {
                sel_str += `${dir.replace(LEVEL_FLAG_REG, ' ')} ${selector},`;
              }
            }
          });
        }

        let temp = sel_str.slice(0, -1).split(',');
        sel_str = [...new Set(temp)].join(',');
        
        
        sel_str = sel_str.replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ');

        !css[sel_str] && (css[sel_str] = {});
        css[sel_str][sel.prop] = sel.value;
      } else {
        if(multiSelector){
          multiSelector.forEach(s=>{
            s = s?.trim().replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ');
            if(!css[s]){
              css[s] = {};
            }
            css[s][sel.prop] = sel.value;
          })
        } else {
          const temp = selector.trim().replace(SAME_LEVEL_REG, '$1').replace(CHILD_LEVEL_REG, ' > ');
          if(!css[temp]){
            css[temp] = {};
          }
          css[temp][sel.prop] = sel.value;
        }
      }
      
    })

  }

  return css;
}

module.exports = object2css;