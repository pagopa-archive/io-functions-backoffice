--
-- Reset database drop table and views if exists
--
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION testuser;