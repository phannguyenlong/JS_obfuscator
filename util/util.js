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

/**
 * compare input option with defaults fields
 * @param {*} options user input value
 * @param {*} defaults default option of that method
 */
module.exports.setDefaults = function (options, defaults) {
    for (let option in defaults) {
        if (!options.hasOwnProperty(option)) {
            options[option] = defaults[option]
        }
    }
    return options
}

module.exports.decimalToHexString = function (number)
{
  if (number < 0)
  {
    number = 0xFFFFFFFF + number + 1;
  }

  return number.toString(16).toUpperCase();
}