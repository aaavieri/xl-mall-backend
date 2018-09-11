var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')
const wxUtil = require('../util/wxUtil')
let appLog = require('../logger/appLogger')

router.use(util.loginChecker)

router.post('/prepay', (req, res, next) => {
    let orderId = req.body.orderId
    let {userId, openid} = req.session.wxInfo
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectOne('select id, order_sn, user_id, status, actual_price from t_mall_order where id = ? and user_id = ? and del_flag = false',
            [orderId, userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            let orderData = util.transferFromRow(results, fields)
            if (!results || !results.id) {
                return reject('找不到订单或订单已取消')
            }
            // 201表示已支付
            if (orderData.status === 201) {
                return reject('订单已支付')
           }
            resolve(orderData)
        }))
    }).then((orderData => {
        return wxUtil.createUnifiedOrder({
            openid: openid,
            body: '订单编号：' + orderData.orderSn,
            out_trade_no: orderData.orderSn,
            total_fee: parseInt(orderData.actualPrice * 100),
            spbill_create_ip: ''
        });
    })).then((returnParams) => {
        return new Promise((resolve, reject) => {
            // status为1表示支付确认中
            dao.execute(new dao.update('update t_mall_order set status = ?, update_user = ?, update_time = CURRENT_TIMESTAMP, row_version = row_version + 1 ' +
                'where id = ? and user_id = ? and del_flag = false', [1, userId, orderId, userId], (error, changeRows) => {
                if (error) {
                    appLog.warn(error)
                    appLog.warn('支付处理出错')
                    return reject('支付处理出错')
                }
                if (changeRows === 0) {
                    return reject('订单不存在')
                }
                resolve(returnParams)
            }))
        })
    }).then(returnParams => {
        res.json(util.getSuccessData(returnParams))
    }).catch(error => {
        if (typeof error === 'string') {
            res.json(util.getFailureData(error, null))
        } else {
            next(error)
        }
    })
})
module.exports = router;
