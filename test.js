const estraverse = require('estraverse');
const escodegen = require('escodegen');
const esprima = require('esprima')
const fs = require('fs');

let fileContent = fs.readFileSync('./sample/sample.js', 'utf-8')
let tree = esprima.parseScript(fileContent)


function preppendCode(node, insertNode) {
    let name = node.id ? node.id.name : "<anonymous function>"
    // let insertCode = `console.log('Entering function ${name}')`
    insertNode = insertNode.body
    node.body.body = insertNode.concat(node.body.body)
    // node.body.body = [...insertNode, ...node.body.body] 
}

function appendCode(node, insertNode) {
    let name = node.id ? node.id.name : "<anonymous function>"
    // let insertCode = `console.log('Leaving function ${name}')`
    insertNode = insertNode.body
    node.body.body = [...node.body.body, ...insertNode]
}

function generateString(length) {
    let characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function addDeadCode(node) {
    let compareOptions = [">", "<", "=="]
    let compareValue = compareOptions[Math.floor(Math.random() * 3)]
    let randomVarName = generateString(5)
    let randomNum = Math.random()
    let randomNumCompare = compareValue == "<" ? randomNum - Math.random() : randomNum + Math.random() // calculate number to make if all retun false
    let insertCode = `let ${randomVarName} = ${randomNum}\nif (${randomVarName} ${compareValue} ${randomNumCompare}) {\n${randomVarName} = ${randomVarName}*${Math.random()}\nreturn ${randomVarName}}`
    let insertNode = esprima.parseScript(insertCode, {tolerant: true}) // alow tolerant for bypass error checking
    preppendCode(node,insertNode)
}

estraverse.traverse(tree, {
    enter: function (node, parent) {
        if (node.type == "FunctionDeclaration") {
            addDeadCode(node)
        }
    }
})

var js = escodegen.generate(tree);
console.log(js)
fs.writeFileSync('./out/test.js', js);