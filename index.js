var koa = require('koa');
var redis = require('redis').createClient()
var app = koa();

app.use(function *(){
  var params = this.request.path.slice(1).split("/")
  var user = params[0]
  var app  = params[1]
  var now  = Date.now()

  var point = {
    timestamp: now,
    user: user,
    app: app
  }

  console.log(user, point)
  redis.lpush(user, JSON.stringify(point))
});

app.listen(3000);
