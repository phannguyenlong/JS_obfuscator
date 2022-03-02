const estraverse = require('estraverse');
const esprima = require('esprima')
let escodegen = require('escodegen')

const compareOptions = [">", "<", "=="]
const operandsOptions = ["+", "-", "*", "/"]

function preppendCode(node, insertNode) {
    // let name = node.id ? node.id.name : "<anonymous function>"
    // let insertCode = `console.log('Entering function ${name}')`
    insertNode = insertNode.body
    node.body.body = insertNode.concat(node.body.body)
    // node.body.body = [...insertNode, ...node.body.body] 
}

function appendCode(node, insertNode) {
    // let name = node.id ? node.id.name : "<anonymous function>"
    // let insertCode = `console.log('Leaving function ${name}')`
    insertNode = insertNode.body
    node.body.body = [...node.body.body, ...insertNode]
}

function generateString(length) {
    let characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateNumber() {
    let max = 10000
    let min = -10000
    let places = 5 // num of decimal number
    let value = Math.floor((Math.random() * (max - min + 1)) + min);
    return value;
}

function addDeadCode(node) {
    let compareValue = compareOptions[Math.floor(Math.random() * 3)]
    let operandsValue = operandsOptions[Math.floor(Math.random() * 4)]
    let randomVarName = generateString(5)
    let randomNum = Math.random()
    let randomNumCompare = compareValue == "<" ? randomNum - Math.random() : randomNum + Math.random() // calculate number to make if all retun false
    let insertCode = `let ${randomVarName} = ${randomNum};if (${randomVarName} ${compareValue} ${randomNumCompare}) {${randomVarName} = ${randomVarName}${operandsValue}${Math.random()};return ${randomVarName}}`
    console.log(insertCode)
    let insertNode = esprima.parseScript(insertCode, {tolerant: true}) // alow tolerant for bypass error checking
    preppendCode(node,insertNode)
}

function addRedundantOperand(node) {
    estraverse.traverse(node, {
        enter: function (node, parent) {
            if (node.type == "ReturnStatement") {
                // will be 2 type of return (return var and return expression)
                // CASE 1: epxression return transfrom
                // ex: return num1+num2 => let res = num1+num2;res=res*134;return res/1234
                // CASE 2: indentifier return transform
                // ex: return a ==> a = a + 1234;return a / 1234
                if (node.argument.type == "BinaryExpression" || node.argument.type == "Identifier") {
                    let randomVarName = generateString(5)
                    let randomNum = Math.random()

                    // find operands and it opposite
                    let operandsValue = operandsOptions[Math.floor(Math.random() * 4)]
                    let oppositeOperandsValue
                    if (operandsValue == "+" || operandsValue == "-")
                        oppositeOperandsValue = operandsValue == "+" ? "-" : "+"
                    else
                        oppositeOperandsValue = operandsValue == "*" ? "/" : "*"
                    
                    // genereate code and node
                    let insertCode = `let ${randomVarName}=${escodegen.generate(node.argument)}\n${randomVarName}=${randomVarName}${operandsValue}${randomNum}\nreturn ${randomVarName}${oppositeOperandsValue}${randomNum}`
                    let insertNode = esprima.parseScript(insertCode, { tolerant: true }) // alow tolerant for bypass error checking
                    
                    // add code to function before return statment
                    parent.body.splice(parent.body.length - 1, 0, ...insertNode.body)
                    parent.body.pop() // remove last line (old return line)
                }
            }
        }
    })
}

function extendCondition(node) {
    estraverse.traverse(node, {
        enter: function (node, parent) {
            if (node.type == "IfStatement") {
                console.log(node)
            }
        }
    })
}


module.exports.computationalTransform = function (tree) {
    estraverse.traverse(tree, {
        enter: function (node, parent) {
            if (node.type == "FunctionDeclaration") {
                addDeadCode(node)
                addRedundantOperand(node)
            }
        }
    })
}