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
    let min = 1
    let places = 5 // num of decimal number
    let value = Math.floor((Math.random() * (max - min + 1) + min));
    return value;
}

/**
 * function for adding dead/irrelevant code to current code block
 */
function addDeadCode(node) {
    let compareValue = compareOptions[Math.floor(Math.random() * 3)]
    let operandsValue = operandsOptions[Math.floor(Math.random() * 4)]
    let randomVarName = generateString(5)
    let randomNum = generateNumber()
    let randomNumCompare = compareValue == "<" ? randomNum - Math.random() : randomNum + Math.random() // calculate number to make if all retun false
    let insertCode = `let ${randomVarName} = ${randomNum};if (${randomVarName} ${compareValue} ${randomNumCompare}) {${randomVarName} = ${randomVarName}${operandsValue}${Math.random()};return ${randomVarName}}`
    let insertNode = esprima.parseScript(insertCode, {tolerant: true}) // alow tolerant for bypass error checking
    preppendCode(node,insertNode)
}

/**
 * function for inserting redundant operand to current calculation 
 * by generating exprerssion from random number 
 */
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
                    let randomNum = generateNumber()

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

/**
 * function for extending condition of if or while statement by adding new condition
 * 2 type of added condtion: || (add Pf) and && (add Pt)
 * Pf: always false condition, Pt: always true conditions
 */
function extendCondition(node) {
    estraverse.traverse(node, {
        enter: function (node, parent) {
            if (node.type == "IfStatement" || node.type == "WhileStatement") {
                let conditons = ["||", "&&"]
                let conditonValue = conditons[Math.floor(Math.random() * 2)]
                let compareValue = compareOptions[Math.floor(Math.random() * 3)]

                // create number for compare
                let randomNum = generateNumber()
                let compareRandomNum
                if (compareValue == "==") {
                    compareRandomNum = conditonValue == "&&" ? randomNum : randomNum + generateNumber()
                } else {
                    let t = Math.random()
                    if (conditonValue == "&&") 
                        compareRandomNum = compareValue == "<" ? randomNum + t : randomNum - t
                    else // if condition is "||" do the opposite
                        compareRandomNum = compareValue == ">" ? randomNum + t : randomNum - t
                }

                // generate insert code and node
                let orginal_cond = escodegen.generate(node.test) // get old expression
                let insertCode = orginal_cond +  ` ${conditonValue} ${randomNum}${compareValue}${compareRandomNum}`
                let insertNode = esprima.parseScript(insertCode, { tolerant: true }) // alow tolerant for bypass error checking

                // replace current condition with new condition                
                node.test = insertNode.body[0].expression
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
                extendCondition(node)
            }
        }
    })
}