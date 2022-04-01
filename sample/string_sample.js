function sayHello(name) {
    let word = "Hello " + name
    console.log("Your name is: " + name) 
    return word 
}

function sayAge(age) {
    let myAge = 18
    if (age > myAge) {
        console.log("You are " + (age - myAge) + " years older than me")
    } else {
        console.log("You are " + (myAge - age) + " year  younger than me")
    }
}

let greeting = sayHello("Long")
console.log(greeting)
let age = 22
sayAge(22)