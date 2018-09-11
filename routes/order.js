var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')

router.use(util.loginChecker)

router.post('/cancel', (req, res, next) => {
    let orderId = req.body.orderId
    let userId = req.session.wxInfo.userId
    dao.execute(new dao.update('update t_mall_order set status = ?, update_user = ?, update_time = CURRENT_TIMESTAMP, row_version = row_version + 1' +
        ' where id = ? and user_id = ? and del_flag = false', [101, userId, orderId, userId], (error, changeRows) => {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData({changeRows}))
    }))
})

router.get('/detail', (req, res, next) => {
    let userId = req.session.wxInfo.userId
    let orderId = req.query.orderId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectOne('select id, order_sn, user_id, status, actual_price, goods_price, freight_price, add_time,' +
            ' consignee, country, province, city, district, address, mobile from t_mall_order where id = ? and user_id = ? and del_flag = false', [orderId, userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            let order = util.transferFromRow(results, fields)
            order.addTime = `${order.addTime.getFullYear()}-${order.addTime.getMonth()}-${order.addTime.getDay()}` +
                ` ${order.addTime.getHours()}:${order.addTime.getMinutes()}:${order.addTime.getSeconds()}`
            order.orderStatusText = util.getOrderStatusText(order.status)
            order.handleOption = util.getOrderHandleOption(order.status)
            resolve(order)
        }))
    }).then(order => {
        return new Promise((resolve, reject) => {
            dao.execute(new dao.selectList('select id, name from t_mall_region where id in (?, ?, ?) and del_flag = false', [order.province, order.city, order.district], (error, results, fields) => {
                if (error) {
                    return reject(error)
                }
                let regionList = util.transferFromList(results, fields)
                order.provinceName = regionList.find(region => region.id === order.province).name
                order.cityName = regionList.find(region => region.id === order.city).name
                order.districtName = regionList.find(region => region.id === order.district).name
                order.fullRegion = order.provinceName + order.cityName + order.districtName
                resolve(order)
            }))
        })
    }).then(order => {
        return new Promise((resolve, reject) => {
            dao.execute(new dao.selectList(`select og.order_id, og.goods_id, og.goods_name, og.number, og.price, p.url, p.local_flag from t_mall_order_goods og
            inner join t_mall_goods g on (og.goods_id = g.id) left join t_mall_picture p on (g.cover_pic_id = p.id and p.del_flag = false)
            where og.order_id = ? and og.del_flag = false and g.del_flag = false`, [orderId], (error, results, fields) => {
                if (error) {
                    return reject(error)
                }
                let goodsList = util.transferFromList(results, fields)
                order.goodsList = goodsList.map(goods => {
                    if (goods.url != null) {
                        if (goods.localFlag == 1) {
                            goods.url =  env.picPrefix + goods.url
                        }
                    } else {
                        goods.url = env.picPrefix + env.defaultPicUrl
                    }
                    return goods
                })
                order.goodsCount = goodsList.reduce((prev, next) => prev + next.number, 0)
                resolve(order)
            }))
        })
    }).then(order => {
        res.json(util.getSuccessData(order))
    }).catch(error => {
        if (typeof error === 'string') {
            res.json(util.getFailureData(error, null))
        } else {
            next(error)
        }
    })
})

router.get('/list', (req, res, next) => {
    let userId = req.session.wxInfo.userId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectList('select id, order_sn, user_id, status, actual_price from t_mall_order where user_id = ? and del_flag = false order by update_time desc',
            [userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            let orderArray = util.transferFromList(results, fields).map(order => {
                order.orderStatusText = util.getOrderStatusText(order.status)
                order.handleOption = util.getOrderHandleOption(order.status)
                return order
            })
            resolve(orderArray)
        }))
    }).then(orderArray => {
        return new Promise((resolve, reject) => {
            let orderIdArray = orderArray.map(item => item.id)
            dao.execute(new dao.selectList(`select og.order_id, og.goods_id, og.goods_name, og.number, og.price, p.url, p.local_flag from t_mall_order_goods og
            inner join t_mall_goods g on (og.goods_id = g.id) left join t_mall_picture p on (g.cover_pic_id = p.id and p.del_flag = false)
            where og.order_id in (${new Array(orderIdArray.length).fill('?').join(',')}) and og.del_flag = false and g.del_flag = false`, orderIdArray, (error, results, fields) => {
                if (error) {
                    return reject(error)
                }
                let allGoodsList = util.transferFromList(results, fields)
                resolve(orderArray.map(item => {
                    let goodsList = allGoodsList.filter(goods => goods.orderId === item.id)
                    item.goodsList = goodsList.map(goods => {
                        if (goods.url == !null) {
                            if (goods.localFlag == 1) {
                                goods.url =  env.picPrefix + goods.url
                            }
                        } else {
                            goods.url = env.picPrefix + env.defaultPicUrl
                        }
                        return goods
                    })
                    item.goodsCount = goodsList.reduce((prev, next) => prev + next.number, 0)
                    return item
                }))
            }))
        })
    }).then(orderArray => {
        res.json(util.getSuccessData(orderArray))
    }).catch(error => {
        if (typeof error === 'string') {
            res.json(util.getFailureData(error, null))
        } else {
            next(error)
        }
    })
})

router.post('/submit', (req, res, next) => {
    let {addressId, postscript} = req.body
    let userId = req.session.wxInfo.userId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectOne('select id, name, country_id, province_id, city_id, district_id, address, mobile, is_default, row_version from t_mall_address' +
            ' where id = ? and user_id = ? and del_flag = false', [addressId, userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            if (!results || !results.id) {
                return reject('请选择收货地址')
            }
            resolve({
                postscript,
                addressData: util.transferFromRow(results, fields)
            })
        }))
    }).then(submitData => {
        return new Promise((resolve, reject) => {
            dao.execute(new dao.selectList('select c.id, c.goods_id, c.number, c.checked, g.name, g.price from t_mall_cart c inner join ' +
                ' t_mall_goods g on (c.goods_id = g.id) ' +
                'where c.user_id = ? and c.status = ? and c.checked = true and c.del_flag = false and g.del_flag = false', [userId, '0'], (error, results, fields) => {
                if (error) {
                    reject(error)
                } else {
                    let checkedGoodsList = util.transferFromList(results, fields)
                    var goodsTotalPrice = 0
                    let freightPrice = 0
                    let distinctGoodsList = []
                    checkedGoodsList.sort((item1, item2) => item1.goodsId - item2.goodsId)
                    checkedGoodsList.forEach((item) => {
                        if (distinctGoodsList.length == 0 || distinctGoodsList[distinctGoodsList.length - 1].goodsId !== item.goodsId) {
                            distinctGoodsList.push({goodsId: item.goodsId, number: item.number, goodsName: item.name, price: item.price})
                        } else {
                            distinctGoodsList[distinctGoodsList.length - 1].number += item.number
                        }
                        goodsTotalPrice += item.price * item.number
                    })
                    resolve(Object.assign(submitData, {
                        checkedGoodsList,
                        goodsTotalPrice,
                        freightPrice,
                        distinctGoodsList
                    }))
                }
            }))
        })
    }).then(submitData => {
        return new Promise((resolve, reject) => {
            let {
                addressData,
                postscript,
                goodsTotalPrice,
                freightPrice,
                distinctGoodsList,
                checkedGoodsList
            } = submitData
            // status为0表示订单初始化状态
            let insertParams = [util.generateSn('OD'), userId, 0, addressData.name, addressData.countryId, addressData.provinceId, addressData.cityId, addressData.districtId, addressData.address,
                addressData.mobile, postscript, goodsTotalPrice, goodsTotalPrice, freightPrice]
            dao.executeTransaction({}, new dao.insert('insert into t_mall_order (id, order_sn, user_id, status, consignee, country, province, city, district, address, mobile, postscript, ' +
                'actual_price, goods_price, add_time, freight_price) values (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)', insertParams, (error, insertId, other) => {
                if (error) {
                    return reject(error)
                }
                submitData.id = insertId
                submitData.orderSn = insertParams[0]
                let nextInsertSql = 'insert into t_mall_order_goods (order_id, goods_id, goods_name, number, price) values '
                    + `${new Array(distinctGoodsList.length).fill('(?, ?, ?, ?, ?)').join(',')}`
                let params = []
                distinctGoodsList.forEach((item) => {
                    params.push(...[insertId, item.goodsId, item.goodsName, item.number, item.price])
                })
                other.next.statement = nextInsertSql
                other.next.params = params
                // 因为next的statement和params都已经准备好了，并放入了other.commonParams.next，所以不再需要设置了
            }), new dao.insert('', [], (error, insertId, other) => {
                if (error) {
                    return reject(error)
                }
                // 购物车表中的status为1表示已下单
                let nextUpdateSql = 'update t_mall_cart set status = ?, order_id = ?, update_user = ?, update_time = CURRENT_TIMESTAMP, row_version = row_version + 1 where '
                    + `id in (${new Array(checkedGoodsList.length).fill('?').join(',')}) and user_id = ? and del_flag = false`
                let params = ['1', submitData.id, userId, ...checkedGoodsList.map(item => item.id), userId]
                other.next.statement = nextUpdateSql
                other.next.params = params
                // 因为next的statement和params都已经准备好了，并放入了other.commonParams.next，所以不再需要设置了
            }), new dao.update('', [], (error, changeRows, other) => {
                if (error) {
                    return reject(error)
                }
                resolve(submitData)
            }))
        })
    }).then(submitData => {
        res.json(util.getSuccessData(submitData))
    }).catch(error => {
        if (typeof error === 'string') {
            res.json(util.getFailureData(error, null))
        } else {
            next(error)
        }
    })
})

router.post('/submitJustBuy', (req, res, next) => {
    let {addressId, postscript, goodsId, number} = req.body
    let userId = req.session.wxInfo.userId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectOne('select id, name, country_id, province_id, city_id, district_id, address, mobile, is_default, row_version from t_mall_address' +
            ' where id = ? and user_id = ? and del_flag = false', [addressId, userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            if (!results || !results.id) {
                return reject('请选择收货地址')
            }
            resolve({
                postscript,
                addressData: util.transferFromRow(results, fields)
            })
        }))
    }).then(submitData => {
        return new Promise((resolve, reject) => {
            dao.execute(new dao.selectOne('select g.id, g.name, g.price from t_mall_goods g where g.id = ? and g.del_flag = false', [goodsId], (error, results, fields) => {
                if (error) {
                    reject(error)
                } else {
                    let checkedGoodsData = util.transferFromRow(results, fields)
                    let goodsTotalPrice = checkedGoodsData.price * number
                    let freightPrice = 0
                    // let distinctGoodsList = []
                    // checkedGoodsList.sort((item1, item2) => item1.goodsId - item2.goodsId)
                    // checkedGoodsList.forEach((item) => {
                    //     if (distinctGoodsList.length == 0 || distinctGoodsList[distinctGoodsList.length - 1].goodsId !== item.goodsId) {
                    //         distinctGoodsList.push({goodsId: item.goodsId, number: item.number, goodsName: item.name, price: item.price})
                    //     } else {
                    //         distinctGoodsList[distinctGoodsList.length - 1].number += item.number
                    //     }
                    //     goodsTotalPrice += item.price * item.number
                    // })
                    resolve(Object.assign(submitData, {
                        checkedGoodsData,
                        goodsTotalPrice,
                        freightPrice
                        // distinctGoodsList
                    }))
                }
            }))
        })
    }).then(submitData => {
        return new Promise((resolve, reject) => {
            let {
                addressData,
                postscript,
                goodsTotalPrice,
                freightPrice,
                checkedGoodsData
                // distinctGoodsList,
                // checkedGoodsList
            } = submitData
            // status为0表示订单初始化状态
            let insertParams = [util.generateSn('OD'), userId, 0, addressData.name, addressData.countryId, addressData.provinceId, addressData.cityId, addressData.districtId, addressData.address,
                addressData.mobile, postscript, goodsTotalPrice, goodsTotalPrice, freightPrice]
            dao.executeTransaction({}, new dao.insert('insert into t_mall_order (id, order_sn, user_id, status, consignee, country, province, city, district, address, mobile, postscript, ' +
                'actual_price, goods_price, add_time, freight_price) values (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)', insertParams, (error, insertId, other) => {
                if (error) {
                    return reject(error)
                }
                submitData.id = insertId
                submitData.orderSn = insertParams[0]
                let nextInsertSql = 'insert into t_mall_order_goods (order_id, goods_id, goods_name, number, price) values (?, ?, ?, ?, ?)'
                let params = []
                // distinctGoodsList.forEach((item) => {
                //     params.push(...[insertId, item.goodsId, item.goodsName, item.number, item.price])
                // })
                other.next.statement = nextInsertSql
                other.next.params = [insertId, checkedGoodsData.id, checkedGoodsData.name, number, checkedGoodsData.price]
                // 因为next的statement和params都已经准备好了，并放入了other.commonParams.next，所以不再需要设置了
            }), new dao.insert('', [], (error, insertId, other) => {
                if (error) {
                    return reject(error)
                }
                resolve(submitData)
            }))
        })
    }).then(submitData => {
        res.json(util.getSuccessData(submitData))
    }).catch(error => {
        if (typeof error === 'string') {
            res.json(util.getFailureData(error, null))
        } else {
            next(error)
        }
    })
})
module.exports = router;
