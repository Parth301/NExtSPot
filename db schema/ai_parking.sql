CREATE DATABASE IF NOT EXISTS `smart_parking` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `smart_parking`;

-- =============================================
-- Core Tables
-- =============================================

-- Table: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','owner') DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample users
INSERT INTO `users` VALUES 
(1,'red','parthpatilve@gmail.com','$2b$10$oaqw4ej8mNE4tlw7azlHx.7AcRB1DSHTGIJiqUHWsPz1aX7tpkRwS','user'),
(2,'blue','admin@example.com','$2b$10$lK8bJBc5tQe3NDZr0r5gHejMXHuh7yjY5kREa5gDBdPRbs22kE8ay','owner'),
(3,'jay','jaypatil1965@gmail.com','$2b$10$Zx5MLLgcbyybTTessOJUJ.29WFTbAD.K5rlFHqPCsjp.ZdoXjMHZu','user');

-- Table: parking_spots
DROP TABLE IF EXISTS `parking_spots`;
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
  `occupied_slots` int NOT NULL DEFAULT '0' COMMENT 'Number of occupied slots',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `parking_spots_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample parking spots
INSERT INTO `parking_spots` VALUES 
(4,2,'vasai',19.37123702,72.80830774,16.00,'open',1,1,0,0,'2025-09-20 19:14:24'),
(5,2,'CST Station Lot A',18.94020000,72.83560000,120.00,'Covered',1,1,1,0,'2025-09-21 04:22:46'),
(6,2,'M/S Nirmal Lifestyle',19.17690000,72.95943000,100.00,'Covered',1,1,1,0,'2025-09-21 04:36:29'),
(7,2,'M/S Vinita Estate',19.23966000,72.84795000,120.00,'Open',1,1,1,0,'2025-09-21 04:36:29'),
(8,2,'Marathon (Chhaganlal Khimji)',19.17069000,72.94360000,90.00,'Underground',1,1,1,0,'2025-09-21 04:36:29'),
(9,2,'M/S Dura Tech',19.16951000,72.95250000,110.00,'Covered',1,1,1,0,'2025-09-21 04:36:29'),
(10,2,'M/S Nirmal Lifestyle',19.16624000,72.93694000,95.00,'Open',1,1,1,0,'2025-09-21 04:36:29'),
(11,2,'M/S Runwal Homes Pvt. Ltd.',19.15965000,72.94439000,130.00,'Covered',1,1,1,0,'2025-09-21 04:36:29'),
(12,2,'M/S Runwal Developers Pvt. Ltd.',19.18136000,72.94690000,125.00,'Underground',1,1,1,0,'2025-09-21 04:36:29'),
(14,2,'M/S Neptune Ventures',19.14262000,72.92988000,115.00,'Covered',1,1,1,0,'2025-09-21 04:36:29'),
(15,2,'M/S Lodha',19.12920000,72.93079000,140.00,'Underground',1,1,1,0,'2025-09-21 04:36:29'),
(18,2,'nalasopara park open',19.42060400,72.81708100,15.00,'Open',8,8,5,3,'2025-09-22 12:45:00'),
(22,2,'Saphale Stop',19.57675200,72.81683800,25.00,'Open',1,0,0,0,'2025-12-04 12:57:26');

-- Table: parking_slots
DROP TABLE IF EXISTS `parking_slots`;
CREATE TABLE `parking_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parking_spot_id` int NOT NULL,
  `slot_number` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Owner can enable/disable individual slots',
  `is_available` tinyint(1) DEFAULT '1' COMMENT 'System-controlled availability based on bookings',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_spot_slot_active` (`parking_spot_id`,`slot_number`,`is_active`),
  KEY `idx_spot_active_available` (`parking_spot_id`,`is_active`,`is_available`),
  CONSTRAINT `fk_slot_parking_spot` FOREIGN KEY (`parking_spot_id`) REFERENCES `parking_spots` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert sample parking slots
INSERT INTO `parking_slots` VALUES 
(1,4,1,1,0,'2025-12-04 08:24:11'),
(2,5,1,1,1,'2025-12-04 08:24:11'),
(3,6,1,1,1,'2025-12-04 08:24:11'),
(4,7,1,1,1,'2025-12-04 08:24:11'),
(5,8,1,1,1,'2025-12-04 08:24:11'),
(6,9,1,1,1,'2025-12-04 08:24:11'),
(7,10,1,1,1,'2025-12-04 08:24:11'),
(8,11,1,1,1,'2025-12-04 08:24:11'),
(9,12,1,1,1,'2025-12-04 08:24:11'),
(11,14,1,1,1,'2025-12-04 08:24:11'),
(12,15,1,1,1,'2025-12-04 08:24:11'),
(13,18,1,1,0,'2025-12-04 08:24:11'),
(36,18,5,1,0,'2025-12-04 12:01:01'),
(37,18,6,1,0,'2025-12-04 12:01:01'),
(114,22,62,0,1,'2025-12-04 13:00:31'),
(115,18,7,1,1,'2025-12-04 13:22:35'),
(117,18,9,1,1,'2025-12-04 13:22:35'),
(118,18,10,1,1,'2025-12-04 13:22:49'),
(119,18,11,1,1,'2025-12-04 13:22:49'),
(120,18,12,1,1,'2025-12-04 13:22:49');

-- Table: availability
DROP TABLE IF EXISTS `availability`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert availability data
INSERT INTO `availability` VALUES 
(37,4,0,0,1,-1,'2025-12-04 12:55:35'),
(50,5,0,0,0,0,'2025-09-21 11:48:18'),
(56,7,0,0,0,0,'2025-12-04 13:24:02'),
(62,15,0,0,0,0,'2025-10-15 19:11:17'),
(63,10,0,0,0,0,'2025-11-10 18:05:50'),
(65,14,0,0,0,0,'2025-11-10 18:22:49'),
(66,9,0,0,0,0,'2025-12-04 10:44:48'),
(67,12,0,0,0,0,'2025-11-10 18:22:44'),
(68,11,0,0,0,0,'2025-11-10 18:05:53'),
(69,8,0,0,0,0,'2025-10-15 13:26:57'),
(103,6,0,0,0,0,'2025-12-04 07:57:45'),
(109,18,7,7,3,4,'2025-12-04 13:50:23'),
(142,22,1,0,0,0,'2025-12-04 13:01:15');

-- Table: bookings
DROP TABLE IF EXISTS `bookings`;
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
  `cancelled_by` bigint DEFAULT NULL COMMENT 'User/admin who cancelled the booking',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_slot_status` (`slot_id`,`status`),
  KEY `idx_bookings_spot_status` (`parking_id`,`status`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_booking_parking` FOREIGN KEY (`parking_id`) REFERENCES `parking_spots` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_slot` FOREIGN KEY (`slot_id`) REFERENCES `parking_slots` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert booking data
INSERT INTO `bookings` VALUES 
(1,1,NULL,NULL,'2025-09-20 18:50:44','2025-09-20 19:50:44','2025-09-20 18:50:50',1,21.00,'cancelled',NULL),
(2,1,NULL,NULL,'2025-09-20 18:51:02','2025-09-20 21:51:02','2025-09-20 18:51:53',3,63.00,'cancelled',NULL),
(3,1,NULL,NULL,'2025-09-20 19:11:48','2025-09-20 20:11:48','2025-09-20 19:12:10',1,15.00,'cancelled',NULL),
(4,1,NULL,NULL,'2025-09-20 19:12:58','2025-09-20 20:12:58','2025-09-20 19:13:55',1,15.00,'cancelled',NULL),
(5,1,4,NULL,'2025-09-20 19:14:44','2025-09-20 20:14:44','2025-09-20 19:18:36',1,16.00,'cancelled',NULL),
(6,1,4,NULL,'2025-09-20 19:19:04','2025-09-20 22:19:04','2025-09-20 19:19:33',3,48.00,'cancelled',NULL),
(7,1,4,NULL,'2025-09-21 04:13:51','2025-09-21 05:13:51','2025-09-21 04:14:19',1,16.00,'cancelled',NULL),
(8,1,4,NULL,'2025-09-21 04:18:03','2025-09-21 05:18:03','2025-09-21 04:18:19',1,16.00,'cancelled',NULL),
(9,1,4,NULL,'2025-09-21 06:19:38','2025-09-21 07:19:38','2025-09-21 06:20:30',1,16.00,'cancelled',NULL),
(10,1,4,NULL,'2025-09-21 06:42:28','2025-09-21 07:42:28','2025-09-21 06:42:33',1,16.00,'cancelled',NULL),
(11,1,4,NULL,'2025-09-21 06:42:50','2025-09-21 09:42:50','2025-09-21 06:44:08',3,48.00,'cancelled',NULL),
(12,1,7,NULL,'2025-09-21 06:43:51','2025-09-21 10:43:51','2025-09-21 06:44:10',4,480.00,'cancelled',NULL),
(13,1,4,NULL,'2025-09-21 06:44:21','2025-09-25 10:44:21','2025-09-21 06:44:59',100,1600.00,'cancelled',NULL),
(14,1,4,NULL,'2025-09-21 07:35:15','2025-09-21 09:35:15','2025-09-21 07:41:08',2,32.00,'cancelled',NULL),
(15,1,4,NULL,'2025-09-21 08:15:52','2025-09-21 11:15:52','2025-09-21 08:16:09',3,48.00,'cancelled',NULL),
(16,1,4,NULL,'2025-09-21 08:24:48','2025-09-21 10:24:48','2025-09-21 08:32:52',2,32.00,'cancelled',NULL),
(17,1,4,NULL,'2025-09-21 08:33:07','2025-09-21 13:33:07','2025-09-21 08:34:08',5,80.00,'cancelled',NULL),
(18,1,15,NULL,'2025-09-21 08:33:45','2025-09-21 10:33:45','2025-09-21 08:34:07',2,280.00,'cancelled',NULL),
(19,1,4,NULL,'2025-09-21 08:39:40','2025-09-21 10:39:40','2025-09-21 08:42:49',2,32.00,'cancelled',NULL),
(20,1,4,NULL,'2025-09-21 08:42:58','2025-09-21 13:42:58','2025-09-21 09:45:08',5,80.00,'cancelled',NULL),
(21,1,4,NULL,'2025-09-21 09:58:59','2025-09-21 14:58:59','2025-09-21 10:08:52',5,80.00,'cancelled',NULL),
(22,1,15,NULL,'2025-09-21 10:01:14','2025-09-21 12:01:14','2025-09-21 10:08:50',2,280.00,'cancelled',NULL),
(23,1,15,NULL,'2025-09-21 10:17:05','2025-09-21 12:17:05','2025-09-21 10:18:49',2,280.00,'cancelled',NULL),
(24,1,15,NULL,'2025-09-21 10:19:23','2025-09-21 12:19:23','2025-09-21 10:31:08',2,280.00,'cancelled',NULL),
(25,1,4,NULL,'2025-09-21 10:31:23','2025-09-21 12:31:23','2025-09-21 10:33:15',2,32.00,'cancelled',NULL),
(27,1,15,NULL,'2025-09-21 11:05:50','2025-09-21 13:05:50','2025-09-21 11:09:28',2,280.00,'cancelled',NULL),
(28,1,15,NULL,'2025-09-21 11:24:26','2025-09-21 13:24:26','2025-09-21 11:24:49',2,280.00,'cancelled',NULL),
(29,1,12,NULL,'2025-09-21 11:26:21','2025-09-21 13:26:21','2025-09-21 11:26:35',2,250.00,'cancelled',NULL),
(30,1,4,NULL,'2025-09-22 12:44:13','2025-09-22 17:44:13','2025-09-22 12:44:26',5,80.00,'cancelled',NULL),
(31,1,8,NULL,'2025-09-22 17:52:31','2025-09-22 22:52:31','2025-09-22 17:52:52',5,450.00,'cancelled',NULL),
(32,1,4,NULL,'2025-09-22 17:52:57','2025-09-22 19:52:57','2025-09-22 17:53:16',2,32.00,'cancelled',NULL),
(33,1,4,NULL,'2025-09-22 17:58:09','2025-09-22 19:58:09','2025-09-22 17:58:32',2,32.00,'cancelled',NULL),
(34,1,4,NULL,'2025-09-22 17:59:11','2025-09-22 19:59:11','2025-09-22 17:59:22',2,32.00,'cancelled',NULL),
(35,1,12,NULL,'2025-09-26 18:27:35','2025-09-26 20:27:35','2025-09-26 18:27:46',2,250.00,'cancelled',NULL),
(36,1,12,NULL,'2025-10-03 08:20:27','2025-10-03 16:20:27','2025-10-03 08:20:54',8,1000.00,'cancelled',NULL),
(37,1,NULL,NULL,'2025-10-15 13:25:23','2025-10-15 21:25:23','2025-10-15 13:25:40',8,40.00,'cancelled',NULL),
(38,1,9,NULL,'2025-10-15 13:26:49','2025-10-15 14:26:49',NULL,1,110.00,'expired',NULL),
(39,1,18,NULL,'2025-10-15 15:03:04','2025-10-15 16:03:04',NULL,1,15.00,'expired',NULL),
(40,1,15,NULL,'2025-10-15 19:09:49','2025-10-15 21:09:49','2025-10-15 19:11:17',2,280.00,'cancelled',NULL),
(41,1,10,NULL,'2025-11-10 16:38:59','2025-11-10 17:38:59','2025-11-10 16:39:12',1,95.00,'cancelled',NULL),
(42,1,10,NULL,'2025-11-10 18:05:50','2025-11-10 19:05:50',NULL,1,95.00,'expired',NULL),
(43,1,11,NULL,'2025-11-10 18:05:53','2025-11-10 20:05:53',NULL,2,260.00,'expired',NULL),
(44,1,12,NULL,'2025-11-10 18:22:44','2025-11-10 19:22:44',NULL,1,125.00,'expired',NULL),
(45,1,14,NULL,'2025-11-10 18:22:49','2025-11-10 19:22:49',NULL,1,115.00,'expired',NULL),
(46,1,18,NULL,'2025-12-04 07:51:30','2025-12-04 08:51:30',NULL,1,15.00,'expired',NULL),
(47,3,6,NULL,'2025-12-04 07:57:45','2025-12-04 08:57:45',NULL,1,100.00,'expired',NULL),
(48,1,18,13,'2025-12-04 10:43:07','2025-12-04 11:43:07','2025-12-04 10:43:22',1,15.00,'cancelled',NULL),
(49,1,9,6,'2025-12-04 10:43:51','2025-12-04 12:43:51','2025-12-04 10:44:48',2,220.00,'cancelled',NULL),
(50,1,18,13,'2025-12-04 12:20:10','2025-12-04 13:20:10','2025-12-04 12:20:57',1,15.00,'cancelled',NULL),
(51,1,18,13,'2025-12-04 12:22:08','2025-12-04 14:22:08',NULL,2,30.00,'active',NULL),
(52,3,18,36,'2025-12-04 12:22:32','2025-12-04 13:22:32',NULL,1,15.00,'expired',NULL),
(53,3,4,1,'2025-12-04 12:53:55','2025-12-04 13:53:55',NULL,1,16.00,'expired',NULL),
(54,3,18,37,'2025-12-04 12:54:27','2025-12-04 14:54:27',NULL,2,30.00,'active',NULL);

-- Table: reviews
DROP TABLE IF EXISTS `reviews`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert review data
INSERT INTO `reviews` VALUES 
(1,1,18,39,5,'Very Great Experience',5,4,4,'2025-12-04 07:40:15','2025-12-04 07:40:15',1),
(2,1,9,38,4,'good',4,5,4,'2025-12-04 07:41:22','2025-12-04 07:41:22',1);

-- Table: review_votes
DROP TABLE IF EXISTS `review_votes`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert review votes
INSERT INTO `review_votes` VALUES 
(1,1,1,1,'2025-12-04 07:40:48'),
(2,2,1,0,'2025-12-04 07:42:28'),
(15,2,3,1,'2025-12-04 07:47:18');

-- Table: review_responses
DROP TABLE IF EXISTS `review_responses`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert review responses
INSERT INTO `review_responses` VALUES 
(1,1,2,'Thank you for Your Visiting','2025-12-04 07:45:06','2025-12-04 07:45:06');

-- =============================================
-- Event: Expire Bookings and Update Availability
-- =============================================
DELIMITER $$
CREATE EVENT IF NOT EXISTS `expire_bookings` 
ON SCHEDULE EVERY 1 MINUTE
ON COMPLETION PRESERVE
ENABLE
DO BEGIN
  -- Step 1: Expire old bookings
  UPDATE bookings
  SET status = 'expired'
  WHERE status = 'active' AND expires_at < NOW();

  -- Step 2: Free up slots
  UPDATE parking_slots ps
  INNER JOIN bookings b ON ps.id = b.slot_id
  SET ps.is_available = 1
  WHERE b.status = 'expired' AND ps.is_active = 1;

  -- Step 3: Recalculate parking_spots
  UPDATE parking_spots ps
  SET available_slots = (
    SELECT COUNT(*) FROM parking_slots sl
    WHERE sl.parking_spot_id = ps.id AND sl.is_active = 1 AND sl.is_available = 1
  ),
  occupied_slots = (
    SELECT COUNT(*) FROM parking_slots sl
    WHERE sl.parking_spot_id = ps.id AND sl.is_active = 1 AND sl.is_available = 0
  );

  -- Step 4: Sync availability table
  UPDATE availability a
  INNER JOIN parking_spots ps ON a.parking_id = ps.id
  SET a.available_slots = ps.available_slots,
      a.occupied_slots = ps.occupied_slots,
      a.updated_at = NOW();
END$$
DELIMITER ;
