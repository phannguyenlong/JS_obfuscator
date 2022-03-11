const estraverse = require('estraverse');
const esprima = require('esprima')
let escodegen = require('escodegen')

// crafted module
const { generateString } = require('../util/util')

/**
 * Group irrelevant code to a function
 * Notice: only work with the code that is not in function
 * @param node : recieve root node of the program
 */
function inLiningCode(node) {
    // array for code outside function which is not function call
    // and variable declare
    let outsideCode = []
    let variableDeclareStm = '' // statement for putting all varible declare on top

    // loop through program code
    for (let i = 0; i < node.body.length; i++) {
        // gather all variable decleare to put at top
        if (node.body[i].type == "VariableDeclaration") {
            let currentNode = node.body[i]
            variableDeclareStm += `${currentNode.kind} ${currentNode.declarations[0].id.name};\n`
            // replace variable declare with normal statment without declare
            let replaceCode = `${currentNode.declarations[0].id.name} = ${escodegen.generate(currentNode.declarations[0].init)}`
            node.body[i] = esprima.parseScript(replaceCode, { tolerant: true }).body[0]
            outsideCode.push(node.body[i]) // add to array for adding to function
            node.body.splice(i, 1) // remove it from body
            i-- // move back to prevent error
        } else if (node.body[i].type != "FunctionDeclaration") {
            outsideCode.push(node.body[i]) // add to array for adding to function
            node.body.splice(i, 1) // remove it from body
            i-- // move back to prevent error
        }
    }
    // merge all code to function
    let randomVarName = generateString(5)
    let functionNode = esprima.parseScript(`function ${randomVarName}() {}\n${randomVarName}()`, {tolerant: false})
    functionNode.body[0].body.body = outsideCode // replace function body with codes from above
    // add to current inlining function to current code
    node.body = [...node.body, ...functionNode.body]

    // insert all the varibale declare at top
    let varialeDeclareNode = esprima.parseScript(variableDeclareStm)
    node.body = varialeDeclareNode.body.concat(node.body)
}

/**
 * grouping irrelevant function together and adding extra variable
 * Can group in 2 forms: group 2 or 3 functions into 1 funciton
 * Condition for group: number of funcs >= 3
 * @param {*} node : recieve root node of the program
 */
function interleavingCode(node) {
    let funcArr = [] // array for holding all function nodes
    estraverse.traverse(node, {
        enter: function (node, parent) {
            if (node.type == "FunctionDeclaration") 
                funcArr.push(node)
        }
    })

    if (funcArr.length > 3) { // case number of func > 3

    } else if (funcArr.length == 3) { // case number of func == 3
        interleaving2Function(node, funcArr, true)
    } else if (funcArr.length == 2) { // case number of func == 2
        interleaving2Function(node, funcArr, false)
    } // this feature will not run if program has only 1 function
}
/**
 * Function handling interleaving process of 2 and 3 function
 * Return only function which contain interleave code
 * @param {*} node program code
 * @param {*} funcArr list of function need to interleaving
 * @param {*} is3Function true if interleaving 3 function, false mean interleaving 2 functions
 */
function interleaving2Function(node, funcArr, is3Function) {
    // variable declare
    let typeVarName = generateString(5)
    let typeVal1 = generateString(5)
    let typeVal2 = generateString(5)
    let typeVal3 = generateString(5) // use for 3 functions mode
    let funcName = generateString(5)

    // generate new function
    let newFunctionCode = `function ${funcName}(${typeVarName})\n{if (${typeVarName} == "${typeVal1}") {} else if (${typeVarName} == "${typeVal2}") {}`
    newFunctionCode += is3Function ? ` else if (${typeVarName} == "${typeVal3}") {}}` : "}"
    let newFunctionNode = esprima.parseScript(newFunctionCode)

    // handle param of each function
    // check if they has same number of params or not
    if ((funcArr[0].params.length == funcArr[1].params.length && !is3Function) // 2 function mode
        || (funcArr[0].params.length == funcArr[1].params.length && funcArr[0].params.length == funcArr[2].params.length && is3Function)) // 3 function mode
    {
        for (let i = 0; i < funcArr[0].params.length; i++) {
            let randomVarName = generateString(5)
            changeNameOfVariableOfNode(funcArr[0].params[i].name, randomVarName, funcArr[0])
            changeNameOfVariableOfNode(funcArr[1].params[i].name, randomVarName, funcArr[1])
            if (is3Function) changeNameOfVariableOfNode(funcArr[2].params[i].name, randomVarName, funcArr[2])
        }
        newFunctionNode.body[0].params.push(...funcArr[0].params) // update new functon param
    } else {
        let params = funcArr[0].params.length > funcArr[1].params.length ? funcArr[0].params : funcArr[1].params
        if (is3Function) params = funcArr[2].params.length > params.length ? funcArr[2].params : params // for 3 func mode
        for (let i = 0; i < params.length; i++) {
            let randomVarName = generateString(5)
            if (funcArr[0].params[i]) 
                changeNameOfVariableOfNode(funcArr[0].params[i].name, randomVarName, funcArr[0])
            if (funcArr[1].params[i])
                changeNameOfVariableOfNode(funcArr[1].params[i].name, randomVarName, funcArr[1])
            if (is3Function) // for 3 func mode
                if (funcArr[2].params[i])
                    changeNameOfVariableOfNode(funcArr[2].params[i].name, randomVarName, funcArr[2])
        }
        newFunctionNode.body[0].params.push(...params) // update new functon param
    }

    // merge 2 or 3 old functions code into new function
    let ifBlock = newFunctionNode.body[0].body.body[0] // extract the if block of code
    ifBlock.consequent = funcArr[0].body // add function body to if stm
    ifBlock.alternate.consequent = funcArr[1].body // add function body to if stm
    if (is3Function) ifBlock.alternate.alternate = funcArr[2].body // for 3 func mode
    
    // remove old function and change function call
    removeOldFunction(funcArr, node)
    if (is3Function) // for 3 func mode
        changeFunctionCall(newFunctionNode, funcArr, node, typeVal1, typeVal2, typeVal3)
    else
        changeFunctionCall(newFunctionNode, funcArr, node, typeVal1, typeVal2)

    // append new function to program
    node.body = [...node.body, ...newFunctionNode.body]
}

// function for changing name of variable inside a node
function changeNameOfVariableOfNode(oldName, newName, node) {
    estraverse.traverse(node, {
        enter: function (node, parent) {
            if (node.type == "Identifier") {
                if (node.name == oldName) {
                    node.name = newName
                }
            }
        }
    })
}
// remove old function (which is replace by new function by Interneleaving method)
function removeOldFunction(oldFuncArr, node) {
    for (let i = 0; i < oldFuncArr.length; i++) {
        estraverse.replace(node, {
            enter: function (node, parent) {
                if (node.type == "FunctionDeclaration") {
                    if (node.id.name == oldFuncArr[i].id.name)
                        this.remove()
                }
            }
        })
    }
}
// change function call of original code to new function call
function changeFunctionCall(newFunction, arrOldFunc, node, ifCon1, ifCon2, ifCon3) {
    let newFuncName = newFunction.body[0].id.name
    let conditionsArr = [ifCon1, ifCon2, ifCon3] // array for holding conditions for each if statment for choosing correct function 
    for (let i = 0; i < arrOldFunc.length; i++) {
        estraverse.replace(node, {
            enter: function (node, parent) {
                if (node.type == "CallExpression") {
                    if (node.callee.name == arrOldFunc[i].id.name) {
                        let newNode = esprima.parseScript(`${newFuncName}("${conditionsArr[i]}")`, { tolerant: true })
                        newNode.body[0].expression.arguments.push(...node.arguments)
                        return newNode.body[0].expression
                    }
               } 
            }
        })
    }
}

module.exports.aggegationTransform = function (tree) {
    estraverse.traverse(tree, {
        enter: function (node, parent) {
            if (node.type == "Program") {
                interleavingCode(node)
                // inLiningCode(node)
            }
        }
    })
}