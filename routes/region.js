var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')

router.use(util.loginChecker)
router.get('/list', (req, res, next) => {
    let {parentId} = req.query
    dao.execute(new dao.selectList('select id, parent_id, name, type from t_mall_region where parent_id = ? and del_flag = false', [parentId], (error, results, fields) => {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(util.transferFromList(results, fields)))
    }))
})

module.exports = router;