var redis = require('redis').createClient({
  host: "zencoach.ostera.io"
})

var multi = redis.multi()

var valid = function(key) {
  return key.length === 36
}

var queue = function (multi) {
  return function(key) {
    multi.lrange(key, 0, -1)
  }
}

redis.keys("*", function (err, keys) {
  keys
    .filter(valid)
    .forEach(queue(multi))

  multi.exec(function (err, entries) {
    console.log(entries);
  })
})
