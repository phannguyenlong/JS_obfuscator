const estraverse = require('estraverse');
const esprima = require('esprima')
let escodegen = require('escodegen')

// crafted module
const { generateString, generateStringFullChar } = require("../../util/util")

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

/**
 * Split string into series of array with random size (10 - 50)
 * Start with 3 array fill with junk data 
 * Split word with length larger than 10 into 30 -> 50 in size and place randomly into arrays
 * Number of array > number_of_word / 3 (disable cause not effitive => too many arraty)
 * Instead, create a new array whenever an array is full
 * @param {*} node root node of the program
 */
function stringSplitting(node) {
    let listArr = {} // store array name and value
    // create 3 first arrays
    for (let i = 0; i < 3; i++) {
        listArr[generateString(5)] = new Array(Math.floor(Math.random() * (50 - 30 + 1)) + 30)
    }
    let arrNames = Object.keys(listArr)
    // let arrCounter = 3 // count number of arrays
    // let wordCounter = 0 // count number of word
    estraverse.replace(node, {
        enter: function (node, parent) {
            if (node.type == "Literal" && (typeof node.value) == "string") {
                let insertCode ='', insertNode
                if (node.value.length < 30) {
                    // get random array
                    let place = findEmptySlots(1, arrNames, listArr)
                    listArr[place[0].name][place[0].index] = node.value
                    // create code and replace
                    insertCode = `${place[0].name}[${place[0].index}]`
                    insertNode = esprima.parseScript(insertCode, { tolerant: true })
                    // return insertNode.body[0].expression
                }
                else {
                    // get random array
                    let parts = slipStringIntoPart(node.value)
                    let place = findEmptySlots(parts.length, arrNames, listArr)
                    // create code and replace
                    for (let i = 0; i < place.length; i++) {
                        listArr[place[i].name][place[i].index] = parts[i]
                        insertCode += `${place[i].name}[${place[i].index}]+`
                    }
                    insertCode = insertCode.slice(0, -1) // remove last +
                    insertNode = esprima.parseScript(insertCode, { tolerant: true })
                    // return insertNode.body[0].expression
                }
                // check Number of array > number_of_word / 3 (disable for now)
                // wordCounter++
                // if (Math.trunc(wordCounter / arrCounter) > 10) {
                //     console.log('=============================')
                //     // create new array
                //     let name = generateString(5)
                //     listArr[name] = new Array(Math.floor(Math.random() * (50 - 30 + 1)) + 30)
                //     arrNames.push(name)
                //     arrCounter++
                // }
                return insertNode.body[0].expression
            }
        }
    })
    // console.log(listArr)
    fillEmptySlot(listArr)

    // create array
    let insertCode = ''
    for (let arr in listArr) {
        insertCode += `let ${arr} = ${JSON.stringify(listArr[arr])};`
    }
    let insertNode = esprima.parseScript(insertCode, { tolerant: true })
    node.body = [...insertNode.body, ...node.body]
}

function fillEmptySlot(listArr) {
    for (let arr in listArr) {
        for (let i = 0; i < listArr[arr].length; i++) {
            if (listArr[arr][i] == undefined)
                // generate random char with length 5 -> 50
                listArr[arr][i] = generateStringFullChar(Math.floor(Math.random() * (50 - 5 + 1)) + 5)
        }
    }
}
function findEmptySlots(num, arrNames, listArr) {
    let slots = []
    for (let i = 0; i < num; i++) {
        while (true) {
            // pick random Array
            let index = Math.floor(Math.random() * (arrNames.length))
            let arrName = arrNames[index]
            console.log(index)
            console.log(arrNames)
            // check if array full or not (if yes, pop it out from arrNames)
            if (!listArr[arrName].includes(undefined)) {
                console.log('C')
                // remove full array from arrNames
                let index = arrNames.indexOf(arrName)
                arrNames.splice(index, 1)
                // create new array
                let name = generateString(5)
                listArr[name] = new Array(Math.floor(Math.random() * (50 - 30 + 1)) + 30)
                arrNames.push(name)
                continue // start find another array
            }
            // find empty slot
            let arrPosition
            while (true) {
                arrPosition = Math.floor(Math.random() * listArr[arrName].length)
                if (listArr[arrName][arrPosition] == undefined) 
                    break
            }
            slots.push({ 'name': arrName, 'index': arrPosition })
            break
        }
    }
    return slots
}
function slipStringIntoPart(str) {
    let parts = []
    while (str.length) {
        let substrSize = Math.floor(Math.random()*(100 - 30 + 1))+30; // at most 4? 
        if (substrSize >= str.length)
            randomChar = str;
        else
            randomChar = str.substr(0,substrSize);
        str = str.substr(randomChar.length);
        parts.push(randomChar)
    }
    return parts
}

module.exports.storageAndEncodingTransform = function (tree) {
    estraverse.traverse(tree, {
        enter: function (node, parent) {
            if (node.type == "Program") {
                dataEncoding(node)
                booleanSplitting(node)
                stringSplitting(node)
            }
        }
    })
}