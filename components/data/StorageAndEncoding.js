const estraverse = require('estraverse');
const esprima = require('esprima')
let escodegen = require('escodegen')
const crypto = require('crypto')

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
            if (node.type === "Literal" && (typeof node.value) != "number" && node.value != res) {
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

module.exports.storageAndEncodingTransform = function (tree) {
    estraverse.traverse(tree, {
        enter: function (node, parent) {
            if (node.type == "Program") {
                dataEncoding(node)
            }
        }
    })
}