DROP TABLE `t_mall_feedback`;
CREATE TABLE `t_mall_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户编号',
  `user_id` varchar(30) NOT NULL COMMENT '用户ID',
  `content` text NOT NULL COMMENT '反馈内容',
  `type` varchar(30) NOT NULL COMMENT '反馈类型',
  `mobile` varchar(20) NOT NULL COMMENT '联系方式',
  `del_flag` tinyint(1) NOT NULL DEFAULT '0' COMMENT '删除标志',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '创建者',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(10) NOT NULL DEFAULT 'system' COMMENT '更新者',
  `row_version` int(11) NOT NULL DEFAULT '1' COMMENT '版本',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

ALTER TABLE `t_mall_pay_notify`
ADD COLUMN `return_code` VARCHAR(16) NOT NULL COMMENT '返回码' AFTER `result_code`;
