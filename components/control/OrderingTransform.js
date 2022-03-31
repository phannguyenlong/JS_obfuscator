const estraverse = require('estraverse');

/**
 * Perform Ordering transformation
 * Gather all functions and randomize its position
 * @param {*} node root node of the program
 */
module.exports.orderingCode = function (tree) {
    let funcArr = [] // array for holding all function
    estraverse.replace(tree, {
        enter: function (node, parent) {
            if (node.type == "FunctionDeclaration") {
                funcArr.push(node) // add it to array
                this.remove()
            }
        }
    }) 
    // shuffle functions in array
    funcArr = funcArr.sort(() => Math.random() - 0.5)

    // add it back to the top of program code
    tree.body = [...funcArr, ...tree.body]
}