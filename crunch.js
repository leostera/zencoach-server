var redis = require('redis').createClient({
  host: "zencoach.ostera.io"
})

// helpers
var user_is = function (key) { return function (el) { return el.user === key } }
var key_is = function (key, val) { return function(el) { return el[key] === val } }
var pluck = function (key) { return function (el) { return el[key] } }
Array.prototype.unique = function() { tmp = []; this.forEach( function(i) { if(tmp.indexOf(i) === -1) { tmp.push(i) } }); return tmp }
Array.prototype.to_object = function() { return this.reduce( function (acc, val) { acc[val] = null; return acc }, {}  ) }

var ms_to_hs = function (ms) { return ms / 60000 / 60 }
var truncate = function (i ) { return ((i*100)|0)/100 }

var valid = function(key) { return key.length === 36 }

// magic!
var crunch = function (USER) {
  redis.lrange(USER, 0, -1, function (err, data) {
    var data = data.map(JSON.parse)
    var apps = data.filter(user_is(USER)).map(pluck("app")).sort().unique().to_object()
    var data_with_end_dates = data.filter(user_is(USER)).map(function (app, i) {
      app.until = data[i-1] && data[i-1].timestamp || false;
      return app
    })

    var entries = Object.keys(apps).map( function (app) {
        return [app, data_with_end_dates.filter(key_is("app", app))]
    } ).reduce( function(acc, o) { acc[o[0]] = o[1]; return acc }, {} )

    var total_times = Object.keys(entries)
    .map( function( app ) {
      return [app,
        entries[app].map(function (e) {
          return e.until && e.until - e.timestamp || 0
        }).reduce( function (total, i) {
          return total+i
        }, 0)
      ]
    }).sort(function (a,b) { return a[1]-b[1] })
    .reduce( function(acc, o) {
      acc[o[0]] = truncate(ms_to_hs(o[1]))
      return acc
    }, {} )

    console.log(USER, total_times)
    return total_times
  })
}


redis.keys("*", function (err, keys) {
  var users = keys.filter(valid)
  users.forEach(function (user) {
    console.log("Getting stats for...",user)
    crunch(user)
  })
})
