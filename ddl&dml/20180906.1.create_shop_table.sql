CREATE TABLE `t_mall_address` (
  `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL DEFAULT '',
  `user_id` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `country_id` smallint(5) NOT NULL DEFAULT '0',
  `province_id` smallint(5) NOT NULL DEFAULT '0',
  `city_id` smallint(5) NOT NULL DEFAULT '0',
  `district_id` smallint(5) NOT NULL DEFAULT '0',
  `address` varchar(255) NOT NULL DEFAULT '',
  `mobile` varchar(20) NOT NULL DEFAULT '',
  `is_default` tinyint(1) unsigned NOT NULL DEFAULT '0',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `t_mall_cart` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT '0',
  `session_id` char(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `goods_id` int(11) NOT NULL DEFAULT '0',
  `number` smallint(5) NOT NULL DEFAULT '0',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态，0：购物车中，1：已生成订单，9：已删除',
  `checked` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否被用户勾选',
  `order_id` int(11) DEFAULT '0' COMMENT '订单编号',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `t_mall_goods` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '商品编号',
  `serial` varchar(7) DEFAULT NULL COMMENT '关联项目编号',
  `name` varchar(45) NOT NULL COMMENT '商品名称',
  `type_id` varchar(5) NOT NULL COMMENT '商品类别AKA产品系列ID',
  `price` decimal(7,2) NOT NULL DEFAULT '0.00' COMMENT '商品介绍',
  `cover_pic_id` int(11) DEFAULT NULL COMMENT '商品封面图片ID',
  `introduction` text COMMENT '商品介绍',
  `attributes` text COMMENT '属性',
  `faqs` text COMMENT '常见问题',
  `out_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '缺货标志',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `t_mall_goods_picture` (
  `goods_id` int(11) NOT NULL COMMENT '商品编号',
  `picture_id` int(11) NOT NULL COMMENT '图片编号',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`goods_id`,`picture_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `t_mall_order` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '订单编号（面向系统的编号）',
  `order_sn` varchar(20) NOT NULL DEFAULT '' COMMENT '订单号（面向用户的编号）',
  `user_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '用户ID',
  `status` smallint(5) NOT NULL DEFAULT '0' COMMENT '状态码',
  `consignee` varchar(60) NOT NULL DEFAULT '' COMMENT '收货人',
  `country` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '国家',
  `province` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '省份',
  `city` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '城市',
  `district` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '区',
  `address` varchar(255) NOT NULL DEFAULT '' COMMENT '地址',
  `mobile` varchar(20) NOT NULL DEFAULT '' COMMENT '电话',
  `postscript` varchar(255) NOT NULL DEFAULT '' COMMENT '留言',
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '运输费',
  `pay_name` varchar(120) NOT NULL DEFAULT '',
  `pay_id` tinyint(3) NOT NULL DEFAULT '0',
  `actual_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实际需要支付的金额',
  `goods_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '商品总价',
  `add_time` datetime DEFAULT NULL COMMENT '订单生成时间',
  `confirm_time` datetime DEFAULT NULL COMMENT '订单确认时间',
  `pay_time` datetime DEFAULT NULL COMMENT '订单支付时间',
  `freight_price` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '配送费用',
  `parent_id` mediumint(8) unsigned NOT NULL DEFAULT '0',
  `callback_status` tinyint(1) DEFAULT '1',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_sn` (`order_sn`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`),
  KEY `pay_id` (`pay_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `t_mall_order_goods` (
  `order_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '订单ID',
  `goods_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '商品编号',
  `goods_name` varchar(120) NOT NULL DEFAULT '' COMMENT '商品名',
  `number` smallint(5) unsigned NOT NULL DEFAULT '1' COMMENT '购买数量',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '购买价格',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`order_id`,`goods_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `t_mall_picture` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(100) NOT NULL COMMENT '图片地址',
  `local_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否服务器本地图片标识',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `t_mall_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户编号',
  `open_id` varchar(30) NOT NULL COMMENT '微信openid',
  `last_login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最后登录时间',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`),
  UNIQUE KEY `open_id_UNIQUE` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `t_mall_pay_notify` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '支付通知日志编号',
  `app_id` varchar(32) NOT NULL DEFAULT '' COMMENT '微信分配的公众账号ID',
  `mch_id` varchar(32) NOT NULL DEFAULT '' COMMENT '商户号',
  `device_info` varchar(32) DEFAULT NULL COMMENT '设备号',
  `nonce_str` varchar(32) NOT NULL COMMENT '随机字符串',
  `sign` varchar(32) NOT NULL COMMENT '签名',
  `sign_type` varchar(32) DEFAULT 'MD5' COMMENT '签名类型',
  `result_code` varchar(16) NOT NULL COMMENT '业务结果',
  `err_code` varchar(32) DEFAULT NULL COMMENT '错误代码	',
  `err_code_des` varchar(128) DEFAULT NULL COMMENT '错误代码描述',
  `openid` varchar(32) NOT NULL COMMENT '用户标识',
  `is_subscribe` char(1) DEFAULT NULL COMMENT '是否关注公众账号	',
  `trade_type` varchar(16) NOT NULL COMMENT '交易类型',
  `bank_type` varchar(16) NOT NULL COMMENT '付款银行',
  `total_fee` int(11) NOT NULL COMMENT '付款金额',
  `settlement_total_fee` int(11) DEFAULT NULL COMMENT '应结订单金额',
  `fee_type` varchar(8) DEFAULT NULL COMMENT '货币种类',
  `cash_fee` int(11) NOT NULL COMMENT '现金支付金额',
  `cash_fee_type` varchar(16) DEFAULT 'CNY' COMMENT '现金支付货币类型',
  `coupon_fee` int(11) DEFAULT NULL COMMENT '总代金券金额',
  `coupon_count` smallint(5) DEFAULT NULL COMMENT '代金券使用数量',
  `coupon_types` varchar(128) DEFAULT NULL COMMENT '代金券类型（可以是复数）',
  `coupon_ids` varchar(128) DEFAULT NULL COMMENT '代金券ID（可以是复数）',
  `coupon_fee_total` int(11) DEFAULT NULL COMMENT '代金券支付总金额',
  `transaction_id` varchar(32) NOT NULL COMMENT '微信支付订单号	',
  `out_trade_no` varchar(32) NOT NULL COMMENT '商户订单号',
  `attach` varchar(128) DEFAULT NULL COMMENT '商家数据包',
  `time_end` varchar(14) NOT NULL COMMENT '支付完成时间，格式为yyyyMMddHHmmss',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactionId` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `t_mall_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户编号',
  `user_id` varchar(30) NOT NULL COMMENT '用户ID',
  `content` text NOT NULL COMMENT '反馈内容',
  `type` varchar(30) NOT NULL COMMENT '反馈类型',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `t_mall_region` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `name` varchar(120) NOT NULL DEFAULT '',
  `type` tinyint(1) NOT NULL DEFAULT '2',
  `agency_id` smallint(5) unsigned NOT NULL DEFAULT '0',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `region_type` (`type`),
  KEY `agency_id` (`agency_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
