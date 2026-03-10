/*
  Warnings:

  - The primary key for the `MeterValue` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "MeterValue" DROP CONSTRAINT "MeterValue_pkey",
ADD CONSTRAINT "MeterValue_pkey" PRIMARY KEY ("id", "timestamp");

-- Create the TimescaleDB extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert the "MeterValue" table into a hypertable partitioned by the "timestamp" column
-- This drastically improves query performance for time-series aggregation and inserts
SELECT create_hypertable('"MeterValue"', 'timestamp', if_not_exists => TRUE);
