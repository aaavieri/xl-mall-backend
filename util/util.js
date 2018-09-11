const crypto = require('crypto')
const _ = require('lodash');

const systemArr = ['delFlag', 'createTime', 'createUser', 'updateTime', 'updateUser', 'rowVersion']

exports.md5 = function (str) {
    str = str || ''
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}
// 把DB命名转换成驼峰命名
exports.transferFromList = function (arr, fields) {
    var that = this
    return arr.map(function (row) {
        return that.transferFromRow(row, fields)
        // return row
    })
}
exports.transferFromRow = function (row, fields) {
    if (!row) {
        return null
    }
    var result = {}
    fields.map(function (field) {
        result[exports.underLineToHump(field.name)] = row[field.name]
    })
    return result
}
// 下划线转驼峰
exports.underLineToHump = function (str) {
    return str.split('_').map(function (word, index) {
        if (index === 0) return word
        return word.split('').map(function (char, charIndex) {
            return charIndex === 0 ? char.toLocaleUpperCase() : char
        }).join('')
    }).join('')
}

// 驼峰转下划线
exports.humpToUnderLine = function (str) {
    return str.split('').map(function (word) {
        if (word.toLocaleUpperCase() === word) {
            return '_' + word.toLocaleLowerCase()
        } else {
            return word
        }
    }).join('')
}

exports.loginChecker = function(req, res, next) {
    if (req.session.wxInfo) {
        return next()
    } else {
        res.json({
            success: false,
            loginError: true,
            data: null,
            errMsg: '您尚未登录，微信信息为空'
        })
    }
}

exports.getSuccessData = function (data) {
    return {
        success: true,
        data: data,
        errMsg: null
    }
}

exports.getFailureData = function (errMsg, data) {
    return {
        success: false,
        data: data,
        errMsg: errMsg
    }
}

exports.getTableName = function (dataType) {
    var tableName = ''
    switch (dataType) {
        case '1':
            tableName = 't_medical'
            break
        case '2':
            tableName = 't_healthy'
            break
        default:
            tableName = 't_medical'
    }
    return tableName
}

exports.leftPad = function (number, n) {
    return (Array(n).join('0') + number).slice(-n);
}

exports.rightPad = function (number, n) {
    return (number + Array(n).join('0')).slice(0, n);
}

exports.isUpdateColumn = function (columnName) {
    return systemArr.filter(function (value) {
        return value === columnName
    }).length == 0
}

exports.get200Err = function (msg) {
    return this.getErr(msg, 200)
}

exports.getErr = function (msg, status) {
    var err = new Error(msg)
    if (status) {
        err.status = status
    }
    return err
}

exports.generateSn = function (prefix) {
    const date = new Date();
    return prefix + date.getFullYear() + _.padStart(date.getMonth(), 2, '0') + _.padStart(date.getDay(), 2, '0') + _.padStart(date.getHours(), 2, '0') + _.padStart(date.getMinutes(), 2, '0') + _.padStart(date.getSeconds(), 2, '0') + _.random(1000, 9999);
}

exports.getOrderStatusText = function (status) {
    let orderStatusText = '未付款'
    switch (status) {
        case 0:
            orderStatusText = '未付款'
            break
        case 1:
            orderStatusText = '支付中'
            break
        case 101:
            orderStatusText = '已取消'
            break
        case 201:
            orderStatusText = '已付款'
            break
    }
    return orderStatusText
}

exports.getOrderHandleOption = function (status) {
    const handleOption = {
        cancel: false, // 取消操作
        delete: false, // 删除操作
        pay: false, // 支付操作
        comment: false, // 评论操作
        delivery: false, // 确认收货操作
        confirm: false, // 完成订单操作
        return: false, // 退换货操作
        buy: false // 再次购买
    };

    // 订单流程：下单成功－》支付订单－》发货－》收货－》评论
    // 订单相关状态字段设计，采用单个字段表示全部的订单状态
    // 10以下表示订单取消和删除等状态 0订单创建成功等待付款，101订单已取消，102订单已删除
    // 2xx表示订单支付状态,201订单已付款，等待发货
    // 3xx表示订单物流相关状态,300订单已发货，301用户确认收货
    // 4xx表示订单退换货相关的状态,401没有发货，退款402,已收货，退款退货
    // 如果订单已经取消或是已完成，则可删除和再次购买
    // 增加：1表示支付确认中
    if (status === 101) {
        handleOption.delete = true;
        handleOption.buy = true;
    }

    // 如果订单没有被取消，且没有支付，则可支付，可取消
    if (status === 0) {
        handleOption.cancel = true;
        handleOption.pay = true;
    }

    if (status === 1) {
        handleOption.cancel = true;
        handleOption.pay = true;
    }

    // 如果订单已付款，没有发货，则可退款操作
    if (status === 201) {
        handleOption.return = true;
    }

    // 如果订单已经发货，没有收货，则可收货操作和退款、退货操作
    if (status === 300) {
        handleOption.cancel = true;
        handleOption.pay = true;
        handleOption.return = true;
    }

    // 如果订单已经支付，且已经收货，则可完成交易、评论和再次购买
    if (status === 301) {
        handleOption.delete = true;
        handleOption.comment = true;
        handleOption.buy = true;
    }

    return handleOption;
}
