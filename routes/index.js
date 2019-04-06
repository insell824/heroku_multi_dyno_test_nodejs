var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

var count = 0;
router.get('/test', (req, res, next) => {
  var reqTime = new Date().getTime();
  count++;
  var i = count;
  console.log("REQ", i);

  var f = function () {
    var r = (reqTime + 5000 > new Date().getTime());
    if (!r) {
      console.log("RES", i);
      res.send("RES:" + i);
    } else {
      new Promise(resolve => {
        setTimeout(() => {
          resolve();
          f();
        }, 200)
      });
    }
  };
  process.nextTick(f);
});

module.exports = router;
