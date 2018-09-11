var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')

router.use(util.loginChecker)
router.get('/index', (req, res, next) => {
    let wxInfo = req.session.wxInfo
    showCartData(wxInfo.userId, res, next)
})

router.post('/checkout', (req, res, next) => {
    let addressId = req.body.addressId
    let wxInfo = req.session.wxInfo
    let params = [wxInfo.userId]
    new Promise((resolve, reject) => {
        var selectSql = 'select id, name, country_id, province_id, city_id, district_id, address, mobile, is_default from t_mall_address where user_id = ?'
        if (addressId <= 0) {
            selectSql += ' and is_default = true'
        } else {
            selectSql += ' and id = ?'
            params.push(addressId)
        }
        dao.execute(new dao.selectOne(selectSql, params, (error, results, fields) => {
            if (error) {
                reject(error)
            } else {
                resolve(util.transferFromRow(results, fields))
            }
        }))
    }).then((addressData) => {
        return new Promise((resolve, reject) => {
            if (!addressData) {
                resolve({id: 0})
                return
            }
            let {provinceId, cityId, districtId} = addressData
            dao.execute(new dao.selectList('select id, name from t_mall_region where id in (?, ?, ?) and del_flag = false', [provinceId, cityId, districtId], (error, results, fields) => {
                if (error) {
                    reject(error)
                } else {
                    var transferResults = util.transferFromList(results, fields)
                    addressData.provinceName = transferResults.find((item) => item.id === provinceId).name
                    addressData.cityName = transferResults.find((item) => item.id === cityId).name
                    addressData.districtName = transferResults.find((item) => item.id === districtId).name
                    addressData.fullRegion = addressData.provinceName + addressData.cityName + addressData.districtName
                    resolve(addressData)
                }
            }))
        })
    }).then((checkedAddress) => {
        return new Promise((resolve, reject) => {
            dao.execute(new dao.selectList('select c.id, c.goods_id, c.number, c.checked, g.name, g.price, p.url, p.local_flag from t_mall_cart c inner join ' +
                ' t_mall_goods g on (c.goods_id = g.id) left join t_mall_picture p on (g.cover_pic_id = p.id and p.del_flag = false) ' +
                'where c.user_id = ? and c.status = ? and c.del_flag = false and g.del_flag = false', [wxInfo.userId, '0'], (error, results, fields) => {
                if (error) {
                    reject(error)
                } else {
                    var checkedGoodsList = util.transferFromList(results, fields).filter((item) => item.checked)
                    var goodsTotalPrice = 0
                    var freightPrice = 0
                    checkedGoodsList.forEach((item) => {
                        if (item.url == !null) {
                            if (item.localFlag == 1) {
                                item.url =  env.picPrefix + item.url
                            }
                        } else {
                            item.url = env.picPrefix + env.defaultPicUrl
                        }
                        goodsTotalPrice += item.price * item.number
                    })
                    resolve({
                        checkedAddress,
                        checkedGoodsList,
                        goodsTotalPrice,
                        freightPrice,
                        actualPrice: goodsTotalPrice + freightPrice
                    })
                }
            }))
        })
    }).then((data) => {
        res.json(util.getSuccessData(data))
    }).catch((error) => {
        return next(error)
    })
})

router.post('/delete', (req, res, next) => {
    let {cartIds: ids} = req.body
    dao.execute(new dao.update('update t_mall_cart set del_flag = true, status = ?, update_time = CURRENT_TIMESTAMP, update_user = ?, row_version = row_version + 1' +
        // status = 9表示删除掉的购物车数据
        ` where id in (${new Array(ids.length).fill('?').join(',')}) and user_id = ?`, ['9', req.session.wxInfo.userId, ...ids, req.session.wxInfo.userId], (error, changeRows) => {
        if (error) {
            return next(error)
        }
        showCartData(req.session.wxInfo.userId, res, next)
    }))
})

router.post('/update', (req, res, next) => {
    let {id, number} = req.body
    dao.execute(new dao.update('update t_mall_cart set number = ?, update_time = CURRENT_TIMESTAMP, update_user = ?, row_version = row_version + 1' +
        ' where id = ? and user_id = ?', [number, req.session.wxInfo.userId, id, req.session.wxInfo.userId], (error, changeRows) => {
        if (error) {
            return next(error)
        }
        showCartData(req.session.wxInfo.userId, res, next)
    }))
})

router.post('/checked', (req, res, next) => {
    let {cartIds, isChecked} = req.body
    var updateSql = 'update t_mall_cart set checked = ?, update_time = CURRENT_TIMESTAMP, update_user = ?, row_version = row_version + 1 '
    if (cartIds.length > 1) {
        updateSql += ` where id in (${new Array(cartIds.length).fill('?').join(',')}) and user_id = ? and del_flag = false`
    } else {
        updateSql += ' where id = ? and user_id = ? and del_flag = false'
    }
    var params = [isChecked, req.session.wxInfo.userId, ...cartIds, req.session.wxInfo.userId]
    dao.execute(new dao.update(updateSql, params, (error, changeRows) => {
        if (error) {
            return next(error)
        }
        showCartData(req.session.wxInfo.userId, res, next)
    }))
})

router.get('/goodsCount', (req, res, next) => {
    var wxInfo = req.session.wxInfo
    dao.execute(new dao.selectOne('select coalesce(sum(number), 0) as goodsCount from t_mall_cart where user_id = ? and status = ? and del_flag = false',
        [wxInfo.userId, '0'], (error, results, fields) => {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(results))
    }))
})

router.post('/add', (req, res, next) => {
    var wxInfo = req.session.wxInfo
    if (!req.body.goodsId) {
        return next(util.get200Err('请选择商品'))
    }
    if (!req.body.number) {
        return next(util.get200Err('请选择数量'))
    }
    dao.executeTransaction({}, new dao.insert('insert into t_mall_cart (id, user_id, session_id, goods_id, number, status) values ' +
        '(null, ?, ?, ?, ?, ?)', [wxInfo.userId, wxInfo.sessionKey, req.body.goodsId, req.body.number, '0'], (error, insertId) => {
        if (error) {
            return next(error)
        }
    }), new dao.selectOne('select coalesce(sum(number), 0) as goodsCount from t_mall_cart where user_id = ? and status = ? and del_flag = false',
        [wxInfo.userId, '0'], (error, results, fields) => {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData(results))
    }))
})

function showCartData (userId, res, next) {
    dao.execute(new dao.selectList('select c.id, c.goods_id, c.number, c.checked, g.name, g.price, p.url, p.local_flag from t_mall_cart c inner join ' +
        ' t_mall_goods g on (c.goods_id = g.id) left join t_mall_picture p on (g.cover_pic_id = p.id and p.del_flag = false) ' +
        'where c.user_id = ? and c.status = ? and c.del_flag = false and g.del_flag = false', [userId, '0'], (error, results, fields) => {
        if (error) {
            return next(error)
        }
        var cartList = util.transferFromList(results, fields)
        var cartTotal = {
            goodsCount: 0,
            goodsAmount: 0.00,
            checkedGoodsCount: 0,
            checkedGoodsAmount: 0.00
        }
        cartList.forEach((item) => {
            if (item.url == !null) {
                if (item.localFlag == 1) {
                    item.url =  env.picPrefix + item.url
                }
            } else {
                item.url = env.picPrefix + env.defaultPicUrl
            }
            if (item.checked) {
                item.checked = true
                cartTotal.checkedGoodsCount += item.number
                cartTotal.checkedGoodsAmount += item.number * item.price
            } else {
                item.checked = false
            }
            cartTotal.goodsCount += item.number
            cartTotal.goodsAmount += item.number * item.price
        })
        res.json(util.getSuccessData({
            cartTotal,
            cartList
        }))
    }))
}

module.exports = router;