var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')

router.use(util.loginChecker)

router.post('/justBuy', (req, res, next) => {
    let {addressId, goodsId, number} = req.body
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
            dao.execute(new dao.selectOne('select g.id, g.name, g.price, p.url, p.local_flag from t_mall_goods g left join t_mall_picture p on (g.cover_pic_id = p.id and p.del_flag = false) ' +
                'where g.id = ? and g.del_flag = false', [goodsId], (error, results, fields) => {
                if (error) {
                    reject(error)
                } else {
                    let checkedGoods = util.transferFromRow(results, fields)
                    let goodsTotalPrice = checkedGoods.price * number
                    checkedGoods.number = number
                    let freightPrice = 0
                    if (checkedGoods.url == !null) {
                        if (checkedGoods.localFlag == 1) {
                            checkedGoods.url =  env.picPrefix + checkedGoods.url
                        }
                    } else {
                        checkedGoods.url = env.picPrefix + env.defaultPicUrl
                    }
                    resolve({
                        checkedAddress,
                        checkedGoodsList: [checkedGoods],
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

router.get('/list', (req, res, next) => {
    dao.execute(new dao.selectList('select g.id, g.name, g.type_id, d.name as type_name, p.url as url, p.local_flag as local_flag ' +
        'from t_mall_goods g left join t_dictionary d ' +
        'on (g.type_id = d.value and d.table_name = \'t_mall_goods\' and d.column_name =  \'type_id\' and d.del_flag = false)' +
        ' left join t_mall_picture p on (g.cover_pic_id = p.id and p.del_flag = false)' +
        ' where g.del_flag = false', [], function (error, results, fields) {
        if (error) {
            return next(error)
        }
        var transResult = util.transferFromList(results, fields)
        var typeSet = new Set()
        transResult.forEach((item) => {
            if (item.url == !null) {
                if (item.localFlag == 1) {
                    item.url =  env.picPrefix + item.url
                }
            } else {
                item.url = env.picPrefix + env.defaultPicUrl
            }
            typeSet.add(item.typeId)
        })
        var retData = new Array()
        typeSet.forEach(typeId => {
            var typeData = {
                typeId: typeId,
                itemList: transResult.filter(item => item.typeId === typeId)
            }
            typeData.typeName = typeData.itemList[0].typeName
            retData.push(typeData)
        })
        res.json(util.getSuccessData(retData))
    }))
});

router.get('/detail', (req, res, next) => {
    var goodsId = req.query.id
    dao.executeList({id: goodsId}, new dao.selectOne('select id, name, price, introduction, out_flag, cover_pic_id from t_mall_goods ' +
        'where id = ? and del_flag = false', [goodsId], (error, results, fields, others) => {
        if (error) {
            return next(error)
        }
        var goodsInfo = util.transferFromRow(results, fields)
        if (goodsInfo == null) {
            return next(new Error('找不到商品'))
        }
        goodsInfo.attributes = goodsInfo.attributes == null ? [] : JSON.parse(goodsInfo.attributes)
        goodsInfo.faqs = goodsInfo.faqs == null ? [] : JSON.parse(goodsInfo.faqs)
        others.commonParams.goodsInfo = goodsInfo
    }), new dao.selectList('select p.id, p.url, p.local_flag from t_mall_goods_picture gp inner join t_mall_picture p on (gp.picture_id = p.id) where gp.goods_id = ? ' +
        'and gp.del_flag = false and p.del_flag = false', [goodsId], (error, results, fields, others) => {
        if (error) {
            return next(error)
        }
        var goodsInfo = others.commonParams.goodsInfo
        var picList = [{
            id: -1,
            url: env.picPrefix + env.defaultPicUrl,
            localFlag: 1
        }]
        if (results.length > 0) {
            picList = util.transferFromList(results, fields)
        }
        goodsInfo.picList = picList
        res.json(util.getSuccessData(goodsInfo))
    }))
});
module.exports = router;
