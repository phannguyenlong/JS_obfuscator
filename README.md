# Disclaimer
This main purpose of this project is applying some transformation technique for building a simpel JS Obfuscator. The main idea of the JS Obfuscator is manipulating the AST tree for generating obfuscated code from original code.

# How to run this project
This project is build engine NodeJS so it is require that you should have NodeJS installed. Then run the following command to set up.
```
npm install
```
Put some sample code inside the file `/sample/sample.js`. Then run the following command.
```
node index.js
```
The obfuscated code will output inside folder `/out/`. For this period of the project, the sample code will go through 2 rounds and generate 2 files after each round include: one for is the code after obfuscated and one for the code after obfuscated and minifying.

# Example
The original code
```JS
function multiply(num1, num2) {
  return num1 * num2
}

function substract(num1, num2) {
  return num1 - num2
}

let total = multiply(10, 20)
console.log(total)

let sum = substract(20, 10)
console.log(sum)
```  
The obfuscated code  
```JS
function multiply(num1, num2) {
    let mshwS = 5762;
    if (mshwS < 5761.629888227067 && 2363 == 2363) {
        mshwS = mshwS + 0.9799777525989692;
        let slqNm = mshwS;
        slqNm = slqNm - 7155;
        return slqNm + 7155;
    }
    let bvZbC = num1 * num2;
    bvZbC = bvZbC * 8950;
    return bvZbC / 8950;
}
function substract(num1, num2) {
    let dMJHF = 4649;
    if (dMJHF < 4648.948586654794 && 5392 < 5392.588184525474) {
        dMJHF = dMJHF + 0.03740530634496242;
        let tJ_Kw = dMJHF;
        tJ_Kw = tJ_Kw + 5205;
        return tJ_Kw - 5205;
    }
    let MHtxH = num1 - num2;
    MHtxH = MHtxH * 6935;
    return MHtxH / 6935;
}
let total = multiply(10, 20);
console.log(total);
let sum = substract(20, 10);
console.log(sum);
```  
Obfuscated and Minimize code  
```JS
function e(e,t){let l=5762;if(l<5761.629888227067&&2363==2363){l+=.9799777525989692;let e=l;return e-=7155,e+7155}let n=e*t;return n*=8950,n/8950}function t(e,t){let l=4649;if(l<4648.948586654794&&5392<5392.588184525474){l+=.03740530634496242;let e=l;return e+=5205,e-5205}let n=e-t;return n*=6935,n/6935}let l=e(10,20);console.log(l);let n=t(20,10);console.log(n);
```