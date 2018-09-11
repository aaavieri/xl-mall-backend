-- MySQL dump 10.13  Distrib 8.0.11, for Win64 (x86_64)
--
-- Host: localhost    Database: xiaoli
-- ------------------------------------------------------
-- Server version	8.0.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `t_mall_goods`
--

DROP TABLE IF EXISTS `t_mall_goods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `t_mall_goods`
--

LOCK TABLES `t_mall_goods` WRITE;
/*!40000 ALTER TABLE `t_mall_goods` DISABLE KEYS */;
INSERT INTO `t_mall_goods` VALUES (1,NULL,'儿童安全用药基因检测','ET',0.02,NULL,'据调查发现，新生儿药物不良反应发生率高达24.4%，为成人的四倍，儿童药物不良反应发生率为12.9%，为成人的两倍。儿童安全用药基因检测是以药物基因组学为依据，通过检测儿童与药物代谢、疗效和毒妇作用相关的基因，为其提供安全用药方案。',NULL,NULL,0,0,'2018-08-16 16:49:47','system','2018-08-16 16:49:47','system',1),(2,NULL,'儿童基因身份证','ET',0.04,NULL,'儿童基因身份证：选取国际通用的19个固定的基因位点；个体识别率超过千亿分之一。优点是耗时短、精确、避免基因突变带来的不利影响。',NULL,NULL,0,0,'2018-08-16 16:49:47','system','2018-08-16 16:49:47','system',1),(3,NULL,'儿童天赋基因检测','ET',0.05,NULL,'爱迪生说过“天才是1%的灵感加上99%的汗水，当然，没有那百分之一的灵感，世界上所有的汗水加在一起也只不过是汗水而已！”研究成果表明，99%以上的儿童都有自己的闪光点，只是对于大部分的孩子，他们的闪光点没有在最合适的时候被挖掘出来。通过基因检测发掘孩子的天赋优势，并通过科学指导提高孩子人生的质量。',NULL,NULL,0,0,'2018-08-16 16:49:47','system','2018-08-16 16:49:47','system',1),(4,NULL,'儿童微量元素利用能力','ET',0.01,NULL,'检测项目：乳糖代谢能力、维生素D代谢能力、钙吸收能力、铁吸收能力、锌吸收能力',NULL,NULL,0,0,'2018-08-16 16:49:47','system','2018-08-16 16:49:47','system',1),(5,NULL,'新生儿遗传病基因筛查','XS',0.06,NULL,'新生儿遗传病的早期发现早期干预，可防止死亡和残疾的发生，甚至能使患儿获得和正常人一样的生长发育。',NULL,NULL,0,0,'2018-08-16 16:49:47','system','2018-08-16 16:49:47','system',1),(6,NULL,'儿童运动基因检测','ET',0.09,NULL,'运动潜质、运动效果、运动风险',NULL,NULL,0,0,'2018-08-16 16:49:47','system','2018-08-16 16:49:47','system',1);
/*!40000 ALTER TABLE `t_mall_goods` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-09-11 18:39:16
