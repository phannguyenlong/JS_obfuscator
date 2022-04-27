function sayAge(age) {
    let myAge = 18
    if (age > myAge) {
        console.log("You are " + (age - myAge) + " years older than me")
    } else {
        console.log("You are " + (myAge - age) + " year  younger than me")
    }
}

function test(num) {
    let i = 0
    let bool = false
    while (!(bool)) {
        i++
        console.log(i)
        if (i == num)
            bool = true
        else if (i > num)
            bool = bool && true
    }
    console.log(bool)
}

let age = 22
sayAge(22)
test(20)