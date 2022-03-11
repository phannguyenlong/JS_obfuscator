module.exports.generateString = function (length) {
    let characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

module.exports.generateNumber = function () {
    let max = 10000
    let min = 1
    let places = 5 // num of decimal number
    let value = Math.floor((Math.random() * (max - min + 1) + min));
    return value;
}