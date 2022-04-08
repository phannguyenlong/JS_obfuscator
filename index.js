const esprima = require('esprima')
const escodegen = require("escodegen")
const fs = require('fs');
const gulp = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');

// crafted module
// control
const { computationalTransform } = require("./components/control/ComputationTransform")
const { aggegationTransform } = require("./components/control/AggerationTransform")
const { orderingCode } = require("./components/control/OrderingTransform")
// data
const { storageAndEncodingTransform } = require("./components/data/StorageAndEncoding")
// scheme
const { advanceScheme } = require("./advance_scheme")

// compress code
function compress(outDir, outFile) {
    return gulp.src(outFile)
        .pipe(terser({
            compress: {
                booleans: false,
                drop_console: false,
                evaluate: false,
                keep_classnames: false
            },
            mangle: {
                toplevel: true,
            },
            keep_fnames: false,
            output: {
                beautify: false,
                preamble: '/*Obfucated Script below*/' // add message to the top
            }
        }))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(outDir)) // generate compress file
}

// read and parse orginal code
let inputFile = "./sample/string_sample.js"
let outputFile = "./out/obfus_sample.js"
let outDir = "./out"
let fileContent = fs.readFileSync(inputFile, 'utf-8')
let tree = esprima.parseScript(fileContent)

// perform computationalTransform
// computationalTransform(tree, {
//   addDeadCode: true,
//   addRedundantOperand: true,
//   extendCondition: true,
// });
// aggegationTransform(tree, {
//     cloneCode: true,
//     interleavingCode: true,
//     inLiningCode: true
// })
// computationalTransform(tree, {addDeadCode: true}) // add more rows :))
// orderingCode(tree)

// perfrorm data transform
// storageAndEncodingTransform(tree)

// run custom scheme
advanceScheme(tree)

// generate js code form AST tree
var js = escodegen.generate(tree);
console.log("======================Final JS======================\n")
console.log(js)
fs.writeFileSync(outputFile, js);

// compress
compress(outDir, outputFile)