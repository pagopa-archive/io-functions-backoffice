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
    enabled_b boolean,
    account_holder_cf_s varchar NULL,
    account_holder_name_s varchar NULL,
    account_holder_surname_s varchar NULL,
    check_instr_status_s varchar NULL,
    cancellation_t timestamp(6) with time zone
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
    award_period_id_n bigint NOT NULL,
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
    terminal_id_s character varying,
    fiscal_code_s character varying,
    elab_ranking_b boolean
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
-- TOC entry 288 (class 1259 OID 19215)
-- Name: bpd_citizen_ranking; Type: TABLE; Schema: bpd_citizen; Owner: ddsadmin
--

CREATE TABLE public.bpd_citizen_ranking (
    fiscal_code_c character varying(16) NOT NULL,
    award_period_id_n bigint NOT NULL,
    ranking_n bigint,
    insert_date_t timestamp with time zone,
    insert_user_s character varying,
    update_date_t timestamp with time zone,
    update_user_s character varying,
    enabled_b boolean DEFAULT true,
    ranking_min_n smallint,
    cashback_n numeric,
    transaction_n bigint,
    ranking_date_t timestamp with time zone,
    max_cashback_n numeric
);


ALTER TABLE public.bpd_citizen_ranking OWNER TO testuser;

--
-- TOC entry 285 (class 1259 OID 19201)
-- Name: bpd_award_period; Type: TABLE; Schema: public; Owner: testuser
--

CREATE TABLE public.bpd_award_period (
    award_period_id_n bigint NOT NULL,
    aw_period_start_d date NOT NULL,
    aw_period_end_d date NOT NULL,
    aw_grace_period_n smallint NOT NULL,
    insert_date_t timestamp with time zone,
    insert_user_s character varying(40),
    update_date_t timestamp with time zone,
    update_user_s character varying(40),
    enabled_b boolean,
    trx_volume_min_n smallint NOT NULL,
    trx_eval_max_n numeric(7,2) NOT NULL,
    amount_max_n numeric(7,2) NOT NULL,
    ranking_min_n numeric NOT NULL,
    trx_cashback_max_n numeric(6,2) NOT NULL,
    period_cashback_max_n numeric(7,2) NOT NULL,
    cashback_perc_n numeric(5,2) NOT NULL,
    status_period_c character varying(10)
);


ALTER TABLE public.bpd_award_period OWNER TO testuser;


--
-- TOC entry 285 (class 1259 OID 19201)
-- Name: bpd_award_winner; Type: TABLE; Schema: public; Owner: testuser
--

CREATE TABLE public.bpd_award_winner (
    id_n bigint NOT NULL,
    award_period_id_n bigint,
    fiscal_code_s character varying(16),
    payoff_instr_s character varying,
    amount_n numeric,
    insert_date_t timestamp with time zone,
    insert_user_s character varying(40),
    update_date_t timestamp with time zone,
    update_user_s character varying(40),
    enabled_b boolean,
    aw_period_start_d date,
    aw_period_end_d date,
    jackpot_n numeric,
    cashback_n numeric,
    typology_s character varying,
    account_holder_cf_s character varying,
    account_holder_name_s character varying,
    account_holder_surname_s character varying,
    check_instr_status_s character varying,
    account_holder_s character varying
);


ALTER TABLE public.bpd_award_winner OWNER TO testuser;

--
-- Name: v_bpd_citizen; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.v_bpd_citizen AS
 SELECT cit.fiscal_code_s,
    cit.enabled_b,
    cit.payoff_instr_s,
    cit.payoff_instr_type_c,
    cit.account_holder_cf_s,
    cit.account_holder_name_s,
    cit.account_holder_surname_s,
    cit.check_instr_status_s,
    cit.timestamp_tc_t,
    bpi.hpan_s,
    bpi.status_c,
    cit.cancellation_t,
    bpi.enabled_b AS pay_istr_update_enable_b,
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
 SELECT bwt.fiscal_code_s,
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
    bwt.elab_ranking_b,
    bwt.insert_date_t AS winn_trans_insert_date_t,
    bwt.insert_user_s AS winn_trans_insert_user_s,
    bwt.update_date_t AS winn_trans_update_date_t,
    bwt.update_user_s AS winn_trans_update_user_s
   FROM public.bpd_winning_transaction bwt;


ALTER TABLE public.v_bpd_winning_transaction OWNER TO testuser;

--
-- Name: v_bpd_payment_instrument; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.v_bpd_payment_instrument AS
 SELECT bpih.fiscal_code_s,
    bpih.hpan_s,
        CASE
            WHEN (bpih.deactivation_t IS NOT NULL) THEN 'INACTIVE'::text
            ELSE 'ACTIVE'::text
        END AS status_c,
    bpi.channel_s,
    bpi.enabled_b,
    bpih.activation_t AS enrollment_t,
    bpih.deactivation_t AS cancellation_t,
    bpih.insert_date_t AS paym_istr_hist_insert_date_t,
    bpih.insert_user_s AS paym_istr_hist_insert_user_s,
    bpih.update_date_t AS paym_istr_hist_update_date_t,
    bpih.update_user_s AS paym_istr_hist_update_user_s,
    bpi.insert_date_t AS paym_istr_insert_date_t,
    bpi.insert_user_s AS paym_istr_insert_user_s,
    bpi.update_date_t AS paym_istr_update_date_t,
    bpi.update_user_s AS paym_istr_update_user_s
   FROM (public.bpd_payment_instrument_history bpih
     JOIN public.bpd_payment_instrument bpi ON (((bpih.hpan_s)::text = (bpi.hpan_s)::text)));


ALTER TABLE public.v_bpd_payment_instrument OWNER TO testuser;

--
-- Name: v_bpd_payment_instrument; Type: VIEW; Schema: public; Owner: testuser
--

CREATE VIEW public.v_bpd_award_citizen AS
 SELECT bc.fiscal_code_s,
    baw.id_n,
    baw.award_period_id_n AS aw_winn_award_period_id_n,
    baw.payoff_instr_s,
    baw.amount_n,
    baw.aw_period_start_d AS aw_winn_aw_period_start_d,
    baw.aw_period_end_d AS aw_winn_aw_period_end_d,
    baw.jackpot_n,
    baw.cashback_n AS aw_winn_cashback_n,
    baw.typology_s,
    baw.account_holder_cf_s,
    baw.account_holder_name_s,
    baw.account_holder_surname_s,
    baw.check_instr_status_s,
    baw.insert_date_t AS aw_winn_insert_date_t,
    baw.insert_user_s AS aw_winn_insert_user_s,
    baw.update_date_t AS aw_winn_update_date_t,
    baw.update_user_s AS aw_winn_update_user_s,
    baw.enabled_b AS aw_winn_enabled_b,
    bcr.award_period_id_n AS cit_rank_award_period_id,
    bcr.cashback_n AS cit_rank_cashback_n,
    bcr.transaction_n,
    bcr.ranking_n,
    bcr.ranking_date_t,
    bcr.insert_date_t AS cit_rank_insert_date_t,
    bcr.insert_user_s AS cit_rank_insert_user_s,
    bcr.update_date_t AS cit_rank_update_date_t,
    bcr.update_user_s AS cit_rank_update_user_s,
    bcr.enabled_b AS cit_rank_enabled_b,
    COALESCE(bap.award_period_id_n, bap1.award_period_id_n) AS award_period_id_n,
    COALESCE(bap.aw_period_start_d, bap1.aw_period_start_d) AS aw_per_aw_period_start_d,
    COALESCE(bap.aw_period_end_d, bap1.aw_period_end_d) AS aw_per_aw_period_end_d,
    COALESCE(bap.aw_grace_period_n, bap1.aw_grace_period_n) AS aw_grace_period_n,
    COALESCE(bap.amount_max_n, bap1.amount_max_n) AS amount_max_n,
    COALESCE(bap.trx_volume_min_n, bap1.trx_volume_min_n) AS trx_volume_min_n,
    COALESCE(bap.trx_eval_max_n, bap1.trx_eval_max_n) AS trx_eval_max_n,
    COALESCE(bap.ranking_min_n, bap1.ranking_min_n) AS ranking_min_n,
    COALESCE(bap.trx_cashback_max_n, bap1.trx_cashback_max_n) AS trx_cashback_max_n,
    COALESCE(bap.period_cashback_max_n, bap1.period_cashback_max_n) AS period_cashback_max_n,
    COALESCE(bap.cashback_perc_n, bap1.cashback_perc_n) AS cashback_perc_n,
    COALESCE(bap.insert_date_t, bap1.insert_date_t) AS aw_per_insert_date_t,
    COALESCE(bap.insert_user_s, bap1.insert_user_s) AS aw_per_insert_user_s,
    COALESCE(bap.update_date_t, bap1.update_date_t) AS aw_per_update_date_t,
    COALESCE(bap.update_user_s, bap1.update_user_s) AS aw_per_update_user_s,
    COALESCE(bap.enabled_b, bap1.enabled_b) AS aw_per_enabled_b
   FROM ((((public.bpd_citizen bc
     LEFT JOIN public.bpd_award_winner baw ON (((bc.fiscal_code_s)::text = (baw.fiscal_code_s)::text)))
     LEFT JOIN public.bpd_citizen_ranking bcr ON (((bc.fiscal_code_s)::text = (bcr.fiscal_code_c)::text)))
     LEFT JOIN public.bpd_award_period bap ON ((bcr.award_period_id_n = bap.award_period_id_n)))
     LEFT JOIN public.bpd_award_period bap1 ON ((baw.award_period_id_n = bap1.award_period_id_n)));


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
-- TOC entry 286 (class 1259 OID 19204)
-- Name: bpd_award_period_award_period_id_seq; Type: SEQUENCE; Schema: public; Owner: testuser
--

CREATE SEQUENCE public.bpd_award_period_award_period_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bpd_award_period_award_period_id_seq OWNER TO testuser;

--
-- TOC entry 286 (class 1259 OID 19204)
-- Name: bpd_award_period_bpd_award_winner_id_seq; Type: SEQUENCE; Schema: public; Owner: testuser
--

CREATE SEQUENCE public.bpd_award_period_bpd_award_winner_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bpd_award_period_bpd_award_winner_id_seq OWNER TO testuser;

--
-- TOC entry 4398 (class 0 OID 0)
-- Dependencies: 262
-- Name: bpd_payment_instrument_history_id_n_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: testuser
--

ALTER SEQUENCE public.bpd_payment_instrument_history_id_n_seq OWNED BY public.bpd_payment_instrument_history.id_n;

--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 286
-- Name: bpd_award_period_award_period_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: testuser
--

ALTER SEQUENCE public.bpd_award_period_award_period_id_seq OWNED BY public.bpd_award_period.award_period_id_n;

--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 286
-- Name: bpd_award_period_bpd_award_winner_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: testuser
--

ALTER SEQUENCE public.bpd_award_period_bpd_award_winner_id_seq OWNED BY public.bpd_award_winner.id_n;

--
-- TOC entry 4258 (class 2604 OID 19256)
-- Name: bpd_payment_instrument_history id_n; Type: DEFAULT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_payment_instrument_history ALTER COLUMN id_n SET DEFAULT nextval('public.bpd_payment_instrument_history_id_n_seq'::regclass);

--
-- TOC entry 4302 (class 2604 OID 19255)
-- Name: bpd_award_period award_period_id_n; Type: DEFAULT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_award_period ALTER COLUMN award_period_id_n SET DEFAULT nextval('public.bpd_award_period_award_period_id_seq'::regclass);

--
-- TOC entry 4302 (class 2604 OID 19255)
-- Name: bpd_award_period award_period_id_n; Type: DEFAULT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_award_winner ALTER COLUMN id_n SET DEFAULT nextval('public.bpd_award_period_bpd_award_winner_id_seq'::regclass);

--
-- Data for Name: bpd_citizen; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, cancellation_t) VALUES ('AAABBB01C02D345B', NULL, NULL, '2020-10-30 10:45:51.966658+01', '2020-10-30 10:45:51.966658+01', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, cancellation_t) VALUES ('AAABBB01C02D345C', NULL, NULL, '2020-10-30 10:45:56.241808+01', '2020-10-30 10:45:56.241808+01', NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, cancellation_t) VALUES ('AAABBB01C02D345D', NULL, NULL, '2020-10-30 10:46:08.886749+01', '2020-10-30 10:46:08.886749+01', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, cancellation_t) VALUES ('AAABBB01C02D345E', 'IT49Q0300203280468153561998', 'IBAN', '2020-10-30 10:47:41.250312+01', '2020-10-30 10:47:41.250312+01', NULL, NULL, NULL, true, 'AAABBB01C02D345B', 'ANTONIO', 'ROSSI', 'OK', NULL);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, cancellation_t) VALUES ('AAABBB01C02D345F', 'IT04Q0300203280667958133212', 'IBAN', '2020-10-30 10:47:59.350655+01', '2020-10-30 10:47:59.350655+01', NULL, NULL, NULL, false, 'AAABBB01C02D345C', 'GIUSEPPE', 'VERDI', 'UNKNOWN_PSP', NULL);
INSERT INTO public.bpd_citizen (fiscal_code_s, payoff_instr_s, payoff_instr_type_c, timestamp_tc_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, cancellation_t) VALUES ('AAABBB01C02D345A', 'IT49Q0300203280468153000112', 'IBAN', '2020-10-30 10:45:44.21482+01', '2020-10-30 10:45:44.21482+01', 'Piattaforma A', '2020-10-30 10:45:44.21482+01', 'Piattaforma B', true, 'AAABBB01C02D345B', 'MARIO', 'BIANCHI', 'OK', NULL);


--
-- Data for Name: bpd_payment_instrument; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_payment_instrument (hpan_s, fiscal_code_s, cancellation_t, status_c, enrollment_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, channel_s) VALUES ('807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', 'AAABBB01C02D345A', NULL, 'ACTIVE', '2020-10-30 11:02:08.749861+01', '2020-10-30 11:02:08.749861+01', NULL, NULL, NULL, true, 'app-io-channel');
INSERT INTO public.bpd_payment_instrument (hpan_s, fiscal_code_s, cancellation_t, status_c, enrollment_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, channel_s) VALUES ('7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29', 'AAABBB01C02D345A', NULL, 'INACTIVE', '2020-10-30 11:02:31.11989+01', '2020-10-30 11:02:31.11989+01', NULL, NULL, NULL, false, '36081');
INSERT INTO public.bpd_payment_instrument (hpan_s, fiscal_code_s, cancellation_t, status_c, enrollment_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, channel_s) VALUES ('80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a297726b99f6eff4f', 'AAABBB01C02D345B', NULL, 'ACTIVE', '2020-10-30 11:02:31.11989+01', '2020-10-30 11:02:31.11989+01', NULL, NULL, NULL, true, '36081');
INSERT INTO public.bpd_payment_instrument (hpan_s, fiscal_code_s, cancellation_t, status_c, enrollment_t, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, channel_s) VALUES ('6e9f7aa01c5837cbc9f1b9dc4c51689a297726b99f6eff4f0f27e91eee2fb4f8', 'AAABBB01C02D345B', NULL, 'ACTIVE', '2020-10-30 11:02:31.11989+01', '2020-10-30 11:02:31.11989+01', NULL, NULL, NULL, true, '36081');

--
-- Data for Name: bpd_payment_instrument_history; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_payment_instrument_history (hpan_s, fiscal_code_s, deactivation_t, activation_t, insert_date_t, insert_user_s, update_date_t, update_user_s) VALUES ('807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966', 'AAABBB01C02D345A', '2020-10-30 11:02:08.749861+01', '2020-10-30 11:02:08.749861+01', NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_payment_instrument_history (hpan_s, fiscal_code_s, deactivation_t, activation_t, insert_date_t, insert_user_s, update_date_t, update_user_s) VALUES ('7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29', 'AAABBB01C02D345A', '2020-10-30 11:02:31.11989+01', '2020-10-30 11:02:31.11989+01', NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_payment_instrument_history (hpan_s, fiscal_code_s, deactivation_t, activation_t, insert_date_t, insert_user_s, update_date_t, update_user_s) VALUES ('80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a297726b99f6eff4f', 'AAABBB01C02D345A', '2020-10-30 11:02:31.11989+01', '2020-10-31 11:02:31.11989+01', NULL, NULL, NULL, NULL);
INSERT INTO public.bpd_payment_instrument_history (hpan_s, fiscal_code_s, deactivation_t, activation_t, insert_date_t, insert_user_s, update_date_t, update_user_s) VALUES ('80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a297726b99f6eff4f', 'AAABBB01C02D345B', '2020-10-31 11:02:31.11989+01', '2020-10-31 11:02:31.11989+01', NULL, NULL, NULL, NULL);

--
-- Data for Name: bpd_winning_transaction; Type: TABLE DATA; Schema: public; Owner: testuser
--

INSERT INTO public.bpd_winning_transaction (acquirer_c,amount_currency_c,amount_i,award_period_id_n,circuit_type_c,hpan_s,id_trx_acquirer_s,mcc_c,mcc_descr_s,operation_type_c,score_n,trx_timestamp_t,insert_date_t,insert_user_s,update_date_t,update_user_s,enabled_b,merchant_id_s,correlation_id_s,acquirer_id_s,id_trx_issuer_s,bin_s,terminal_id_s,fiscal_code_s,elab_ranking_b) VALUES
	 ('32875','978',10,1,'01','807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966','1234567890123',NULL,NULL,'00',2,'2020-10-31 11:02:31.119','2020-10-31 11:02:31.119',NULL,NULL,NULL,true,NULL,NULL,'123432',NULL,NULL,NULL,'AAABBB01C02D345A',true),
	 ('36081','978',31,1,'01','807ae5f38db47bff8b09b37ad803cb10ef5147567a89a33a66bb3282df4ad966','2345678901555',NULL,NULL,'00',7,'2020-10-31 11:02:31.119','2020-10-31 11:02:31.119',NULL,NULL,NULL,NULL,NULL,NULL,'123435',NULL,NULL,NULL,'AAABBB01C02D345A',true),
	 ('02008','978',31,1,'00','7726b99f6eff4f80f27e91eee2fb4f6e9f7aa01c5837cbc9f1b9dc4c51689a29','2345678901558',NULL,NULL,'00',7,'2020-10-31 11:02:31.119','2020-10-31 11:02:31.119',NULL,NULL,NULL,NULL,NULL,NULL,'123437',NULL,NULL,NULL,'AAABBB01C02D345A',true);

--
-- Data for Name: bpd_award_period; Type: TABLE DATA; Schema: public; Owner: testuser
--
INSERT INTO public.bpd_award_period (award_period_id_n, aw_period_start_d, aw_period_end_d, aw_grace_period_n, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, trx_volume_min_n, trx_eval_max_n, amount_max_n, ranking_min_n, trx_cashback_max_n, period_cashback_max_n, cashback_perc_n, status_period_c) VALUES (0, '2020-11-23 10:02:31.11989+00', '2020-12-31 23:59:59.11989+00', 10, '2020-10-31 10:02:31.11989+00', 'test', '2020-10-31 10:02:31.11989+00', 'test', true, 2, 150, 150, 1500, 15, 150, 10, NULL);
INSERT INTO public.bpd_award_period (award_period_id_n, aw_period_start_d, aw_period_end_d, aw_grace_period_n, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, trx_volume_min_n, trx_eval_max_n, amount_max_n, ranking_min_n, trx_cashback_max_n, period_cashback_max_n, cashback_perc_n, status_period_c) VALUES (1, '2021-01-01 10:02:31.11989+00', '2021-06-30 23:59:59.11989+00', 10, '2020-10-31 10:02:31.11989+00', 'test', '2020-10-31 10:02:31.11989+00', 'test', true, 2, 150, 150, 1500, 15, 150, 10, NULL);

--
-- Data for Name: bpd_award_winner; Type: TABLE DATA; Schema: public; Owner: testuser
--
INSERT INTO public.bpd_award_winner (id_n, award_period_id_n, fiscal_code_s, payoff_instr_s, amount_n, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, aw_period_start_d, aw_period_end_d, jackpot_n, cashback_n, typology_s, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, account_holder_s) VALUES (0, 0, 'AAABBB01C02D345A', 'IT49Q0300203280468153000112', 10, '2020-10-31 10:02:31.11989+00', 'test', '2020-10-31 10:02:31.11989+00', 'test', true, '2020-11-23 10:02:31.11989+00', '2020-12-31 23:59:59.11989+00', 1500, 20, NULL, 'AAABBB01C02D345A', 'Mario', 'Bianchi', 'OK', NULL);
INSERT INTO public.bpd_award_winner (id_n, award_period_id_n, fiscal_code_s, payoff_instr_s, amount_n, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, aw_period_start_d, aw_period_end_d, jackpot_n, cashback_n, typology_s, account_holder_cf_s, account_holder_name_s, account_holder_surname_s, check_instr_status_s, account_holder_s) VALUES (1, 1, 'AAABBB01C02D345A', 'IT49Q0300203280468153000112', 10, '2020-10-31 10:02:31.11989+00', 'test', '2020-10-31 10:02:31.11989+00', 'test', true, '2020-11-23 10:02:31.11989+00', '2020-12-31 23:59:59.11989+00', 1500, 20, NULL, 'AAABBB01C02D345A', 'Mario', 'Bianchi', 'OK', NULL);

--
-- Data for Name: bpd_citizen_ranking; Type: TABLE DATA; Schema: public; Owner: testuser
--
INSERT INTO public.bpd_citizen_ranking (fiscal_code_c, award_period_id_n, ranking_n, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, ranking_min_n, cashback_n, transaction_n, ranking_date_t, max_cashback_n) VALUES ('AAABBB01C02D345A', 0, 1, '2020-10-31 10:02:31.11989+00', 'test', '2020-10-31 10:02:31.11989+00', 'test', true, 150, 10, 2, '2020-12-31 23:59:59.11989+00', 150);
INSERT INTO public.bpd_citizen_ranking (fiscal_code_c, award_period_id_n, ranking_n, insert_date_t, insert_user_s, update_date_t, update_user_s, enabled_b, ranking_min_n, cashback_n, transaction_n, ranking_date_t, max_cashback_n) VALUES ('AAABBB01C02D345A', 1, 1, '2020-10-31 10:02:31.11989+00', 'test', '2020-10-31 10:02:31.11989+00', 'test', true, 150, 10, 2, '2020-12-31 23:59:59.11989+00', 150);

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
-- TOC entry 4304 (class 2606 OID 19262)
-- Name: bpd_citizen_ranking bpd_citizen_ranking_pk; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_citizen_ranking
    ADD CONSTRAINT bpd_citizen_ranking_pk PRIMARY KEY (fiscal_code_c, award_period_id_n);

--
-- TOC entry 4305 (class 2606 OID 19283)
-- Name: bpd_citizen_ranking bpd_citizen_ranking_fiscal_code_c_fkey; Type: FK CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_citizen_ranking
    ADD CONSTRAINT bpd_citizen_ranking_fiscal_code_c_fkey FOREIGN KEY (fiscal_code_c) REFERENCES public.bpd_citizen(fiscal_code_s);


--
-- TOC entry 4304 (class 2606 OID 19258)
-- Name: bpd_award_period bpd_award_period_pkey; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE ONLY public.bpd_award_period
    ADD CONSTRAINT bpd_award_period_pkey PRIMARY KEY (award_period_id_n);

--
-- Name: bpd_award_winner bpd_award_winner_pkey; Type: CONSTRAINT; Schema: public; Owner: testuser
--

ALTER TABLE public.bpd_award_winner
    ADD CONSTRAINT bpd_award_winner_pkey PRIMARY KEY (id_n);

ALTER TABLE public.bpd_winning_transaction
        ADD CONSTRAINT bpd_winning_transaction_pkey PRIMARY KEY (id_trx_acquirer_s, trx_timestamp_t, acquirer_c, acquirer_id_s, operation_type_c);

--
-- PostgreSQL database dump complete
--
