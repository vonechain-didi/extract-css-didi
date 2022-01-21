
const SUFFIX_DEEP = "--remove--deep--hoisted"; // 删除子级中与父级中重复的继承属性
const SUFFIX_COMMON = "--remove--common--hoisted"; // 标记属性被提到公共文件里了
const SAME_SELECTOR = "$$$$same"; // 同意个文件里有相同类名的class flatten的时候用此属性合并样式
const LEVEL_FLAG = "====>>>>"; // 多个父级类依次用====>>>>连接
const HAS_PATCHED = "$$$$haspatched"; // 比较过的样式加上此属性，避免重复比较
const SUFFIX_SAME_FILE_COMMON = "--remove--same--file--common--hoisted"; // 标记属性被提到当前文件的公共样式里了
const ROOT_SELECTOR = "root"; // 第一级的样式，不在嵌套里的


// 这里只列一些常见的具有继承性的属性
const INHERIT_CSS_PROPS = [
  'font-family','font-weight','font-size','color',
  'text-align', 'line-height', 'letter-spacing', 'cursor',
];

/**
 * 属性书写顺序：建议遵循以下顺序。 位置>自身>文本>其他
      a，布局定位属性(影响文档流)：display / position / float / left / top / right / bottom / clear / visibility / z-index / overflow
      b，自身属性(盒模型)：width / height / margin / padding / border / background
      c，文本属性(文本排版)：color / font / text-decoration / text-align / vertical-align / white- space / break-word
      d，其他属性(装饰性,生成内容...)：content / cursor / border-radius / box-shadow / text-shadow / background:linear-gradient …
 */
// 这里只列出前三种属性，剩下的随意
const SORTED_PROPERTY = [
  'display',
  'position',
  'float',
  'left',
  'top',
  'right',
  'bottom',
  'clear',
  'visibility',
  'z-index',
  'overflow',
  'box-sizing',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'flex',
  'align-items',
  'flex-direction',
  'background',
  'line-height',
  'font-size',
  'font-weight',
  'font-family',
  'font',
  'color',
  'text-decoration',
  'text-align',
  'justify-content',
  'vertical-align',
  'white-space',
  'break-word',
  'letter-spacing'
]


const LEVEL_FLAG_REG = new RegExp(LEVEL_FLAG, 'g');
// 下面这几个伪类不做处理 修改ui框架的样式也不处理
const DO_NOT_CHECK_REG = /(\.el-)|(\/deep\/)|(:{1,2}[-a-zA-Z]*)/;

// 换行
const LINE_BREAK_REG = /\n|\r/g;

// ui框架(现有element-ui) 伪类选择器 @media @keyframes 保持原有结构
const KEEP_CSS_RULE_REG = /(\.el-)|(\/deep\/)|(:)|(@media)|(@keyframes)/;

const START_WITH_LETTER = /^[a-zA-Z]/;


// 考虑 1-常规文件依赖引入 2-注释掉的依赖 3-路由文件里的依赖
const ROUGH_PATH_REG = /(?<!\/{2,}\s*)import(?:(\s*?\()|(\s+?.*?))['"]((\.\/|\.\.\/|@\/).*?)['"]\)?/g;
const ACCURATE_PATH_REG = /(?<=import(?:(\s*?\()|(\s+?.*?))['"])((\.\/|\.\.\/|@\/).*?)(?=['"]\)?)/g;
const USEFUL_EXTENSION_REG = /(\.vue$|\.css$|\.less$)/;
const USELESS_EXTENSION_REG = /.js$/;
const VUE_FILE_REG = /\.vue$/;
const CSS_FILE_REG = /\.css$/;
const LESS_FILE_REG = /\.less$/;
// STYLE_REG 不带style标签
// const STYLE_REG = /(?<!\/{2,}\s*)(?<=<style\s*?.*?>)([\s\S]*?)(?=\/\*[\s\S]*?\*\/)*[\s\S]*?(?=\<\/style>)/g;
const STYLE_WITH_TAG_REG = /(?<!\/{2,}\s*)(<style\s*?.*?>)([\s\S]*?)(?=\/\*[\s\S]*?\*\/)*[\s\S]*?(<\/style>)/g;
const ANNOTATION_REG = /(\s*\/\*[\s\S]*?\*\/)|(\s*\/{2,}[\s\S]*?(\n|\r))|(\s*@import\s*.*?;)/g;
const STYLE_START_REG = /(<style\s{0,}.*?>)/;
const IMPORT_CSS_REG = /(?<!\/{2,}\s*)(@import\s+.*?;)/g;
// const CSS_CONTENT_REG = /(?<=(<style\s*?.*?>(\n|\r)(?<=\s*@import\s+.*?;(\n|\r)+)*))[\s\S]*?(?=<\/style>)/g;
const CSS_CONTENT_REG = /\s*<style\s*?.*?>\s+(\s*\/{0,}\s*@import\s+.*?;.*)*([\s\S]*?)(?=<\/style>)/;

// less 语法
const SAME_LEVEL_REG = /\s*\&(.*?)/g;
const CHILD_LEVEL_REG = /\s*\&\s*\>\s*/g;

const DIVIDE_SELECTORS = /,(\s+)?/g;

module.exports = {
  SUFFIX_DEEP,
  SUFFIX_COMMON,
  SUFFIX_SAME_FILE_COMMON,
  SAME_SELECTOR,
  HAS_PATCHED,
  LEVEL_FLAG,
  ROOT_SELECTOR,
  LEVEL_FLAG_REG,
  DO_NOT_CHECK_REG,
  INHERIT_CSS_PROPS,
  LINE_BREAK_REG,
  KEEP_CSS_RULE_REG,
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
  CSS_CONTENT_REG,
  SAME_LEVEL_REG,
  CHILD_LEVEL_REG,
  START_WITH_LETTER,
  DIVIDE_SELECTORS,
  SORTED_PROPERTY,
}