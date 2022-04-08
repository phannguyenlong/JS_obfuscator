// control
const { computationalTransform } = require("./components/control/ComputationTransform")
const { aggegationTransform } = require("./components/control/AggerationTransform")
const { orderingCode } = require("./components/control/OrderingTransform")
// data
const { storageAndEncodingTransform } = require("./components/data/StorageAndEncoding")

module.exports.advanceScheme = function (tree) {
    // inlining
    aggegationTransform(tree, {
        cloneCode: false,
        interleavingCode: false,
        inLiningCode: true
    })
    // add dead code + redundant operan 
    computationalTransform(tree, {
        addDeadCode: true,
        addRedundantOperand: true,
        extendCondition: false,
    });
    // clone code + interleaving
    aggegationTransform(tree, {
        cloneCode: true,
        interleavingCode: true,
        inLiningCode: false
    })
    // //  extend condition
    computationalTransform(tree, {
        addDeadCode: false,
        addRedundantOperand: false,
        extendCondition: true,
    });
    // // ordering
    orderingCode(tree)
    // // storage and data encoding
    storageAndEncodingTransform(tree)
}