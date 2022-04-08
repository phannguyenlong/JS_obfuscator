function updateUser(name) {
  fetch('https://api.com/user/update?id' + name)
}

updateUser('long')