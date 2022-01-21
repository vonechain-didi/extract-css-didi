

const getType = (val)=>{
  return Object.prototype.toString.call(val).slice(8,-1);
}

const isNumber = (val)=>{
  return getType(val) === 'Number';
}

const isObject = (val)=>{
  return getType(val) === 'Object';
}

const isArray = (val)=>{
  return getType(val) === 'Array';
}

const isEmptyObject = (val)=>{
  for(let key in val) {
    return false;
  }
  return true;
}
//这里都是json对象没有其他类型 JSON API可以满足需求
const deepClone = function(obj){ 
  return JSON.parse(JSON.stringify(obj));
}

// 获取最内层对象
const getInnermostLevel = function(propArr, obj){
  if(!propArr.length){
    return obj;
  }
  for(let i=0;i<propArr.length;i++){
    const key = propArr[i];
    !obj[key] && (obj[key] = {});
    obj = obj[key]; 
  }
  return obj;
}

module.exports = {
  isNumber,
  isObject,
  isArray,
  isEmptyObject,
  deepClone,
  getInnermostLevel
}