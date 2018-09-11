const md5 = require('md5');
const WeiXinPay = require('weixinpay');
const env = require('../config/env')
var appLog = require('../logger/appLogger')

/**
 * 统一下单
 * @param payInfo
 * @returns {Promise}
 */
exports.createUnifiedOrder = (payInfo) => {

    const weixinpay = new WeiXinPay({
        appid: env.appId, // 微信小程序appid
        openid: payInfo.openid, // 用户openid
        mch_id: env.payAccount, // 商户帐号ID
        partner_key: env.paySecret // 秘钥
    });
    return new Promise((resolve, reject) => {
        weixinpay.createUnifiedOrder({
            body: payInfo.body,
            out_trade_no: payInfo.out_trade_no,
            total_fee: payInfo.total_fee,
            spbill_create_ip: payInfo.spbill_create_ip,
            notify_url: env.payPrefix + env.payCallback,
            trade_type: 'JSAPI'
        }, res => {
            if (res.return_code === 'SUCCESS' && res.result_code === 'SUCCESS') {
                const returnParams = {
                    'appid': res.appid,
                    'timeStamp': parseInt(Date.now() / 1000) + '',
                    'nonceStr': res.nonce_str,
                    'package': 'prepay_id=' + res.prepay_id,
                    'signType': 'MD5'
                };
                const paramStr = `appId=${returnParams.appid}&nonceStr=${returnParams.nonceStr}&package=${returnParams.package}&signType=${returnParams.signType}&timeStamp=${returnParams.timeStamp}&key=${env.paySecret}`;
                returnParams.paySign = md5(paramStr).toUpperCase();
                resolve(returnParams);
            } else {
                // reject(res);
                appLog.warn('微信支付失败')
                appLog.warn(res)
                reject(res.err_code_des ? res.err_code_des : '微信支付失败')
            }
        });
    });
}

exports.payNotify = function (notifyData) {
    if ((!notifyData || Object.keys(notifyData).length === 0)) {
        return false;
    }

    const notifyObj = {};
    let sign = '';
    for (const key of Object.keys(notifyData)) {
        if (key !== 'sign') {
            notifyObj[key] = notifyData[key];
        } else {
            sign = notifyData[key];
        }
    }
    if (notifyObj.return_code !== 'SUCCESS' || notifyObj.result_code !== 'SUCCESS') {
        return false;
    }
    const signString = this.signQuery(this.buildQuery(notifyObj));
    if (sign.length === 0 || signString !== sign) {
        return false;
    }
    return notifyObj;
}

exports.signQuery = function (queryStr) {
    queryStr = queryStr + '&key=' + env.paySecret;
    const md5Sign = md5(queryStr);
    return md5Sign.toUpperCase();
}

/**
 * 生成排序后的支付参数 query
 * @param queryObj
 * @returns {Promise.<string>}
 */
exports.buildQuery = function (queryObj) {
    const sortPayOptions = {};
    for (const key of Object.keys(queryObj).sort()) {
        sortPayOptions[key] = queryObj[key];
    }
    let payOptionQuery = '';
    for (const key of Object.keys(sortPayOptions).sort()) {
        payOptionQuery += key + '=' + sortPayOptions[key] + '&';
    }
    payOptionQuery = payOptionQuery.substring(0, payOptionQuery.length - 1);
    return payOptionQuery;
}