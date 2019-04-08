var express = require('express');
var router = express.Router();



router.get('/work', function (req, res, next) {
  res.locals.panePath = "./console";
  res.locals.data = {
    title :"Console"
  };
  res.render('boot/work');
});




module.exports = router;