var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')

router.use(util.loginChecker)
router.post('/add', (req, res, next) => {
    let {content, feedbackType, mobile} = req.body
    let wxInfo = req.session.wxInfo
    let userId = wxInfo.userId
    dao.execute(new dao.insert('insert into t_mall_feedback (id, user_id, type, content, mobile) values (null, ?, ?, ?, ?)', [userId, feedbackType, content, mobile], (error, insertId) => {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData({insertId}))
    }))
})

module.exports = router;