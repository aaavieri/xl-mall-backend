var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')
const axios = require('axios')

router.post('/loginByWeixin', (req, res, next) => {
    var code = req.body.code
    var userInfo = req.body.userInfo
    axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${env.appId}&secret=${env.appSecret}&js_code=${code}&grant_type=authorization_code`, {
        appid: env.appId,
        secret: env.appSecret,
        js_code: code,
        grant_type: 'authorization_code'
    }).then((response) => {
        if (!response.data.openid) {
            return next(new Error(response.data.errmsg))
        }
        dao.execute(new dao.selectOne('select id from t_mall_user where open_id = ?', [response.data.openid], (error, results, fields) => {
            if (error) {
                return next(error)
            }
            if (results) {
                dao.execute(new dao.update('update t_mall_user set del_flag = false last_login_time = CURRENT_TIMESTAMP where id = ?', [results.id], (error, changedRows) => {
                    if (error) {
                        return next(error)
                    }
                }))
                req.session.userInfo = userInfo
                req.session.wxInfo = {
                    openid: response.data.openid,
                    sessionKey: response.data.session_key,
                    userId: results.id,
                    sessionId: req.session.id
                }
                res.json(util.getSuccessData({sessionId: req.session.id}))
            } else {
                dao.execute(new dao.insert('insert into t_mall_user (open_id) values (?)', [response.data.openid], (error, insertId) => {
                    if (error) {
                        return next(error)
                    }
                    req.session.userInfo = userInfo
                    req.session.wxInfo = {
                        openid: response.data.openid,
                        sessionKey: response.data.session_key,
                        userId: insertId,
                        sessionId: req.session.id
                    }
                    res.json(util.getSuccessData({sessionId: req.session.id}))
                }))
            }
        }))
    }).catch((error) => {
        return next(error)
    })
})

module.exports = router;