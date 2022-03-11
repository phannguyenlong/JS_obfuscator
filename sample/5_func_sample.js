function multiply(num1, num2, num3) {
  return num1 * num2 * num3
}

function substract(num1, num2) {
  return num1 - num2
}

function devide(num1, num2, num3, num4) {
  let c = num3 / num4
  return num1 / num2
}

function add(num1, num2) {
  return num1 + num2
}

function factorial(num) {
    let rval = 1
    for (var i = 2; i <= num; i++)
        rval = rval * i;
    return rval;
}

let total = multiply(10, 20, 30)
console.log(total)

total = total + 10
let a = total + 10

let mius = substract(20, 10)
console.log(mius)

let devision = devide(30, 10, 20, 10)
console.log(devision)

let sum = add(20, 10)
console.log(sum)

let fac = factorial(5)
console.log(fac)