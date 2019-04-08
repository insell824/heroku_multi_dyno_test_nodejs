var express = require('express');
var router = express.Router();

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


var count2 = 0;
router.get('/busy', (req, res, next) => {
  var reqTime = new Date().getTime();
  count2++;
  var i = count2;
  console.log("REQ", i);
  while(reqTime + 5000 > new Date().getTime()){
    
  }
  console.log("RES", i);
  res.send("RES"+i);
});


module.exports = router;
