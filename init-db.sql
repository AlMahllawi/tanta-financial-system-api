DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'TantaFinancial') THEN
      CREATE DATABASE "TantaFinancial";
   END IF;
END
$$;

DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'tanta') THEN
      CREATE ROLE tanta WITH LOGIN PASSWORD 'n0nS3cure';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE "TantaFinancial" TO tanta;
ALTER DATABASE "TantaFinancial" OWNER TO tanta;
