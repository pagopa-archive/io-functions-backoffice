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
DROP VIEW IF EXISTS public.v_bpd_citizen, public.v_bpd_winning_transaction, public.v_bpd_payment_instrument;
DROP TABLE IF EXISTS public.bpd_citizen, public.bpd_payment_instrument, public.bpd_winning_transaction, public.bpd_payment_instrument_history;

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
    enabled_b boolean,
    channel_s character varying(64)
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
-- TOC entry 261 (class 1259 OID 19242)
-- Name: bpd_payment_instrument_history; Type: TABLE; Schema: public; Owner: testuser
--

CREATE TABLE public.bpd_payment_instrument_history (
    hpan_s character varying(64) NOT NULL,
    activation_t timestamp with time zone NOT NULL,
    deactivation_t timestamp with time zone,
    id_n bigint NOT NULL,
    fiscal_code_s character varying(16),
    insert_date_t timestamp with time zone,
    insert_user_s character varying(40),
    update_date_t timestamp with time zone,
    update_user_s character varying(40)
);


ALTER TABLE public.bpd_payment_instrument_history OWNER TO testuser;

--
-- Name: v_bpd_citizen; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.v_bpd_citizen AS
 SELECT cit.fiscal_code_s,
    cit.enabled_b,
    cit.payoff_instr_s,
    cit.payoff_instr_type_c,
    cit.timestamp_tc_t,
    bpi.hpan_s,
    bpi.status_c,
    cit.insert_date_t AS ctz_insert_date_t,
    cit.insert_user_s AS ctz_insert_user_s,
    cit.update_date_t AS ctz_update_date_t,
    cit.update_user_s AS ctz_update_user_s,
    bpi.insert_date_t AS pay_istr_insert_date_t,
    bpi.insert_user_s AS pay_istr_insert_user_s,
    bpi.update_date_t AS pay_istr_update_date_t,
    bpi.update_user_s AS pay_istr_update_user_s
   FROM (public.bpd_citizen cit
     LEFT JOIN public.bpd_payment_instrument bpi ON (((cit.fiscal_code_s)::text = (bpi.fiscal_code_s)::text)));


ALTER TABLE public.v_bpd_citizen OWNER TO testuser;

--
-- Name: v_bpd_winning_transaction; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.v_bpd_winning_transaction AS
 SELECT bpi.fiscal_code_s,
    bwt.trx_timestamp_t,
    bwt.acquirer_id_s,
    bwt.acquirer_c,
    bwt.id_trx_acquirer_s,
    bwt.id_trx_issuer_s,
    bwt.hpan_s,
    bwt.operation_type_c,
    bwt.circuit_type_c,
    bwt.amount_i,
    bwt.amount_currency_c,
    bwt.score_n,
    bwt.award_period_id_n,
    bwt.merchant_id_s,
    bwt.correlation_id_s,
    bwt.bin_s,
    bwt.terminal_id_s,
    bwt.enabled_b,
    bwt.insert_date_t AS winn_trans_insert_date_t,
    bwt.insert_user_s AS winn_trans_insert_user_s,
    bwt.update_date_t AS winn_trans_update_date_t,
    bwt.update_user_s AS winn_trans_update_user_s,
    bpi.insert_date_t AS paym_instr_insert_date_t,
    bpi.insert_user_s AS paym_instr_insert_user_s,
    bpi.update_date_t AS paym_instr_update_date_t,
    bpi.update_user_s AS paym_instr_update_user_s
   FROM (public.bpd_winning_transaction bwt
     JOIN public.bpd_payment_instrument bpi ON (((bwt.hpan_s)::text = (bpi.hpan_s)::text)));


ALTER TABLE public.v_bpd_winning_transaction OWNER TO testuser;

--
-- Name: v_bpd_payment_instrument; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.v_bpd_payment_instrument AS
 SELECT bpi.fiscal_code_s,
    bpih.hpan_s,
        CASE
            WHEN (bpih.deactivation_t IS NOT NULL) THEN 'INACTIVE'::text
            ELSE 'ACTIVE'::text
        END AS status_c,
    bpi.channel_s,
    bpi.enabled_b,
    bpih.activation_t AS enrollment_t,
    bpih.deactivation_t AS cancellation_t,
    NULL::text AS paym_istr_hist_insert_date_t,
    NULL::text AS paym_istr_hist_insert_user_s,
    NULL::text AS paym_istr_hist_update_date_t,
    NULL::text AS paym_istr_hist_update_user_s,
    bpi.insert_date_t AS paym_istr_insert_date_t,
    bpi.insert_user_s AS paym_istr_insert_user_s,
    bpi.update_date_t AS paym_istr_update_date_t,
    bpi.update_user_s AS paym_istr_update_user_s
   FROM (public.bpd_payment_instrument_history bpih
     JOIN public.bpd_payment_instrument bpi ON (((bpih.hpan_s)::text = (bpi.hpan_s)::text)));


ALTER TABLE public.v_bpd_payment_instrument OWNER TO testuser;

--
-- TOC entry 262 (class 1259 OID 19245)
-- Name: bpd_payment_instrument_history_id_n_seq; Type: SEQUENCE; Schema: public; Owner: testuser
--

CREATE SEQUENCE public.bpd_payment_instrument_history_id_n_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bpd_payment_instrument_history_id_n_seq OWNER TO testuser;

--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 262
-- Name: bpd_payment_instrument_history_id_n_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: testuser
--

ALTER SEQUENCE public.bpd_payment_instrument_history_id_n_seq OWNED BY public.bpd_payment_instrument_history.id_n;

--
-- TOC entry 4258 (class 2604 OID 19256)
-- Name: bpd_payment_instrument_history id_n; Type: DEFAULT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_payment_instrument_history ALTER COLUMN id_n SET DEFAULT nextval('public.bpd_payment_instrument_history_id_n_seq'::regclass);

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
-- Data for Name: bpd_payment_instrument_history; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_payment_instrument_history (hpan_s, fiscal_code_s, deactivation_t, activation_t, insert_date_t, insert_user_s, update_date_t, update_user_s) VALUES ('807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', 'AAABBB01C02D345A', '2020-10-30 11:02:08.749861+01', '2020-10-30 11:02:08.749861+01', NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_payment_instrument_history (hpan_s, fiscal_code_s, deactivation_t, activation_t, insert_date_t, insert_user_s, update_date_t, update_user_s) VALUES ('7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29', 'AAABBB01C02D345A', '2020-10-30 11:02:31.11989+01', '2020-10-30 11:02:31.11989+01', NULL, NULL, NULL, NULL);

--
-- Data for Name: bpd_winning_transaction; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_winning_transaction VALUES ('32875', '978', 10, NULL, '01', '807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', '1234567890123', NULL, NULL, '00', 2, '2020-10-31 10:02:31.11989+00', '2020-10-31 10:02:31.11989+00', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_winning_transaction VALUES ('36081', '978', 31, NULL, '01', '807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', '2345678901555', NULL, NULL, '00', 7, '2020-10-31 10:02:31.11989+00', '2020-10-31 10:02:31.11989+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_winning_transaction VALUES ('02008', '978', 31, NULL, '00', '7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29', '2345678901555', NULL, NULL, '00', 7, '2020-10-31 10:02:31.11989+00', '2020-10-31 10:02:31.11989+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
-- TOC entry 4260 (class 2606 OID 19274)
-- Name: bpd_payment_instrument_history bpd_payment_instrument_history_pk; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_payment_instrument_history
    ADD CONSTRAINT bpd_payment_instrument_history_pk PRIMARY KEY (id_n);

--
-- TOC entry 4262 (class 2606 OID 52861)
-- Name: bpd_payment_instrument_history bpd_payment_instrument_history_un; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_payment_instrument_history
    ADD CONSTRAINT bpd_payment_instrument_history_un UNIQUE (hpan_s, activation_t, deactivation_t);


--
-- Name: TABLE v_bpd_citizen; Type: ACL; Schema: public; Owner: testuser
--

GRANT ALL ON TABLE public.v_bpd_citizen TO testuser;

--
-- Name: TABLE v_bpd_winning_transaction; Type: ACL; Schema: public; Owner: testuser
--

GRANT ALL ON TABLE public.v_bpd_winning_transaction TO testuser;

--
-- TOC entry 4397 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE bpd_payment_instrument_history; Type: ACL; Schema: public; Owner: testuser
--

GRANT ALL ON TABLE public.bpd_payment_instrument_history TO testuser;

--
-- TOC entry 4399 (class 0 OID 0)
-- Dependencies: 262
-- Name: SEQUENCE bpd_payment_instrument_history_id_n_seq; Type: ACL; Schema: public; Owner: testuser
--

GRANT ALL ON SEQUENCE public.bpd_payment_instrument_history_id_n_seq TO testuser;


--
-- PostgreSQL database dump complete
--

