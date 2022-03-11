const esprima = require('esprima')
const escodegen = require("escodegen")
const fs = require('fs');
const gulp = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');

// crafted module
const { computationalTransform } = require("./components/ComputationTransform")
const { aggegationTransform } = require("./components/AggerationTransform")

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
let inputFile = "./sample/5_func_sample.js"
let outputFile = "./out/obfus_sample.js"
let outDir = "./out"
let fileContent = fs.readFileSync(inputFile, 'utf-8')
let tree = esprima.parseScript(fileContent)

// perform computationalTransform
computationalTransform(tree)
aggegationTransform(tree)
// computationalTransform(tree) // add more rows :))

// generate js code form AST tree
var js = escodegen.generate(tree);
console.log("======================Final JS======================\n")
console.log(js)
fs.writeFileSync(outputFile, js);

// compress
compress(outDir, outputFile)