var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')
const wxUtil = require('../util/wxUtil')
let appLog = require('../logger/appLogger')

router.post('/payNotify', (req, res, next) => {
    let xml = req.body.xml

    saveNotifyLog(xml).then(() => {
        return new Promise((resolve, reject) => {
            let result = wxUtil.payNotify(xml)
            if (!result) {
                reject('支付失败')
            } else {
                resolve(result)
            }
        })
    }).then(result => {
        return new Promise((resolve, reject) => {
            let orderSn = result.out_trade_no
            dao.execute(new dao.selectOne('select id, order_sn, user_id, status, actual_price from t_mall_order where order_sn = ? and del_flag = false', [orderSn], (error, results, fields) => {
                if (error) {
                    appLog.warn(error)
                    appLog.warn('支付处理出错')
                    return reject('支付处理出错')
                }
                if (!results || !results.id) {
                    return reject('订单不存在')
                }
                let orderData = util.transferFromRow(results, fields)
                if (orderData.status === 201) {
                    return reject('订单已支付')
                }
                resolve(orderData)
            }))
        })
    }).then(orderData => {
        return new Promise((resolve, reject) => {
            dao.execute(new dao.update('update t_mall_order set status = ?, update_user = ?, update_time = CURRENT_TIMESTAMP, row_version = row_version + 1 ' +
                'where id = ? and del_flag = false', [201, 'alipay', orderData.id], (error, changeRows) => {
                if (error) {
                    appLog.warn(error)
                    appLog.warn('支付处理出错')
                    return reject('支付处理出错')
                }
                if (changeRows === 0) {
                    return reject('订单不存在')
                }
                resolve()
            }))
        })
    }).then(() => {
        res.send(`<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`)
    }).catch(error => {
        if (typeof error === 'string') {
            res.send(`<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${error}]></return_msg></xml>`)
        } else {
            next(error)
        }
    })
})
function saveNotifyLog (xml) {
    return new Promise((resolve, reject) => {
        if (!xml || Object.keys(xml).length === 0) {
            reject('支付失败，收到xml数据为空')
        }
        dao.execute(new dao.selectOne('select id from t_mall_pay_notify where transaction_id = ?', [xml.transaction_id], (err, results, fields) => {
            resolve(results ? results.id: null)
        }))
    }).then((id) => {
        return new Promise((resolve) => {
            // let couponTypes = Object.keys(xml).filter(key => key.startsWith('coupon_type_'))
            //     .reduce((prev, next, index) => `${prev}${index === 0 ? '' : ','}${xml[next]}`, '')
            // let couponIds = Object.keys(xml).filter(key => key.startsWith('coupon_id_'))
            //     .reduce((prev, next, index) => `${prev}${index === 0 ? '' : ','}${xml[next]}`, '')
            // let couponFeeTotal = Object.keys(xml).filter(key => key.startsWith('coupon_fee_'))
            //     .reduce((prev, next) => prev + xml[next], 0)
            let insertSql = 'insert into t_mall_pay_notify (id, app_id '
            let updateSql = 'update t_mall_pay_notify set app_id = ? '
            let couponTypes = ''
            let couponIds = ''
            let couponFeeTotal = 0
            let saveData = [xml.appid]
            Object.keys(xml).map(key => {
                if (key.startsWith('coupon_type_')) {
                    couponTypes = `${couponTypes}${couponTypes.length === 0 ? '' : ','}${xml[key]}`
                } else if (key.startsWith('coupon_id_')) {
                    couponIds = `${couponIds}${couponIds.length === 0 ? '' : ','}${xml[key]}`
                } else if (key.startsWith('coupon_fee_')) {
                    couponFeeTotal += xml[key]
                } else if (key !== 'appid') {
                    insertSql = `${insertSql}, ${key}`
                    updateSql = `${updateSql}, ${key} = ?`
                    saveData.push(xml[key])
                }
            })
            saveData.push(...[couponTypes, couponIds, couponFeeTotal])
            insertSql = `${insertSql}, coupon_types, coupon_ids, coupon_fee_total) values (null, ${new Array(saveData.length).fill('?').join(',')})`
            updateSql = `${updateSql}, coupon_types = ?, coupon_ids = ?, coupon_fee_total = ?, update_user = 'alipay', update_time = CURRENT_TIMESTAMP,
                row_version = row_version + 1 where id = ?`
            // let saveData = [xml.appid, xml.mch_id, xml.device_info, xml.nonce_str, xml.sign, xml.sign_type, xml.result_code, xml.err_code,
            //     xml.err_code_des, xml.openid, xml.is_subscribe, xml.trade_type, xml.bank_type, xml.total_fee, xml.settlement_total_fee,
            //     xml.fee_type, xml.cash_fee, xml.cash_fee_type, xml.coupon_fee, xml.coupon_count, couponTypes, couponIds,
            //     couponFeeTotal, xml.transaction_id, xml.out_trade_no, xml.attach, xml.time_end]
            // 插入日志，即使没有日志也不用回滚
            if (!id) {
                dao.execute(new dao.insert(insertSql, saveData , (err, insertId) => {
                    if (err) {
                        appLog.error(err)
                    } else {
                        appLog.info(`插入数据：${insertId}`)
                    }
                    resolve()
                }))
            } else {
                saveData.push(id)
                dao.execute(new dao.update(updateSql, saveData , (err, changeRows) => {
                    if (err) {
                        appLog.error(err)
                    } else {
                        appLog.info(`更新数据：${changeRows}条`)
                    }
                    resolve()
                }))
            }
        })
    })
}
module.exports = router;
