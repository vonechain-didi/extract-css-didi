
/**
 * '\n' +
        '.popper-member-card {\n' +
        '  top: 61px !important;\n' +
        '}\n' +
        '.popper-member-card .popper__arrow {\n' +
        '  display: none;\n' +
        '}\n',
 */

const testData = '\n' +
'.popper-member-card {\n' +
'  top: 61px !important;\n' +
'}\n' +
'.popper-member-card .popper__arrow {\n' +
'  display: none;\n' +
'}\n';
const testData1 = '\n' +
'.cropper-dialog {\n' +
'  & /deep/ .el-dialog {\n' +
'    width: max-content;\n' +
'  }\n' +
'  & /deep/ .el-dialog__body {\n' +
'    padding: 20px;\n' +
'  }\n' +
'  & /deep/ .el-button {\n' +
'    width: 145px;\n' +
'  }\n' +
'}\n' +
'.cropper-wrap {\n' +
'  display: flex;\n' +
'  .cropper-box {\n' +
'    margin-right: 20px;\n' +
'    width: 375px;\n' +
'    height: 176px;\n' +
'  }\n' +
'  .preview-box {\n' +
'    .preview-title {\n' +
'      display: flex;\n' +
'      min-width: 100px;\n' +
'      justify-content: space-between;\n' +
'      align-items: center;\n' +
'      height: 32px;\n' +
'      color: rgba(30, 35, 48, 1);\n' +
'      font-family: PingFangSC-Medium;\n' +
'      .preveiw-upload {\n' +
'        color: #0067ed;\n' +
'        cursor: pointer;\n' +
'      }\n' +
'    }\n' +
'    .preview-img {\n' +
'      border-radius: 2px;\n' +
'    }\n' +
'  }\n' +
'}\n' +
'.fun-btn {\n' +
'  margin-top: 16px;\n' +
'  i {\n' +
'    margin-right: 16px;\n' +
'    font-size: 18px;\n' +
'    color: #8c8c8c;\n' +
'    cursor: pointer;\n' +
'    &:hover {\n' +
'      color: #0067ed;\n' +
'    }\n' +
'  }\n' +
'  .reUpload {\n' +
'    margin-right: 16px;\n' +
'  }\n' +
'}\n'

const utils = require('./utils');
const con = require('./const');

const css2object = function(data){
  let cssObj = {};
  let parentSelectors = [];
  let firstBracketStartIndex = -100;
  let secondBracketStartIndex = -100;
  let firstBracketEndIndex = -100;

  let style = data.replace(con.LINE_BREAK_REG, '').trim();
  // .popper-member-card {  top: 61px !important;}.popper-member-card .popper__arrow {  display: none;}
  // console.log(style)
  while (style.length){
    firstBracketStartIndex = style.indexOf('{');
    firstBracketEndIndex = style.indexOf('}');
    firstBracketStartIndex>-1&&(secondBracketStartIndex = style.indexOf('{', firstBracketStartIndex+1));
    // console.log(firstBracketStartIndex, firstBracketEndIndex, secondBracketStartIndex)
    /**
     * 有三种情况
     * 1 没有嵌套 div{top:1px} p{left: 1px}
     *   如果第二个 { 不存在，说明只有一个 {}
     *   如果第二个 { 所在的位置在第一个 } 的后面，说明第一个{} 没有嵌套
     *   排除 xxxx;}} .sdfd{} 这种形式
     *   (secondBracketStartIndex==-1 || secondBracketStartIndex>firstBracketEndIndex)&&(firstBracketStartIndex>-1 && firstBracketStartIndex<firstBracketEndIndex)
     * 
     * 2 嵌套样式
     *   如果第二个 { 所在的位置在第一个 } 的前面，说明第一个{} 有嵌套 {{}{}}}
     *   secondBracketStartIndex>-1&&secondBracketStartIndex<firstBracketEndIndex
     * 
     * 3 处理嵌套结尾的样式
     *   xxxx;}} .sdfd{} 或 xxxx;}} 这种形式
     *   (firstBracketStartIndex==-1&&firstBracketEndIndex>-1)||firstBracketEndIndex<firstBracketStartIndex
     */
     const condition1 = (secondBracketStartIndex==-1 || secondBracketStartIndex>firstBracketEndIndex)&& firstBracketStartIndex>-1 && firstBracketStartIndex<firstBracketEndIndex;
     const condition2 = secondBracketStartIndex>-1&&secondBracketStartIndex<firstBracketEndIndex;
     const condition3 = (firstBracketStartIndex==-1&&firstBracketEndIndex>-1)||firstBracketEndIndex<firstBracketStartIndex;
    if(condition1){
      const selector = style.slice(0,firstBracketStartIndex).trim();
      const css = style.slice(firstBracketStartIndex+1,firstBracketEndIndex).trim();
      let tempObj = cssObj;
      if(parentSelectors.length){ 
        tempObj = utils.getInnermostLevel(parentSelectors, tempObj);
      }
      !tempObj[selector] && (tempObj[selector] = {});
      fillPropsForObj(css.split(';'), tempObj[selector]);


      style = style.slice(firstBracketEndIndex+1);
    } else if(condition2) {
      // 如果第二个 { 所在的位置在第一个 } 的前面，说明第一个{} 有嵌套 {{}{}}}
      const selector = style.slice(0,firstBracketStartIndex).trim();
      parentSelectors.push(selector);
      const tempStr = style.slice(firstBracketStartIndex+1, secondBracketStartIndex);
      const cssEnd = tempStr.lastIndexOf(';');
      if(cssEnd>-1){
        // 两个相邻的 { 之间有css
        const css = tempStr.slice(0, cssEnd).trim();
        let tempObj = cssObj;
        tempObj = utils.getInnermostLevel(parentSelectors, tempObj);
        fillPropsForObj(css.split(';'), tempObj);


        style = style.slice(firstBracketStartIndex+1+cssEnd+1)
      } else {
         // 两个相邻的 { 之间没有css
         style = style.slice(firstBracketStartIndex+1);
      }

    } else if (condition3){
      // }}}
      const css = style.slice(0, firstBracketEndIndex);
      if(css.trim() && css.indexOf(':')>-1){
        let tempObj = cssObj;
        tempObj = utils.getInnermostLevel(parentSelectors, tempObj);
        fillPropsForObj(css.split(';'), tempObj);
      }
      

      parentSelectors.pop()
      style = style.slice(firstBracketEndIndex+1)
    }

  }
  // console.log(JSON.stringify(cssObj))
  return cssObj;
}


// const getInnermostLevel = function(propArr, obj){
//   if(!propArr.length){
//     return obj;
//   }
//   for(let i=0;i<propArr.length;i++){
//     const key = propArr[i];
//     !obj[key] && (obj[key] = {});
//     obj = obj[key]; 
//   }
//   return obj;
// }

const fillPropsForObj = function(lists, obj){
  // 暂时排除掉less里方法的调用 src/view/chat/common-popper/MsgBgPopper.less
  lists.forEach(item => {
    if(item && item.indexOf(':')>-1){
      const temp = item.split(':');
      if(obj[temp[0].trim()]?.includes('!important')){
        // 不能覆盖优先级高的样式
        return;
      }
      obj[temp[0].trim()] = temp[1].trim()
    }
  });
}

// css2object(testData1);

module.exports = css2object;


