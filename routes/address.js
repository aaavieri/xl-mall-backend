var express = require('express');
const env = require('../config/env')
var router = express.Router();
const dao = require('../dao/dao');
const util = require('../util/util')

router.use(util.loginChecker)

router.get('/detail', (req, res, next) => {
    let addressId = req.query.id
    let wxInfo = req.session.wxInfo
    let userId = wxInfo.userId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectOne('select id, name, country_id, province_id, city_id, district_id, address, mobile, is_default, row_version from t_mall_address' +
            ' where id = ? and user_id = ? and del_flag = false', [addressId, userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            resolve(util.transferFromRow(results, fields))
        }))
    }).then(addressData => {
        return new Promise((resolve, reject) => {
            let {provinceId, cityId, districtId} = addressData
            dao.execute(new dao.selectList('select id, name from t_mall_region where id in (?, ?, ?)' +
                'and del_flag = false', [provinceId, cityId, districtId], (error, results, fields) => {
                if (error) {
                    return reject(error)
                }
                let transferResults = util.transferFromList(results, fields)

                addressData.provinceName = transferResults.find((item) => item.id === provinceId).name
                addressData.cityName = transferResults.find((item) => item.id === cityId).name
                addressData.districtName = transferResults.find((item) => item.id === districtId).name
                addressData.fullRegion = addressData.provinceName + addressData.cityName + addressData.districtName
                resolve(addressData)
            }))
        })
    }).then(addressData => {
        res.json(util.getSuccessData(addressData))
    }).catch(error => {
        next(error)
    })
})

router.get('/list', (req, res, next) => {
    let wxInfo = req.session.wxInfo
    let userId = wxInfo.userId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectList('select id, name, country_id, province_id, city_id, district_id, address, mobile, is_default, row_version from t_mall_address' +
            ' where user_id = ? and del_flag = false', [userId], (error, results, fields) => {
            if (error) {
                return reject(error)
            }
            resolve(util.transferFromList(results, fields))
        }))
    }).then(addressList => {
        return new Promise((resolve, reject) => {
            let regionSet = new Set()
            addressList.forEach((item) => {
                let {provinceId, cityId, districtId} = item
                regionSet.add(provinceId)
                regionSet.add(cityId)
                regionSet.add(districtId)
            })
            dao.execute(new dao.selectList(`select id, name from t_mall_region where id in (${new Array(regionSet.size).fill('?').join(',')})` +
                'and del_flag = false', Array.from(regionSet), (error, results, fields) => {
                if (error) {
                    return reject(error)
                }
                let transferResults = util.transferFromList(results, fields)
                addressList.forEach((address) => {
                    let {provinceId, cityId, districtId} = address
                    address.provinceName = transferResults.find((item) => item.id === provinceId).name
                    address.cityName = transferResults.find((item) => item.id === cityId).name
                    address.districtName = transferResults.find((item) => item.id === districtId).name
                    address.fullRegion = address.provinceName + address.cityName + address.districtName
                })
                resolve(addressList)
            }))
        })
    }).then(addressList => {
        res.json(util.getSuccessData(addressList))
    }).catch(error => {
        next(error)
    })
})

router.post('/save', (req, res, next) => {
    let {
        id,
        name,
        mobile,
        provinceId,
        cityId,
        districtId,
        address,
        isDefault
    } = req.body
    let wxInfo = req.session.wxInfo
    let userId = wxInfo.userId
    new Promise((resolve, reject) => {
        dao.execute(new dao.selectList('select id, is_default from t_mall_address where user_id = ? and id <> ? and del_flag = false order by id',
            [userId, id], (error, results, fields) => {
            if (results.length >= env.maxAddress && id <= 0) {
                reject(new Error('您的地址超过8条了，请删除之后再添加'))
            } else {
                resolve(util.transferFromList(results, fields))
            }
        }))
    }).then(originAddressList => {
        return new Promise((resolve, reject) => {
            let originDefaultAddress = originAddressList.find(item => item.isDefault)
            let saveData = [name, userId, 1, provinceId, cityId, districtId, address, mobile, isDefault]
            if (id <= 0) {
                // 如果不存在其它的默认地址，则强制把当前地址设为默认
                let insertDefault = isDefault === 1 ? 1 : (!originDefaultAddress ? 1 : 0)
                saveData[8] = insertDefault
                dao.execute(new dao.insert('insert into t_mall_address (id, name, user_id, country_id, province_id, city_id, district_id, address, mobile, is_default) values ' +
                    '(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)', saveData, (error, insertId) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve({
                            addressId: insertId,
                            action: 'add',
                            saveDefault: insertDefault,
                            originAddressList,
                            originDefaultAddress
                        })
                    }
                }))
            } else {
                // 如果不存在其它的地址（即条数为0），则强制把当前地址设为默认
                let updateDefault = isDefault === 1 ? 1 : (!originAddressList.length > 0 ? 0 : 1)
                saveData[8] = updateDefault
                dao.execute(new dao.update('update t_mall_address set name = ?, user_id = ?, country_id = ?, province_id = ?, city_id = ?, district_id = ?,' +
                    ' address = ?, mobile = ?, is_default = ?, update_time = CURRENT_TIMESTAMP, update_user = ?, row_version = row_version + 1' +
                    ' where id = ? and user_id = ? and del_flag = false', [...saveData, userId, id, userId], (error, changeRows) => {
                    if (error) {
                        reject(error)
                    } else {
                        if (changeRows === 0) {
                            reject(new Error('更新地址失败'))
                        } else {
                            resolve({
                                addressId: id,
                                action: 'update',
                                saveDefault: updateDefault,
                                originAddressList,
                                originDefaultAddress
                            })
                        }
                    }
                }))
            }
        })
    }).then((pendingData) => {
        return new Promise((resolve, reject) => {
            let {
                addressId,
                action,
                saveDefault,
                originAddressList,
                originDefaultAddress
            } = pendingData
            var defaultId = addressId
            // 如果当前保存数据不是默认值，且为更新状态
            if (!saveDefault) {
                // 如果原数据中存在默认值，则获取该默认值
                if (originDefaultAddress) {
                    defaultId = originDefaultAddress.id
                } else {
                    // 如果原数据中不存在默认值，则使用原数据的第一条作为默认值
                    defaultId = originAddressList[0].id
                }
            }
            dao.execute(new dao.update('update t_mall_address set is_default = (id = ?), update_time = CURRENT_TIMESTAMP, update_user = ?, row_version = row_version + 1' +
                ' where user_id = ? and del_flag = false', [defaultId, userId, userId], (error, changeRows) => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            }))
        })
    }).then(() => {
        res.json(util.getSuccessData({}))
    }).catch((error) => {
        next(error)
    })
})

router.post('/delete', (req, res, next) => {
    let addressId = req.body.id
    let userId = req.session.wxInfo.userId
    dao.execute(new dao.update('update t_mall_address set del_flag = true, update_user = ?, update_time = CURRENT_TIMESTAMP, row_version = row_version + 1 ' +
        'where id = ? and user_id = ? and del_flag = false', [userId, addressId, userId], (error, changeRows) => {
        if (error) {
            return next(error)
        }
        res.json(util.getSuccessData({changeRows}))
    }))
})

module.exports = router;