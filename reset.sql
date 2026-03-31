DROP DATABASE IF EXISTS "TantaFinancial";
DROP DATABASE IF EXISTS "TantaFinancialShadow";
DROP ROLE IF EXISTS tanta;

CREATE ROLE tanta WITH LOGIN PASSWORD 'nonS3cure';
CREATE DATABASE "TantaFinancial" OWNER tanta;
CREATE DATABASE "TantaFinancialShadow" OWNER tanta;
