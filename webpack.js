
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser') // 将字符串转换在成 AST
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')

/**
 * 分析模块
 * @param file 文件路径
 */
function getModuleInfo(file) {
    // 1. 读取文件
    const body = fs.readFileSync(file, 'utf-8') // body 为字符串
    // 2. @babel/parser 字符串进行解析 编译 ast
    const ast = parser.parse(body, {
        sourceType: 'module'
    })
    // 3. @babel/traverse 遍历 ast 查找依赖 import
    let deps = {}
    traverse(ast, {
        //    visitor 访问者
        // 目前这个访问者没有运行
        ImportDeclaration({node}) {
            const dirname = path.dirname(file)
            const absPath = './' + path.join(dirname, node.source.value)
            deps[node.source.value] = absPath
        }
    })

    // ES6 转 ES5
    const {code} = babel.transformFromAst(ast, null, {
        presets: ['@babel/preset-env']
    })

    const moduleInfo = {
        file,
        deps,
        code
    }

    return moduleInfo
}

function parseModules(file) {
    const entry = getModuleInfo(file)
    const temp = [entry]
    const depsGraph = {}

    // 递归调用过程
    getDeps(temp, entry)

    temp.forEach(moduleInfo => {
        depsGraph[moduleInfo.file] = {
            deps: moduleInfo.deps,
            code: moduleInfo.code
        }
    })

    return depsGraph
}

function getDeps(temp, {deps}) {
    Object.keys(deps).forEach(key => {
        const child = getModuleInfo(deps[key])
        temp.push(child)
        getDeps(temp, child)
    })
}

function bundle(file) {
    const depsGraph = JSON.stringify(parseModules(file))
    return `(function(graph) {
        require('${file}')
        function require(file) {
            var exports = {}
            function absRequire(relPath) {
                return require(graph[file].deps[relPath])
            }
            (function(require, exports, code){
                eval(code)
            })(absRequire, exports, graph[file].code)
            return exports
        }
    })(${depsGraph})`
}

const content = bundle('./src/index.js')

!fs.existsSync('./dist') && fs.mkdirSync('./dist')
fs.writeFileSync('./dist/bundle.js', content)