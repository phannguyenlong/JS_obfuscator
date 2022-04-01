const estraverse = require('estraverse');
const esprima = require('esprima')
let escodegen = require('escodegen')

// crafted module
const { generateString, decimalToHexString } = require("../../util/util")

/**
 * This function will in charfe of coding all orignal data
 * original data => XOR encrypt => Base 64 encode
 * @param {*} node the root node of the program
 */
function dataEncoding(node) {
    // generate secret key
    let randomMax = 10000000, randomMin = -10000000;
    let salt = Math.round(Math.random() * (randomMax - randomMin) + randomMin);
    let funName = generateString(5)
    let res
    estraverse.replace(node, {
        enter: function (node, parent) {
            // extract all string
            // node.value != res to prevent it encode the new generate code
            if (node.type === "Literal" && (typeof node.value) != "number" && (typeof node.value) != "boolean" && node.value != res) {
                // encrypt then base64 encode it
                res = xorEncrypt(node.value, salt)
                res = Buffer.from(res).toString('base64')
                let insertCode = `${funName}('${res}')`
                let insertNode = esprima.parseScript(insertCode, { tolerant: true })
                return insertNode.body[0].expression
            }
        }
    })
    // generate decrypt function
    let hexSalt = salt <= 0 ? `-0x${(-salt).toString(16)}` : `0x${salt.toString(16)}`
    let funcCode = `function ${funName}(r){let t="";r=("undefined"!=typeof atob?btoa:r=>{return Buffer.from(r,"base64").toString("utf-8")})(r);for(var e=0;e<r.length;e++)t+=String.fromCharCode(parseInt('${hexSalt}', 16)^r.charCodeAt(e));return t}`
    let funNode = esprima.parseScript(funcCode, { tolerant: true })
    node.body = [...funNode.body, ...node.body]
}
function xorEncrypt(str, salt) {
    let result = '';
    for (var i=0; i<str.length; i++) {
        result += String.fromCharCode( salt ^ str.charCodeAt(i) );
        
    }
    return result;
}

/**
 * slipt boolean variable into 2 variabls p and q 
 * @param {*} node root node of program
 */
function booleanSplitting(node) {
    let booleanVar = {}
    // replace and gather all boolean declare
    estraverse.traverse(node, {
        enter: function (node, parent) {
            // filter boolean var declare
            if (node.type == "VariableDeclaration" && node.declarations[0].init != undefined) {
                if ((typeof node.declarations[0].init.value) == 'boolean') {
                    // generate p and q
                    // check does the boolean variable exist or not (to prevent error when clone code)
                    let pName, qName;
                    if (booleanVar[node.declarations[0].id.name]) {
                        pName = booleanVar[node.declarations[0].id.name].pName
                        qName = booleanVar[node.declarations[0].id.name].qName
                    } else {
                        pName = generateString(5)
                        qName = generateString(5)
                    }
                    let pValue = Math.floor(Math.random() * 2)
                    let qValue
                    if (node.declarations[0].init.value)
                    qValue = pValue == 0 ? 1 : 0
                    else 
                    qValue = pValue == 0 ? 0 : 1
                    // add new variable to code
                    let insertCode = `let ${pName}=${pValue};let ${qName}=${qValue};`
                    let insertNode = esprima.parseScript(insertCode, { tolerant: true })
                    parent.body = [...insertNode.body, ...parent.body]
                    // add to object list
                    booleanVar[node.declarations[0].id.name] = {"pName": pName, "qName": qName}
                    // remove old line
                    estraverse.replace(parent, {
                        enter: function (inode, parent) {
                            if (inode.type == "VariableDeclaration"
                                && (typeof inode.declarations[0].init.value) == 'boolean'
                                && node.declarations[0].id.name === inode.declarations[0].id.name
                            )
                                this.remove()
                        }
                    })
                }
            }
        }
    })
    // genrate convert table
    let arrName = generateString(5)
    let insertCode = `let ${arrName} = [[false,true],[true,false]]`
    let insertNode = esprima.parseScript(insertCode, { tolerant: true })
    node.body = [...insertNode.body, ...node.body]
    // replace variable call with array (ex: bool => arrName[pVal][qVal])
    estraverse.traverse(node, {
        enter: function (node, parent) {
            if (node.type == "Identifier" && Object.keys(booleanVar).includes(node.name)) {
                if (parent.type != "AssignmentExpression") {
                    let bool = booleanVar[node.name]
                    let insertCode = `${arrName}[${bool.pName}][${bool.qName}]`
                    let insertNode = esprima.parseScript(insertCode, { tolerant: true })
                    for (key in parent) {
                        if (parent[key] == node) {
                            parent[key] = insertNode.body[0].expression
                        } else if (parent[key][0] == node) { // case for console.log
                            parent[key][0] = insertNode.body[0].expression
                        }
                    }
                } 
            }
        }
    })
    // replace variable call equation with if statemnt
    // ex (if true) {pVal = 1; qVal=0} else {pVal = 0; qVal=1}
    estraverse.replace(node, {
        enter: function (node, parent) {
            if (node.type == "ExpressionStatement" && node.expression.type == "AssignmentExpression" && Object.keys(booleanVar).includes(node.expression.left.name)) { 
                console.log(escodegen.generate(node))
                let bool = booleanVar[node.expression.left.name]
                // generate new p and q value
                let pValue = Math.floor(Math.random() * 2)
                let insertCode = `if (${escodegen.generate(node.expression.right)}) {${bool.pName}=${pValue};${bool.qName}=${pValue == 0 ? 1 : 0}}else{${bool.pName}=${pValue};${bool.qName}=${pValue == 0 ? 0 : 1}}`
                let insertNode = esprima.parseScript(insertCode, { tolerant: true })
                // console.log(insertNode.body[0])
                // parent = insertNode.body[0]
                return insertNode.body[0]
            }
        }
    })
}

function stringSplitting(node) {

}

module.exports.storageAndEncodingTransform = function (tree) {
    estraverse.traverse(tree, {
        enter: function (node, parent) {
            if (node.type == "Program") {
                dataEncoding(node)
                booleanSplitting(node)
            }
        }
    })
}