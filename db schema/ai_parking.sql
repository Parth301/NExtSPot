CREATE DATABASE  IF NOT EXISTS `ai_parking` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ai_parking`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: ai_parking
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `availability`
--

DROP TABLE IF EXISTS `availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `availability` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parking_id` int NOT NULL,
  `total_slots` int NOT NULL DEFAULT '0',
  `active_slots` int NOT NULL DEFAULT '0',
  `occupied_slots` int NOT NULL DEFAULT '0',
  `available_slots` int NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_parking` (`parking_id`),
  CONSTRAINT `availability_ibfk_1` FOREIGN KEY (`parking_id`) REFERENCES `parking_spots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `availability`
--

LOCK TABLES `availability` WRITE;
/*!40000 ALTER TABLE `availability` DISABLE KEYS */;
INSERT INTO `availability` VALUES (37,4,0,0,1,-1,'2025-12-04 12:55:35'),(50,5,0,0,0,0,'2025-09-21 11:48:18'),(56,7,0,0,0,0,'2025-12-04 13:24:02'),(62,15,0,0,0,0,'2025-10-15 19:11:17'),(63,10,0,0,0,0,'2025-11-10 18:05:50'),(65,14,0,0,0,0,'2025-11-10 18:22:49'),(66,9,0,0,0,0,'2025-12-04 10:44:48'),(67,12,0,0,0,0,'2025-11-10 18:22:44'),(68,11,0,0,0,0,'2025-11-10 18:05:53'),(69,8,0,0,0,0,'2025-10-15 13:26:57'),(103,6,0,0,0,0,'2025-12-04 07:57:45'),(109,18,7,7,3,4,'2025-12-04 13:50:23'),(142,22,1,0,0,0,'2025-12-04 13:01:15');
/*!40000 ALTER TABLE `availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `parking_id` int DEFAULT NULL,
  `slot_id` int DEFAULT NULL,
  `reserved_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `duration_hours` int NOT NULL,
  `total_price` decimal(8,2) NOT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_booking_parking` (`parking_id`),
  KEY `idx_slot_status` (`slot_id`,`status`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_booking_parking` FOREIGN KEY (`parking_id`) REFERENCES `parking_spots` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_slot` FOREIGN KEY (`slot_id`) REFERENCES `parking_slots` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,1,NULL,NULL,'2025-09-20 18:50:44','2025-09-20 19:50:44','2025-09-20 18:50:50',1,21.00,'cancelled'),(2,1,NULL,NULL,'2025-09-20 18:51:02','2025-09-20 21:51:02','2025-09-20 18:51:53',3,63.00,'cancelled'),(3,1,NULL,NULL,'2025-09-20 19:11:48','2025-09-20 20:11:48','2025-09-20 19:12:10',1,15.00,'cancelled'),(4,1,NULL,NULL,'2025-09-20 19:12:58','2025-09-20 20:12:58','2025-09-20 19:13:55',1,15.00,'cancelled'),(5,1,4,NULL,'2025-09-20 19:14:44','2025-09-20 20:14:44','2025-09-20 19:18:36',1,16.00,'cancelled'),(6,1,4,NULL,'2025-09-20 19:19:04','2025-09-20 22:19:04','2025-09-20 19:19:33',3,48.00,'cancelled'),(7,1,4,NULL,'2025-09-21 04:13:51','2025-09-21 05:13:51','2025-09-21 04:14:19',1,16.00,'cancelled'),(8,1,4,NULL,'2025-09-21 04:18:03','2025-09-21 05:18:03','2025-09-21 04:18:19',1,16.00,'cancelled'),(9,1,4,NULL,'2025-09-21 06:19:38','2025-09-21 07:19:38','2025-09-21 06:20:30',1,16.00,'cancelled'),(10,1,4,NULL,'2025-09-21 06:42:28','2025-09-21 07:42:28','2025-09-21 06:42:33',1,16.00,'cancelled'),(11,1,4,NULL,'2025-09-21 06:42:50','2025-09-21 09:42:50','2025-09-21 06:44:08',3,48.00,'cancelled'),(12,1,7,NULL,'2025-09-21 06:43:51','2025-09-21 10:43:51','2025-09-21 06:44:10',4,480.00,'cancelled'),(13,1,4,NULL,'2025-09-21 06:44:21','2025-09-25 10:44:21','2025-09-21 06:44:59',100,1600.00,'cancelled'),(14,1,4,NULL,'2025-09-21 07:35:15','2025-09-21 09:35:15','2025-09-21 07:41:08',2,32.00,'cancelled'),(15,1,4,NULL,'2025-09-21 08:15:52','2025-09-21 11:15:52','2025-09-21 08:16:09',3,48.00,'cancelled'),(16,1,4,NULL,'2025-09-21 08:24:48','2025-09-21 10:24:48','2025-09-21 08:32:52',2,32.00,'cancelled'),(17,1,4,NULL,'2025-09-21 08:33:07','2025-09-21 13:33:07','2025-09-21 08:34:08',5,80.00,'cancelled'),(18,1,15,NULL,'2025-09-21 08:33:45','2025-09-21 10:33:45','2025-09-21 08:34:07',2,280.00,'cancelled'),(19,1,4,NULL,'2025-09-21 08:39:40','2025-09-21 10:39:40','2025-09-21 08:42:49',2,32.00,'cancelled'),(20,1,4,NULL,'2025-09-21 08:42:58','2025-09-21 13:42:58','2025-09-21 09:45:08',5,80.00,'cancelled'),(21,1,4,NULL,'2025-09-21 09:58:59','2025-09-21 14:58:59','2025-09-21 10:08:52',5,80.00,'cancelled'),(22,1,15,NULL,'2025-09-21 10:01:14','2025-09-21 12:01:14','2025-09-21 10:08:50',2,280.00,'cancelled'),(23,1,15,NULL,'2025-09-21 10:17:05','2025-09-21 12:17:05','2025-09-21 10:18:49',2,280.00,'cancelled'),(24,1,15,NULL,'2025-09-21 10:19:23','2025-09-21 12:19:23','2025-09-21 10:31:08',2,280.00,'cancelled'),(25,1,4,NULL,'2025-09-21 10:31:23','2025-09-21 12:31:23','2025-09-21 10:33:15',2,32.00,'cancelled'),(27,1,15,NULL,'2025-09-21 11:05:50','2025-09-21 13:05:50','2025-09-21 11:09:28',2,280.00,'cancelled'),(28,1,15,NULL,'2025-09-21 11:24:26','2025-09-21 13:24:26','2025-09-21 11:24:49',2,280.00,'cancelled'),(29,1,12,NULL,'2025-09-21 11:26:21','2025-09-21 13:26:21','2025-09-21 11:26:35',2,250.00,'cancelled'),(30,1,4,NULL,'2025-09-22 12:44:13','2025-09-22 17:44:13','2025-09-22 12:44:26',5,80.00,'cancelled'),(31,1,8,NULL,'2025-09-22 17:52:31','2025-09-22 22:52:31','2025-09-22 17:52:52',5,450.00,'cancelled'),(32,1,4,NULL,'2025-09-22 17:52:57','2025-09-22 19:52:57','2025-09-22 17:53:16',2,32.00,'cancelled'),(33,1,4,NULL,'2025-09-22 17:58:09','2025-09-22 19:58:09','2025-09-22 17:58:32',2,32.00,'cancelled'),(34,1,4,NULL,'2025-09-22 17:59:11','2025-09-22 19:59:11','2025-09-22 17:59:22',2,32.00,'cancelled'),(35,1,12,NULL,'2025-09-26 18:27:35','2025-09-26 20:27:35','2025-09-26 18:27:46',2,250.00,'cancelled'),(36,1,12,NULL,'2025-10-03 08:20:27','2025-10-03 16:20:27','2025-10-03 08:20:54',8,1000.00,'cancelled'),(37,1,NULL,NULL,'2025-10-15 13:25:23','2025-10-15 21:25:23','2025-10-15 13:25:40',8,40.00,'cancelled'),(38,1,9,NULL,'2025-10-15 13:26:49','2025-10-15 14:26:49',NULL,1,110.00,'expired'),(39,1,18,NULL,'2025-10-15 15:03:04','2025-10-15 16:03:04',NULL,1,15.00,'expired'),(40,1,15,NULL,'2025-10-15 19:09:49','2025-10-15 21:09:49','2025-10-15 19:11:17',2,280.00,'cancelled'),(41,1,10,NULL,'2025-11-10 16:38:59','2025-11-10 17:38:59','2025-11-10 16:39:12',1,95.00,'cancelled'),(42,1,10,NULL,'2025-11-10 18:05:50','2025-11-10 19:05:50',NULL,1,95.00,'expired'),(43,1,11,NULL,'2025-11-10 18:05:53','2025-11-10 20:05:53',NULL,2,260.00,'expired'),(44,1,12,NULL,'2025-11-10 18:22:44','2025-11-10 19:22:44',NULL,1,125.00,'expired'),(45,1,14,NULL,'2025-11-10 18:22:49','2025-11-10 19:22:49',NULL,1,115.00,'expired'),(46,1,18,NULL,'2025-12-04 07:51:30','2025-12-04 08:51:30',NULL,1,15.00,'expired'),(47,3,6,NULL,'2025-12-04 07:57:45','2025-12-04 08:57:45',NULL,1,100.00,'expired'),(48,1,18,13,'2025-12-04 10:43:07','2025-12-04 11:43:07','2025-12-04 10:43:22',1,15.00,'cancelled'),(49,1,9,6,'2025-12-04 10:43:51','2025-12-04 12:43:51','2025-12-04 10:44:48',2,220.00,'cancelled'),(50,1,18,13,'2025-12-04 12:20:10','2025-12-04 13:20:10','2025-12-04 12:20:57',1,15.00,'cancelled'),(51,1,18,13,'2025-12-04 12:22:08','2025-12-04 14:22:08',NULL,2,30.00,'active'),(52,3,18,36,'2025-12-04 12:22:32','2025-12-04 13:22:32',NULL,1,15.00,'expired'),(53,3,4,1,'2025-12-04 12:53:55','2025-12-04 13:53:55',NULL,1,16.00,'expired'),(54,3,18,37,'2025-12-04 12:54:27','2025-12-04 14:54:27',NULL,2,30.00,'active');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parking_slots`
--

DROP TABLE IF EXISTS `parking_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parking_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parking_spot_id` int NOT NULL,
  `slot_number` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Owner can enable/disable individual slots',
  `is_available` tinyint(1) DEFAULT '1' COMMENT 'System-controlled availability based on bookings',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slot_per_spot` (`parking_spot_id`,`slot_number`),
  KEY `idx_spot_active_available` (`parking_spot_id`,`is_active`,`is_available`),
  CONSTRAINT `fk_slot_parking_spot` FOREIGN KEY (`parking_spot_id`) REFERENCES `parking_spots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parking_slots`
--

LOCK TABLES `parking_slots` WRITE;
/*!40000 ALTER TABLE `parking_slots` DISABLE KEYS */;
INSERT INTO `parking_slots` VALUES (1,4,1,1,0,'2025-12-04 08:24:11'),(2,5,1,1,1,'2025-12-04 08:24:11'),(3,6,1,1,1,'2025-12-04 08:24:11'),(4,7,1,1,1,'2025-12-04 08:24:11'),(5,8,1,1,1,'2025-12-04 08:24:11'),(6,9,1,1,1,'2025-12-04 08:24:11'),(7,10,1,1,1,'2025-12-04 08:24:11'),(8,11,1,1,1,'2025-12-04 08:24:11'),(9,12,1,1,1,'2025-12-04 08:24:11'),(11,14,1,1,1,'2025-12-04 08:24:11'),(12,15,1,1,1,'2025-12-04 08:24:11'),(13,18,1,1,0,'2025-12-04 08:24:11'),(36,18,5,1,0,'2025-12-04 12:01:01'),(37,18,6,1,0,'2025-12-04 12:01:01'),(114,22,62,0,1,'2025-12-04 13:00:31'),(115,18,7,1,1,'2025-12-04 13:22:35'),(117,18,9,1,1,'2025-12-04 13:22:35'),(118,18,10,1,1,'2025-12-04 13:22:49'),(119,18,11,1,1,'2025-12-04 13:22:49'),(120,18,12,1,1,'2025-12-04 13:22:49');
/*!40000 ALTER TABLE `parking_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parking_spots`
--

DROP TABLE IF EXISTS `parking_spots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parking_spots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `price` decimal(8,2) NOT NULL,
  `type` varchar(50) NOT NULL,
  `total_slots` int NOT NULL DEFAULT '1' COMMENT 'Total number of slots created',
  `active_slots` int NOT NULL DEFAULT '1' COMMENT 'Number of slots enabled by owner',
  `available_slots` int NOT NULL DEFAULT '1' COMMENT 'Number of slots available for booking',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `parking_spots_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parking_spots`
--

LOCK TABLES `parking_spots` WRITE;
/*!40000 ALTER TABLE `parking_spots` DISABLE KEYS */;
INSERT INTO `parking_spots` VALUES (4,2,'vasai',19.37123702,72.80830774,16.00,'open',1,1,0,'2025-09-20 19:14:24'),(5,2,'CST Station Lot A',18.94020000,72.83560000,120.00,'Covered',1,1,1,'2025-09-21 04:22:46'),(6,2,'M/S Nirmal Lifestyle',19.17690000,72.95943000,100.00,'Covered',1,1,1,'2025-09-21 04:36:29'),(7,2,'M/S Vinita Estate',19.23966000,72.84795000,120.00,'Open',1,1,1,'2025-09-21 04:36:29'),(8,2,'Marathon (Chhaganlal Khimji)',19.17069000,72.94360000,90.00,'Underground',1,1,1,'2025-09-21 04:36:29'),(9,2,'M/S Dura Tech',19.16951000,72.95250000,110.00,'Covered',1,1,1,'2025-09-21 04:36:29'),(10,2,'M/S Nirmal Lifestyle',19.16624000,72.93694000,95.00,'Open',1,1,1,'2025-09-21 04:36:29'),(11,2,'M/S Runwal Homes Pvt. Ltd.',19.15965000,72.94439000,130.00,'Covered',1,1,1,'2025-09-21 04:36:29'),(12,2,'M/S Runwal Developers Pvt. Ltd.',19.18136000,72.94690000,125.00,'Underground',1,1,1,'2025-09-21 04:36:29'),(14,2,'M/S Neptune Ventures',19.14262000,72.92988000,115.00,'Covered',1,1,1,'2025-09-21 04:36:29'),(15,2,'M/S Lodha',19.12920000,72.93079000,140.00,'Underground',1,1,1,'2025-09-21 04:36:29'),(18,2,'nalasopara park open',19.42060400,72.81708100,15.00,'Open',8,8,5,'2025-09-22 12:45:00'),(22,2,'Saphale Stop',19.57675200,72.81683800,25.00,'Open',1,0,0,'2025-12-04 12:57:26');
/*!40000 ALTER TABLE `parking_spots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_responses`
--

DROP TABLE IF EXISTS `review_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `owner_id` int NOT NULL,
  `response_text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_response` (`review_id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `review_responses_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_responses_ibfk_2` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_responses`
--

LOCK TABLES `review_responses` WRITE;
/*!40000 ALTER TABLE `review_responses` DISABLE KEYS */;
INSERT INTO `review_responses` VALUES (1,1,2,'Thank you for Your Visiting','2025-12-04 07:45:06','2025-12-04 07:45:06');
/*!40000 ALTER TABLE `review_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review_votes`
--

DROP TABLE IF EXISTS `review_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_votes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_id` int NOT NULL,
  `user_id` int NOT NULL,
  `is_helpful` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_vote` (`review_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `review_votes_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_votes`
--

LOCK TABLES `review_votes` WRITE;
/*!40000 ALTER TABLE `review_votes` DISABLE KEYS */;
INSERT INTO `review_votes` VALUES (1,1,1,1,'2025-12-04 07:40:48'),(2,2,1,0,'2025-12-04 07:42:28'),(15,2,3,1,'2025-12-04 07:47:18');
/*!40000 ALTER TABLE `review_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `parking_id` int NOT NULL,
  `booking_id` int DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `cleanliness_rating` int DEFAULT NULL,
  `safety_rating` int DEFAULT NULL,
  `accessibility_rating` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_verified_booking` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `parking_id` (`parking_id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_reviews_rating` (`rating`),
  KEY `idx_reviews_created` (`created_at` DESC),
  KEY `idx_reviews_verified` (`is_verified_booking`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`parking_id`) REFERENCES `parking_spots` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5))),
  CONSTRAINT `reviews_chk_2` CHECK (((`cleanliness_rating` >= 1) and (`cleanliness_rating` <= 5))),
  CONSTRAINT `reviews_chk_3` CHECK (((`safety_rating` >= 1) and (`safety_rating` <= 5))),
  CONSTRAINT `reviews_chk_4` CHECK (((`accessibility_rating` >= 1) and (`accessibility_rating` <= 5)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,18,39,5,'Very Great Experience',5,4,4,'2025-12-04 07:40:15','2025-12-04 07:40:15',1),(2,1,9,38,4,'good',4,5,4,'2025-12-04 07:41:22','2025-12-04 07:41:22',1);
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','owner') DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'red','parthpatilve@gmail.com','$2b$10$oaqw4ej8mNE4tlw7azlHx.7AcRB1DSHTGIJiqUHWsPz1aX7tpkRwS','user'),(2,'blue','admin@example.com','$2b$10$lK8bJBc5tQe3NDZr0r5gHejMXHuh7yjY5kREa5gDBdPRbs22kE8ay','owner'),(3,'jay','jaypatil1965@gmail.com','$2b$10$Zx5MLLgcbyybTTessOJUJ.29WFTbAD.K5rlFHqPCsjp.ZdoXjMHZu','user');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ai_parking'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `expire_bookings` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `expire_bookings` ON SCHEDULE EVERY 1 MINUTE STARTS '2025-10-15 22:58:26' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
  -- Expire old bookings
  UPDATE bookings 
  SET status = 'expired' 
  WHERE status = 'active' 
    AND expires_at < NOW();
  
  -- Update parking spot status based on active bookings
  UPDATE parking_spots ps
  LEFT JOIN bookings b ON ps.id = b.parking_id 
    AND b.status = 'active'
  SET ps.status = CASE 
    WHEN b.id IS NULL THEN 'available'
    ELSE 'occupied'
  END
  WHERE ps.is_available = 1;
END */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'ai_parking'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-04 19:39:49
