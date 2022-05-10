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

let total = multiply(10, 20, 30)
console.log(total)

total = total + 10
let a = total + 10

let sum = substract(20, 10)
console.log(sum)

let devision = devide(30, 10, 20, 10)
console.log(devision)