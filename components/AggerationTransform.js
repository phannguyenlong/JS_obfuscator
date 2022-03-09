const estraverse = require('estraverse');
const esprima = require('esprima')
let escodegen = require('escodegen')
const {generateString} = require('../util/util')

/**
 * Group irrelevant code to a function
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

module.exports.aggegationTransform = function (tree) {
    estraverse.traverse(tree, {
        enter: function (node, parent) {
            if (node.type == "Program") {
                inLiningCode(node)
            }
        }
    })
}