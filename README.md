
**`手写过程中遇到问题，耗时多的在 importDeclaration，正确写法应为 ImportDecalration`**

## 手写 webpack
> webpack 将用模块化工具写出的代码打包在一起

### 模拟 commonJs 进行编写代码
```
├── README.md
└── src
    ├── add.js
    ├── index.html
    └── index.js
```

#### <font color="red">Uncaught ReferenceError: require is not defined</font>
```javascript
// add.js
exports.default = function (a, b) { return a + b; }
// index.js
var add = require('add.js').default
```
```html
<script src="index.js"></script>
```
> require 方法没有定义

1. 读取文件
2. webpack 是把读取文件拼成一个新文件  bundle.js
3. 使用 eval 或 new function 方法运行读取的字符串

### 1.模拟 commonJS 模块导出
```javascript
// 1. 读取的文件为字符串，使用 eval 运行字符串
var exports = {}
eval('exports.default=function (a,b) {return a+b;}')
console.log(exports.default(1,2))
```

### 2. 使用自执行函数避免`eval`执行过程中定义的变量绑定到全局造成变量污染
```javascript
var exports = {}
(function(exports,code){
    eval(code)
})(exports, 'exports.default=function(a,b){return a+b}')
console.log(exports.default(1,3))
```

### 3.模拟 require 导入模块，迷你 webpack
```javascript
(function(list){
    function require(file) {
        var exports = {};
        (function(exports, code) {
            eval(code)
        })(exports, list[file])
        return exports
    }
    require('index.js')
})({
    'index.js': `var add = require('add.js').default; console.log(add(2,3))`,
    'add.js': `exports.default = function(a,b){return a+b}`
})
```

### ES6 Modules 实现
#### 1. 代码改造
```
// add.js
export default (a,b) => a + b
// index.js
import add from 'add.js'
add(2,3)
```
#### 环境配置
> babel 全家桶
*   @babel/core babel 核心代码，可将 ES6 代码转换为 ES5
*   @babel/preset-env 设置预设环境，根据配置目标运行环境启用需要的 babel 插件
*   @babel/parser 解析代码中生成的 AST(Abstract Syntax Tree, AST) 抽象语法树
*   @babel/traverse 对抽象语法树（AST）节点进行递归遍历

#### webpack.js 解析
```flow

st=>start: Start
e=>end: 需求变更备案
op1=>operation: 需求基线确定|past
op2=>operation: 内部需求变更|current
op3=>operation: 下一个版本|current
op4=>operation: 与客户协商需求变更|current
op5=>operation: 更新需求文档|current
op6=>operation: 通知项目组开发和测试|current
op7=>operation: 客户需求变更流程|current
 
 
 
cond1=>condition: 是否对实际业务产生影响
cond2=>condition: 是否接受当前版本变更
 
st->op1(right)->op1(right)->op2->cond1
cond1(no)->cond2
cond1(yes)->op4->op7
cond2(yes)->op5
cond2(no)->op3
op5->op6
```
