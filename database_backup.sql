-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: teachingmanagesystem
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `class_student`
--

DROP TABLE IF EXISTS `class_student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_student` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `student_id` int NOT NULL,
  `enrolled_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_class` (`student_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `class_student_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_student_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_student`
--

LOCK TABLES `class_student` WRITE;
/*!40000 ALTER TABLE `class_student` DISABLE KEYS */;
INSERT INTO `class_student` VALUES (9,21,2,'2026-04-18 20:19:40'),(10,21,4,'2026-04-18 20:19:42'),(16,22,5,'2026-04-18 21:32:18');
/*!40000 ALTER TABLE `class_student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `class_teacher`
--

DROP TABLE IF EXISTS `class_teacher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_teacher` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_teacher` (`class_id`,`teacher_id`),
  UNIQUE KEY `uk_class` (`class_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `class_teacher_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_teacher_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_teacher`
--

LOCK TABLES `class_teacher` WRITE;
/*!40000 ALTER TABLE `class_teacher` DISABLE KEYS */;
INSERT INTO `class_teacher` VALUES (11,22,1,'2026-04-18 20:19:27'),(12,21,1,'2026-04-18 20:19:29');
/*!40000 ALTER TABLE `class_teacher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_name` varchar(50) NOT NULL,
  `grade` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_grade_name` (`grade`,`class_name`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (21,'高三1班',2024),(22,'高二2班',2025);
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notice_read_status`
--

DROP TABLE IF EXISTS `notice_read_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notice_read_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notice_id` int NOT NULL,
  `student_id` int NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notice_student` (`notice_id`,`student_id`),
  KEY `idx_student_unread` (`student_id`,`is_read`),
  CONSTRAINT `notice_read_status_ibfk_1` FOREIGN KEY (`notice_id`) REFERENCES `notices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notice_read_status_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notice_read_status`
--

LOCK TABLES `notice_read_status` WRITE;
/*!40000 ALTER TABLE `notice_read_status` DISABLE KEYS */;
INSERT INTO `notice_read_status` VALUES (10,15,2,1,'2026-04-18 21:36:29'),(13,14,2,1,'2026-04-18 21:36:30');
/*!40000 ALTER TABLE `notice_read_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `publisher_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `publisher_id` (`publisher_id`),
  KEY `idx_class_time` (`class_id`,`created_at` DESC),
  CONSTRAINT `notices_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notices_ibfk_2` FOREIGN KEY (`publisher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
INSERT INTO `notices` VALUES (14,21,1,'家长会通知','本周五下午召开家长会，请通知家长准时参加。',1,'2026-04-18 20:47:39','2026-04-18 20:47:39'),(15,21,1,'期末考试','同学们做好复习准备',1,'2026-04-18 21:35:35','2026-04-18 21:35:55');
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operation_logs`
--

DROP TABLE IF EXISTS `operation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operation_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `operator_id` int NOT NULL,
  `operator_name` varchar(50) NOT NULL,
  `operation_type` varchar(50) NOT NULL,
  `content` text,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_operator_time` (`operator_id`,`created_at`),
  KEY `idx_target` (`target_type`,`target_id`)
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation_logs`
--

LOCK TABLES `operation_logs` WRITE;
/*!40000 ALTER TABLE `operation_logs` DISABLE KEYS */;
INSERT INTO `operation_logs` VALUES (1,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-17 11:50:00'),(2,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-17 19:48:39'),(3,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-17 19:49:00'),(4,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-17 19:49:15'),(5,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-17 19:52:41'),(6,3,'张主任','CREATE_CLASS','创建班级 高二3班，年级 2025','class',3,'2026-04-17 19:53:33'),(7,3,'张主任','CREATE_CLASS','创建班级 高二5班，年级 2025','class',4,'2026-04-17 19:54:41'),(8,3,'张主任','DELETE_CLASS','删除班级 3','class',3,'2026-04-17 19:55:33'),(9,3,'张主任','DELETE_CLASS','删除班级 4','class',4,'2026-04-17 19:55:38'),(10,3,'张主任','CREATE_CLASS','创建班级 高二5班，年级 2025','class',5,'2026-04-17 19:56:15'),(11,3,'张主任','UPDATE_CLASS','更新班级 5，班级名称 高三9班（实验），年级 2024','class',5,'2026-04-17 20:03:44'),(12,3,'张主任','UPDATE_CLASS','更新班级 5，班级名称 高三9班（实验），年级 2024','class',5,'2026-04-17 20:08:08'),(13,3,'张主任','UPDATE_CLASS','更新班级 5，班级名称 高三9班（实验），年级 2024','class',5,'2026-04-17 20:08:13'),(14,3,'张主任','CREATE_CLASS','创建班级 高二3班，年级 2025','class',6,'2026-04-17 20:09:33'),(15,3,'张主任','DELETE_CLASS','删除班级 6','class',6,'2026-04-17 20:13:06'),(16,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 09:27:11'),(17,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 11:14:13'),(18,1,'李老师','ADD_SCORE','添加成绩 11，学生 2，班级 1','score',11,'2026-04-18 11:22:13'),(19,1,'李老师','DELETE_SCORE','删除成绩 3，学生 2，班级 1','score',3,'2026-04-18 11:22:20'),(20,1,'李老师','DELETE_SCORE','删除成绩 8，学生 2，班级 1','score',8,'2026-04-18 11:22:22'),(21,1,'李老师','DELETE_SCORE','删除成绩 1，学生 2，班级 1','score',1,'2026-04-18 11:22:25'),(22,1,'李老师','DELETE_SCORE','删除成绩 5，学生 2，班级 1','score',5,'2026-04-18 11:22:27'),(23,1,'李老师','DELETE_SCORE','删除成绩 11，学生 2，班级 1','score',11,'2026-04-18 11:22:28'),(24,1,'李老师','DELETE_SCORE','删除成绩 4，学生 2，班级 1','score',4,'2026-04-18 11:22:29'),(25,1,'李老师','DELETE_SCORE','删除成绩 9，学生 2，班级 1','score',9,'2026-04-18 11:22:31'),(26,1,'李老师','UPDATE_SCORE','更新成绩 6，学生 2，班级 1','score',6,'2026-04-18 11:29:03'),(27,1,'李老师','ADD_SCORES_BATCH','批量添加 4 条成绩','score',4,'2026-04-18 12:07:31'),(28,1,'李老师','ADD_SCORES_BATCH','批量添加 4 条成绩','score',4,'2026-04-18 12:07:35'),(29,1,'李老师','ADD_SCORES_BATCH','批量添加 4 条成绩','score',4,'2026-04-18 12:07:42'),(30,1,'李老师','DELETE_SCORE','删除成绩 6，学生 2，班级 1','score',6,'2026-04-18 12:07:47'),(31,1,'李老师','DELETE_SCORE','删除成绩 7，学生 2，班级 1','score',7,'2026-04-18 12:07:48'),(32,1,'李老师','DELETE_SCORE','删除成绩 15，学生 2，班级 1','score',15,'2026-04-18 12:07:52'),(33,1,'李老师','DELETE_SCORE','删除成绩 19，学生 2，班级 1','score',19,'2026-04-18 12:07:54'),(34,1,'李老师','DELETE_SCORE','删除成绩 23，学生 2，班级 1','score',23,'2026-04-18 12:07:55'),(35,1,'李老师','DELETE_SCORE','删除成绩 12，学生 2，班级 1','score',12,'2026-04-18 12:07:57'),(36,1,'李老师','DELETE_SCORE','删除成绩 16，学生 2，班级 1','score',16,'2026-04-18 12:07:58'),(37,1,'李老师','DELETE_SCORE','删除成绩 20，学生 2，班级 1','score',20,'2026-04-18 12:08:00'),(38,1,'李老师','DELETE_SCORE','删除成绩 14，学生 2，班级 1','score',14,'2026-04-18 12:08:01'),(39,1,'李老师','DELETE_SCORE','删除成绩 18，学生 2，班级 1','score',18,'2026-04-18 12:08:02'),(40,1,'李老师','DELETE_SCORE','删除成绩 13，学生 2，班级 1','score',13,'2026-04-18 12:08:04'),(41,1,'李老师','DELETE_SCORE','删除成绩 17，学生 2，班级 1','score',17,'2026-04-18 12:08:05'),(42,1,'李老师','DELETE_SCORE','删除成绩 21，学生 2，班级 1','score',21,'2026-04-18 12:08:07'),(43,1,'李老师','DELETE_SCORE','删除成绩 22，学生 2，班级 1','score',22,'2026-04-18 12:08:10'),(44,1,'李老师','DELETE_SCORE','删除成绩 2，学生 2，班级 1','score',2,'2026-04-18 12:08:12'),(45,1,'李老师','DELETE_SCORE','删除成绩 10，学生 2，班级 1','score',10,'2026-04-18 12:08:13'),(46,1,'李老师','ADD_SCORES_BATCH','批量添加 4 条成绩','score',4,'2026-04-18 12:08:21'),(47,1,'李老师','CREATE_NOTICE','发布通知 7，班级 1，标题 123456','notice',7,'2026-04-18 12:32:00'),(48,1,'李老师','DELETE_NOTICE','删除通知 7','notice',7,'2026-04-18 12:36:36'),(49,1,'李老师','DELETE_NOTICE','删除通知 6','notice',6,'2026-04-18 12:36:39'),(50,1,'李老师','DELETE_NOTICE','删除通知 5','notice',5,'2026-04-18 12:36:41'),(51,1,'李老师','DELETE_NOTICE','删除通知 4','notice',4,'2026-04-18 12:36:43'),(52,1,'李老师','DELETE_NOTICE','删除通知 3','notice',3,'2026-04-18 12:36:44'),(53,1,'李老师','DELETE_NOTICE','删除通知 2','notice',2,'2026-04-18 12:36:46'),(54,1,'李老师','CREATE_NOTICE','发布通知 8，班级 1，标题 asdf','notice',8,'2026-04-18 12:37:01'),(55,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 12:37:26'),(56,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 12:38:33'),(57,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 12:43:46'),(58,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 12:52:36'),(59,3,'张主任','CREATE_CLASS','创建班级 125，年级 2024','class',7,'2026-04-18 13:01:47'),(60,3,'张主任','UPDATE_SCORE','更新成绩 24，学生 2，班级 1','score',24,'2026-04-18 13:09:29'),(61,3,'张主任','UPDATE_CLASS','更新班级 7，班级名称 125，年级 2025','class',7,'2026-04-18 14:39:30'),(62,3,'张主任','DELETE_CLASS','删除班级 7','class',7,'2026-04-18 14:40:57'),(63,3,'张主任','CREATE_CLASS','创建班级 325，年级 2026','class',10,'2026-04-18 14:49:20'),(64,3,'张主任','UPDATE_CLASS','更新班级 10，班级名称 325，年级 2026','class',10,'2026-04-18 14:50:16'),(65,3,'张主任','BIND_TEACHER','绑定班级 10，教师 1','class',10,'2026-04-18 15:02:06'),(66,3,'张主任','ADD_STUDENT','添加学生 4 到班级 10','class',10,'2026-04-18 15:02:13'),(67,3,'张主任','DELETE_CLASS','删除班级 10','class',10,'2026-04-18 15:02:18'),(68,3,'张主任','UPDATE_CLASS','更新班级 1，班级名称 高三1班（腾创），年级 2024','class',1,'2026-04-18 15:12:52'),(69,3,'张主任','BIND_TEACHER','绑定班级 1，教师 1','class',1,'2026-04-18 15:12:57'),(70,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 15:13:27'),(71,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 15:13:58'),(72,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 15:18:59'),(73,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 15:19:20'),(74,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 15:27:52'),(75,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 15:28:33'),(76,3,'张主任','DELETE_CLASS','删除班级 1','class',1,'2026-04-18 15:28:38'),(77,3,'张主任','DELETE_CLASS','删除班级 5','class',5,'2026-04-18 15:28:40'),(78,3,'张主任','CREATE_CLASS','创建班级 电子信息科学1班，年级 2025','class',11,'2026-04-18 15:30:24'),(79,3,'张主任','CREATE_CLASS','创建班级 电子信息科学2班，年级 2026','class',12,'2026-04-18 15:30:42'),(80,3,'张主任','CREATE_CLASS','创建班级 电子信息科学3班，年级 2024','class',13,'2026-04-18 15:31:05'),(81,3,'张主任','CREATE_CLASS','创建班级 电子信息科学3班，年级 2026','class',14,'2026-04-18 15:32:12'),(82,3,'张主任','CREATE_CLASS','创建班级 电子信息科学5班，年级 2023','class',15,'2026-04-18 15:43:28'),(83,3,'张主任','UPDATE_CLASS','更新班级 12，班级名称 电子信息科学2班，年级 2022','class',12,'2026-04-18 15:43:49'),(84,3,'张主任','DELETE_CLASS','删除班级 14','class',14,'2026-04-18 15:43:57'),(85,3,'张主任','DELETE_CLASS','删除班级 11','class',11,'2026-04-18 15:43:58'),(86,3,'张主任','DELETE_CLASS','删除班级 13','class',13,'2026-04-18 15:43:59'),(87,3,'张主任','DELETE_CLASS','删除班级 15','class',15,'2026-04-18 15:44:01'),(88,3,'张主任','DELETE_CLASS','删除班级 12','class',12,'2026-04-18 15:44:02'),(89,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 16:21:10'),(90,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 16:27:49'),(91,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 16:40:14'),(92,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 17:02:53'),(93,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 17:17:42'),(94,3,'张主任','CREATE_CLASS','创建班级 电子信息1班，年级 2025','class',16,'2026-04-18 17:20:00'),(95,3,'张主任','UPDATE_CLASS','更新班级 16，班级名称 电子信息1班，年级 2024','class',16,'2026-04-18 17:20:17'),(96,3,'张主任','BIND_TEACHER','绑定班级 16，教师 1','class',16,'2026-04-18 17:20:22'),(97,3,'张主任','ADD_STUDENT','添加学生 2 到班级 16','class',16,'2026-04-18 17:20:26'),(98,3,'张主任','ADD_STUDENT','添加学生 4 到班级 16','class',16,'2026-04-18 17:20:28'),(99,3,'张主任','DELETE_CLASS','删除班级 16','class',16,'2026-04-18 17:20:37'),(100,3,'张主任','CREATE_CLASS','创建班级 高三1班，年级 2024','class',17,'2026-04-18 17:21:11'),(101,3,'张主任','CREATE_CLASS','创建班级 高二1班，年级 2025','class',18,'2026-04-18 17:21:21'),(102,3,'张主任','CREATE_CLASS','创建班级 高一1班，年级 2026','class',19,'2026-04-18 17:21:35'),(103,3,'张主任','BIND_TEACHER','绑定班级 17，教师 1','class',17,'2026-04-18 17:21:44'),(104,3,'张主任','BIND_TEACHER','绑定班级 18，教师 1','class',18,'2026-04-18 17:21:45'),(105,3,'张主任','BIND_TEACHER','绑定班级 19，教师 1','class',19,'2026-04-18 17:21:46'),(106,3,'张主任','ADD_STUDENT','添加学生 2 到班级 17','class',17,'2026-04-18 17:21:50'),(107,3,'张主任','ADD_STUDENT','添加学生 4 到班级 18','class',18,'2026-04-18 17:21:57'),(108,3,'张主任','ADD_SCORE','添加成绩 28，学生 2，班级 17','score',28,'2026-04-18 17:44:19'),(109,3,'张主任','ADD_SCORES_BATCH','批量添加 3 条成绩','score',3,'2026-04-18 17:49:21'),(110,3,'张主任','ADD_SCORE','添加成绩 34，学生 4，班级 19','score',34,'2026-04-18 17:59:43'),(111,3,'张主任','ADD_SCORE','添加成绩 35，学生 1，班级 19','score',35,'2026-04-18 18:00:22'),(112,3,'张主任','DELETE_SCORE','删除成绩 35，学生 1，班级 19','score',35,'2026-04-18 18:00:36'),(113,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 18:21:15'),(114,1,'李老师','UPDATE_SCORE','更新成绩 28，学生 2，班级 17','score',28,'2026-04-18 18:24:24'),(115,1,'李老师','DELETE_SCORE','删除成绩 29，学生 2，班级 17','score',29,'2026-04-18 18:24:30'),(116,1,'李老师','CREATE_NOTICE','发布通知 9，班级 17，标题 期末通知','notice',9,'2026-04-18 18:24:57'),(117,1,'李老师','DELETE_NOTICE','删除通知 9','notice',9,'2026-04-18 18:36:54'),(118,1,'李老师','CREATE_NOTICE','发布通知 10，班级 17，标题 test1','notice',10,'2026-04-18 18:37:06'),(119,1,'李老师','UPDATE_NOTICE','更新通知 10，标题 test12','notice',10,'2026-04-18 18:45:54'),(120,1,'李老师','UPDATE_NOTICE','更新通知 10，标题 test12','notice',10,'2026-04-18 18:45:59'),(121,1,'李老师','UPDATE_NOTICE','更新通知 10，标题 test1','notice',10,'2026-04-18 18:47:14'),(122,1,'李老师','DELETE_NOTICE','删除通知 10','notice',10,'2026-04-18 18:47:17'),(123,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 18:50:47'),(124,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 18:51:19'),(125,1,'李老师','CREATE_NOTICE','发布通知 11，班级 17，标题 123456','notice',11,'2026-04-18 18:51:31'),(126,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 18:51:42'),(127,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 18:52:20'),(128,1,'李老师','UPDATE_SCORE','更新成绩 28，学生 2，班级 17','score',28,'2026-04-18 18:52:32'),(129,1,'李老师','CREATE_NOTICE','发布通知 12，班级 17，标题 asdfasdfasdf','notice',12,'2026-04-18 18:52:42'),(130,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 18:52:50'),(131,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 18:56:15'),(132,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 18:56:48'),(133,3,'张主任','UNBIND_TEACHER','解绑班级 19','class',19,'2026-04-18 19:04:55'),(134,3,'张主任','BIND_TEACHER','绑定班级 19，教师 1','class',19,'2026-04-18 19:04:58'),(135,3,'张主任','DELETE_CLASS','删除班级 19','class',19,'2026-04-18 19:05:28'),(136,3,'张主任','CREATE_CLASS','创建班级 高一1班，年级 2026','class',20,'2026-04-18 19:06:36'),(137,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 19:07:02'),(138,1,'李老师','UPDATE_SCORE','更新成绩 28，学生 2，班级 17','score',28,'2026-04-18 19:17:37'),(139,1,'李老师','UPDATE_NOTICE','更新通知 12，标题 asdfasdfasdf','notice',12,'2026-04-18 19:35:50'),(140,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 19:36:33'),(141,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 19:58:57'),(142,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 19:59:25'),(143,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 19:59:37'),(144,3,'张主任','UPDATE_SCORE','更新成绩 28，学生 2，班级 17','score',28,'2026-04-18 20:03:58'),(145,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 20:08:22'),(146,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 20:10:39'),(147,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 20:18:36'),(148,3,'张主任','DELETE_CLASS','删除班级 20','class',20,'2026-04-18 20:18:39'),(149,3,'张主任','DELETE_CLASS','删除班级 18','class',18,'2026-04-18 20:18:41'),(150,3,'张主任','DELETE_CLASS','删除班级 17','class',17,'2026-04-18 20:18:42'),(151,3,'张主任','CREATE_CLASS','创建班级 高三1班，年级 2024','class',21,'2026-04-18 20:19:09'),(152,3,'张主任','CREATE_CLASS','创建班级 高二2班，年级 2025','class',22,'2026-04-18 20:19:20'),(153,3,'张主任','BIND_TEACHER','绑定班级 22，教师 1','class',22,'2026-04-18 20:19:27'),(154,3,'张主任','BIND_TEACHER','绑定班级 21，教师 1','class',21,'2026-04-18 20:19:29'),(155,3,'张主任','ADD_STUDENT','添加学生 2 到班级 21','class',21,'2026-04-18 20:19:40'),(156,3,'张主任','ADD_STUDENT','添加学生 4 到班级 21','class',21,'2026-04-18 20:19:42'),(157,3,'张主任','ADD_STUDENT','添加学生 5 到班级 22','class',22,'2026-04-18 20:21:40'),(158,3,'张主任','ADD_SCORE','添加成绩 40，学生 4，班级 21','score',40,'2026-04-18 20:22:45'),(159,3,'张主任','ADD_SCORE','添加成绩 41，学生 4，班级 21','score',41,'2026-04-18 20:22:58'),(160,3,'张主任','ADD_SCORE','添加成绩 42，学生 4，班级 21','score',42,'2026-04-18 20:23:11'),(161,3,'张主任','ADD_SCORE','添加成绩 43，学生 5，班级 21','score',43,'2026-04-18 20:23:29'),(162,3,'张主任','DELETE_SCORE','删除成绩 43，学生 5，班级 21','score',43,'2026-04-18 20:24:50'),(163,3,'张主任','ADD_SCORE','添加成绩 44，学生 5，班级 21','score',44,'2026-04-18 20:25:15'),(164,3,'张主任','DELETE_SCORE','删除成绩 44，学生 5，班级 21','score',44,'2026-04-18 20:25:19'),(165,3,'张主任','ADD_SCORE','添加成绩 45，学生 5，班级 21','score',45,'2026-04-18 20:25:35'),(166,3,'张主任','UPDATE_SCORE','更新成绩 45，学生 5，班级 21','score',45,'2026-04-18 20:25:39'),(167,3,'张主任','DELETE_SCORE','删除成绩 45，学生 5，班级 21','score',45,'2026-04-18 20:25:40'),(168,3,'张主任','ADD_SCORE','添加成绩 46，学生 2，班级 21','score',46,'2026-04-18 20:45:41'),(169,3,'张主任','ADD_SCORE','添加成绩 47，学生 2，班级 21','score',47,'2026-04-18 20:45:50'),(170,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 20:46:15'),(171,1,'李老师','CREATE_NOTICE','发布通知 13，班级 21，标题 月考通知','notice',13,'2026-04-18 20:47:12'),(172,1,'李老师','CREATE_NOTICE','发布通知 14，班级 21，标题 家长会通知','notice',14,'2026-04-18 20:47:39'),(173,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 20:53:49'),(174,3,'张主任','CREATE_CLASS','创建班级 高一3班，年级 2026','class',23,'2026-04-18 20:54:09'),(175,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 20:55:29'),(176,3,'张主任','DELETE_CLASS','删除班级 23','class',23,'2026-04-18 20:55:33'),(177,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 20:56:38'),(178,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:03:54'),(179,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:05:03'),(180,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:08:39'),(181,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:08:51'),(182,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:08:59'),(183,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:10:18'),(184,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:10:29'),(185,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:13:07'),(186,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:14:26'),(187,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:14:37'),(188,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:18:22'),(189,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:18:45'),(190,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2026','class',22,'2026-04-18 21:18:50'),(191,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2024','class',22,'2026-04-18 21:18:56'),(192,3,'张主任','UPDATE_CLASS','更新班级 22，班级名称 高二2班，年级 2025','class',22,'2026-04-18 21:19:07'),(193,3,'张主任','CREATE_CLASS','创建班级 高一3班，年级 2026','class',24,'2026-04-18 21:19:55'),(194,3,'张主任','ADD_STUDENT','添加学生 5 到班级 22','class',22,'2026-04-18 21:21:02'),(195,3,'张主任','BIND_TEACHER','绑定班级 24，教师 1','class',24,'2026-04-18 21:21:16'),(196,3,'张主任','BIND_TEACHER','绑定班级 24，教师 1','class',24,'2026-04-18 21:21:25'),(197,3,'张主任','UNBIND_TEACHER','解绑班级 24','class',24,'2026-04-18 21:21:34'),(198,3,'张主任','DELETE_CLASS','删除班级 24','class',24,'2026-04-18 21:21:45'),(199,3,'张主任','ADD_SCORE','添加成绩 48，学生 5，班级 22','score',48,'2026-04-18 21:22:23'),(200,3,'张主任','ADD_SCORES_BATCH','批量添加 2 条成绩','score',2,'2026-04-18 21:23:04'),(201,3,'张主任','DELETE_SCORE','删除成绩 48，学生 5，班级 22','score',48,'2026-04-18 21:24:09'),(202,3,'张主任','DELETE_SCORE','删除成绩 49，学生 5，班级 22','score',49,'2026-04-18 21:24:10'),(203,3,'张主任','DELETE_SCORE','删除成绩 50，学生 5，班级 22','score',50,'2026-04-18 21:24:11'),(204,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 21:28:02'),(205,3,'张主任','CREATE_CLASS','创建班级 高一3班，年级 2026','class',25,'2026-04-18 21:28:15'),(206,3,'张主任','UPDATE_CLASS','更新班级 25，班级名称 高一3班，年级 2024','class',25,'2026-04-18 21:28:24'),(207,3,'张主任','UPDATE_CLASS','更新班级 25，班级名称 高一3班，年级 2026','class',25,'2026-04-18 21:28:32'),(208,3,'张主任','BIND_TEACHER','绑定班级 25，教师 1','class',25,'2026-04-18 21:28:37'),(209,3,'张主任','UNBIND_TEACHER','解绑班级 25','class',25,'2026-04-18 21:28:41'),(210,3,'张主任','ADD_STUDENT','添加学生 5 到班级 25','class',25,'2026-04-18 21:29:01'),(211,3,'张主任','ADD_STUDENT','添加学生 5 到班级 22','class',22,'2026-04-18 21:29:12'),(212,3,'张主任','DELETE_CLASS','删除班级 25','class',25,'2026-04-18 21:29:24'),(213,3,'张主任','LOGIN','用户 admin 登录系统','user',3,'2026-04-18 21:31:25'),(214,3,'张主任','CREATE_CLASS','创建班级 高一3班，年级 2026','class',26,'2026-04-18 21:31:30'),(215,3,'张主任','UPDATE_CLASS','更新班级 26，班级名称 高一3班，年级 2027','class',26,'2026-04-18 21:31:36'),(216,3,'张主任','UPDATE_CLASS','更新班级 26，班级名称 高一3班，年级 2026','class',26,'2026-04-18 21:31:40'),(217,3,'张主任','BIND_TEACHER','绑定班级 26，教师 1','class',26,'2026-04-18 21:31:44'),(218,3,'张主任','UNBIND_TEACHER','解绑班级 26','class',26,'2026-04-18 21:31:47'),(219,3,'张主任','ADD_STUDENT','添加学生 5 到班级 26','class',26,'2026-04-18 21:32:01'),(220,3,'张主任','ADD_STUDENT','添加学生 5 到班级 22','class',22,'2026-04-18 21:32:18'),(221,3,'张主任','DELETE_CLASS','删除班级 26','class',26,'2026-04-18 21:32:24'),(222,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 21:33:32'),(223,1,'李老师','ADD_SCORE','添加成绩 51，学生 4，班级 21','score',51,'2026-04-18 21:33:48'),(224,1,'李老师','ADD_SCORE','添加成绩 52，学生 5，班级 22','score',52,'2026-04-18 21:34:15'),(225,1,'李老师','ADD_SCORES_BATCH','批量添加 2 条成绩','score',2,'2026-04-18 21:34:53'),(226,1,'李老师','CREATE_NOTICE','发布通知 15，班级 21，标题 测试1','notice',15,'2026-04-18 21:35:35'),(227,1,'李老师','UPDATE_NOTICE','更新通知 15，标题 期末考试','notice',15,'2026-04-18 21:35:55'),(228,1,'李老师','DELETE_NOTICE','删除通知 13','notice',13,'2026-04-18 21:36:02'),(229,2,'王同学','LOGIN','用户 student1 登录系统','user',2,'2026-04-18 21:36:25'),(230,1,'李老师','LOGIN','用户 teacher1 登录系统','user',1,'2026-04-18 21:36:52');
/*!40000 ALTER TABLE `operation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scores`
--

DROP TABLE IF EXISTS `scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `subject` varchar(50) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `exam_date` date NOT NULL,
  `class_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_class_subject` (`class_id`,`subject`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scores_chk_1` CHECK (((`score` >= 0) and (`score` <= 150)))
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
INSERT INTO `scores` VALUES (40,4,'语文',88.00,'2026-04-18',21,'2026-04-18 20:22:45','2026-04-18 20:22:45'),(41,4,'数学',95.00,'2026-04-18',21,'2026-04-18 20:22:58','2026-04-18 20:22:58'),(42,4,'英语',92.00,'2026-04-18',21,'2026-04-18 20:23:11','2026-04-18 20:23:11'),(46,2,'语文',85.00,'2026-04-18',21,'2026-04-18 20:45:41','2026-04-18 20:45:41'),(47,2,'数学',78.00,'2026-04-18',21,'2026-04-18 20:45:50','2026-04-18 20:45:50'),(51,4,'语文',99.00,'2026-04-18',21,'2026-04-18 21:33:48','2026-04-18 21:33:48'),(52,5,'语文',99.00,'2026-04-18',22,'2026-04-18 21:34:15','2026-04-18 21:34:15'),(53,5,'数学',98.00,'2026-04-17',22,'2026-04-18 21:34:53','2026-04-18 21:34:53'),(54,5,'英语',89.00,'2026-04-15',22,'2026-04-18 21:34:53','2026-04-18 21:34:53');
/*!40000 ALTER TABLE `scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `real_name` varchar(50) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'teacher1','236d34ba8edc72e0f9764008f62290c9:48833281681f4e6641c228dc9ab66beaf0acfc669740907a4a6a7e7e94c02a9aa7009555c871ca87be480ad3a48dd04c6031979f7baa3a6eead3acff1f6c834d','李老师','teacher','2026-04-15 09:40:16'),(2,'student1','d6e9d001c4515c12d8c64b8b3ae1041d:eb82636a9595a820de758719de5d0c02a13b6f83dc68fd427db9a9e54a623c07d47de288c3c93a1420cb4b23768f0adac855a60f7229bca64998c3e76e24c628','王同学','student','2026-04-15 11:48:26'),(3,'admin','6c07f4283589254fe21ada0bbd465681:ef80a8a4882863f8b063a8cc52a3ad48d0d2daf0cd7e9b38e2f5b9d41b9201cbb480531ae25ab798261e86831158e0ea17d5d4cb9cfa11f02ee2c409015568cb','张主任','admin','2026-04-15 21:07:48'),(4,'student2','96dd84a58a597672f410529357d351f4:09289afa3ff303ad8933e2d2a875b09f2e43281687c6f3a5b2705e240dcc7d60e34126a186c918ac1c0deb26560c42913d6f16e752c49fc0dfcbd54c2fb48274','陈同学','student','2026-04-15 23:49:56'),(5,'student3','e96d2a71a2957f2c67020ccda1dc261e:3181d42f01cd585cff797aa068bca2ad237aa1cd3df213bee4437dc3cddde10485de76cb29b977972b6545cac3ce32b78c9a7dae78faa13f639c96e996d50369','赵同学','student','2026-04-18 20:17:50');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-18 21:59:49
