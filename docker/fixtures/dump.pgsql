--
-- PostgreSQL database dump
--

-- Dumped from database version 13.0
-- Dumped by pg_dump version 13.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Reset database drop table and views if exists
--
DROP VIEW IF EXISTS public.citizen_profile, public.transaction;
DROP TABLE IF EXISTS public.bpd_citizen, public.bpd_payment_instrument, public.bpd_winning_transaction;

--
-- Name: bpd_citizen; Type: TABLE; Schema: public; Owner: testuser
--

CREATE TABLE public.bpd_citizen (
    fiscal_code_s character varying(16) NOT NULL,
    payoff_instr_s character varying(27),
    payoff_instr_type_c character varying(4),
    timestamp_tc_t timestamp(6) with time zone NOT NULL,
    insert_date_t timestamp(6) with time zone,
    insert_user_s character varying(40),
    update_date_t timestamp(6) with time zone,
    update_user_s character varying(40),
    enabled_b boolean
);


ALTER TABLE public.bpd_citizen OWNER TO testuser;

--
-- Name: bpd_payment_instrument; Type: TABLE; Schema: public; Owner: testuser
--

CREATE TABLE public.bpd_payment_instrument (
    hpan_s character varying(64) NOT NULL,
    fiscal_code_s character varying(16) NOT NULL,
    cancellation_t timestamp(6) with time zone,
    status_c character varying(10) NOT NULL,
    enrollment_t timestamp(6) with time zone NOT NULL,
    insert_date_t timestamp(6) with time zone,
    insert_user_s character varying(40),
    update_date_t timestamp(6) with time zone,
    update_user_s character varying(40),
    enabled_b boolean
);


ALTER TABLE public.bpd_payment_instrument OWNER TO testuser;

--
-- Name: bpd_winning_transaction; Type: TABLE; Schema: public; Owner: testuser
--

CREATE TABLE public.bpd_winning_transaction (
    acquirer_c character varying(20) NOT NULL,
    amount_currency_c character varying(3),
    amount_i numeric,
    award_period_id_n int8range,
    circuit_type_c character varying(5),
    hpan_s character varying(64),
    id_trx_acquirer_s character varying NOT NULL,
    mcc_c character varying(5),
    mcc_descr_s character varying(40),
    operation_type_c character varying(5),
    score_n numeric,
    trx_timestamp_t timestamp(6) with time zone NOT NULL,
    insert_date_t timestamp(6) with time zone,
    insert_user_s character varying(20),
    update_date_t timestamp(6) with time zone,
    update_user_s character varying(20),
    enabled_b boolean,
    merchant_id_s character varying,
    correlation_id_s character varying,
    acquirer_id_s character varying,
    id_trx_issuer_s character varying,
    bin_s character varying,
    terminal_id_s character varying
);

ALTER TABLE public.bpd_winning_transaction OWNER TO testuser;

--
-- Name: citizen_profile; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.citizen_profile AS
 SELECT a.fiscal_code_s AS fiscal_code,
    a.enabled_b AS citizen_enabled,
    a.timestamp_tc_t AS timestamp_tc,
    a.payoff_instr_s AS pay_off_instr,
    a.payoff_instr_type_c AS pay_off_instr_type_id,
    a.insert_date_t AS onboarding_date,
    a.update_date_t AS update_date,
    a.insert_user_s AS onboarding_issuer_id,
    a.update_user_s AS update_user,
    b.insert_date_t AS payment_instrument_insert_date,
    b.update_date_t AS payment_instrument_update_date,
    b.insert_user_s AS payment_instrument_insert_user,
    b.update_user_s AS payment_instrument_update_user,
    b.hpan_s AS payment_instrument_hpan,
    b.enabled_b AS payment_instrument_enabled,
    b.status_c AS payment_instrument_status
   FROM (public.bpd_citizen a
     LEFT JOIN public.bpd_payment_instrument b ON (((a.fiscal_code_s)::text = (b.fiscal_code_s)::text)));


ALTER TABLE public.citizen_profile OWNER TO testuser;

--
-- Name: transaction; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.transaction AS
 SELECT bpd_payment_instrument.fiscal_code_s AS fiscal_code,
    bpd_winning_transaction.hpan_s AS hpan,
    bpd_winning_transaction.trx_timestamp_t AS trx_timestamp,
    bpd_winning_transaction.acquirer_id_s AS acquirer_id,
    bpd_winning_transaction.acquirer_c AS acquirer_descr,
    bpd_winning_transaction.id_trx_acquirer_s AS id_trx_acquirer,
    bpd_winning_transaction.id_trx_issuer_s AS id_trx_issuer,
    bpd_winning_transaction.operation_type_c AS operation_type_id,
    bpd_winning_transaction.operation_type_c AS operation_type_descr,
    bpd_winning_transaction.circuit_type_c AS circuit_type_id,
    bpd_winning_transaction.circuit_type_c AS circuit_type_descr,
    bpd_winning_transaction.amount_i AS amount,
    bpd_winning_transaction.amount_currency_c AS amount_currency,
    bpd_winning_transaction.mcc_c AS mcc,
    bpd_winning_transaction.mcc_descr_s AS mcc_descr,
    bpd_winning_transaction.score_n AS score,
    bpd_winning_transaction.award_period_id_n AS award_period_id,
    bpd_winning_transaction.insert_date_t AS insert_date,
    bpd_winning_transaction.insert_user_s AS insert_user,
    bpd_winning_transaction.update_date_t AS update_date,
    bpd_winning_transaction.update_user_s AS update_user,
    bpd_winning_transaction.merchant_id_s AS merchant_id,
    bpd_winning_transaction.merchant_id_s AS merchant_descr,
    bpd_winning_transaction.correlation_id_s AS correlation_id,
    bpd_winning_transaction.correlation_id_s AS correlation_desr,
    bpd_winning_transaction.bin_s AS bin,
    bpd_winning_transaction.terminal_id_s AS terminal_id,
    bpd_winning_transaction.terminal_id_s AS terminal_descr,
    bpd_winning_transaction.enabled_b AS enabled
   FROM (public.bpd_winning_transaction
     LEFT JOIN public.bpd_payment_instrument ON (((bpd_winning_transaction.hpan_s)::text = (bpd_payment_instrument.hpan_s)::text)));


ALTER TABLE public.transaction OWNER TO testuser;

--
-- Data for Name: bpd_citizen; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('AAABBB01C02D345B', NULL, NULL, '2020-10-30 10:45:51.966658+01', '2020-10-30 10:45:51.966658+01', NULL, NULL, NULL, true);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('AAABBB01C02D345C', NULL, NULL, '2020-10-30 10:45:56.241808+01', '2020-10-30 10:45:56.241808+01', NULL, NULL, NULL, true);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('AAABBB01C02D345D', NULL, NULL, '2020-10-30 10:46:08.886749+01', '2020-10-30 10:46:08.886749+01', NULL, NULL, NULL, false);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('AAABBB01C02D345E', 'IT49Q0300203280468153561998', 'IBAN', '2020-10-30 10:47:41.250312+01', '2020-10-30 10:47:41.250312+01', NULL, NULL, NULL, true);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('AAABBB01C02D345F', 'IT04Q0300203280667958133212', 'IBAN', '2020-10-30 10:47:59.350655+01', '2020-10-30 10:47:59.350655+01', NULL, NULL, NULL, false);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('AAABBB01C02D345A', NULL, NULL, '2020-10-30 10:45:44.21482+01', '2020-10-30 10:45:44.21482+01', 'Piattaforma A', '2020-10-30 10:45:44.21482+01', 'Piattaforma B', true);


--
-- Data for Name: bpd_payment_instrument; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_payment_instrument (hpan_s, fiscal_code_s, cancellation_t, status_c, enrollment_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', 'AAABBB01C02D345A', NULL, 'ACTIVE', '2020-10-30 11:02:08.749861+01', '2020-10-30 11:02:08.749861+01', NULL, NULL, NULL, true);
INSERT INTO public.bpd_payment_instrument (hpan_s, fiscal_code_s, cancellation_t, status_c, enrollment_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b) VALUES ('7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29', 'AAABBB01C02D345A', NULL, 'INACTIVE', '2020-10-30 11:02:31.11989+01', '2020-10-30 11:02:31.11989+01', NULL, NULL, NULL, false);

--
-- Data for Name: bpd_winning_transaction; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_winning_transaction VALUES ('Acquirer1', 'EUR', 10, NULL, NULL, '807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', '1234567890123', NULL, NULL, NULL, 2, '2020-10-31 10:02:31.11989+00', '2020-10-31 10:02:31.11989+00', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_winning_transaction VALUES ('Acquirer2', 'EUR', 31, NULL, NULL, '807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', '2345678901555', NULL, NULL, NULL, 7, '2020-10-31 10:02:31.11989+00', '2020-10-31 10:02:31.11989+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Name: bpd_citizen bpd_citizen_pkey; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_citizen
    ADD CONSTRAINT bpd_citizen_pkey PRIMARY KEY (fiscal_code_s);


--
-- Name: bpd_payment_instrument bpd_payment_instrument_pkey; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_payment_instrument
    ADD CONSTRAINT bpd_payment_instrument_pkey PRIMARY KEY (hpan_s);


--
-- Name: TABLE citizen_profile; Type: ACL; Schema: public; Owner: testuser
--

GRANT ALL ON TABLE public.citizen_profile TO testuser;

--
-- Name: TABLE transaction; Type: ACL; Schema: public; Owner: testuser
--

GRANT ALL ON TABLE public.transaction TO testuser;


--
-- PostgreSQL database dump complete
--

