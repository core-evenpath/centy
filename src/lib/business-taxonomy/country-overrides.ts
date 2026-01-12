/**
 * Country-Specific Overrides - ALL COUNTRIES
 * 
 * Localized labels for business functions across 70+ countries.
 * Uses ISO 3166-1 alpha-2 country codes.
 */

import { CountryOverride, CountryCode } from './types';

/**
 * Normalize country code (handle legacy UK -> GB)
 */
function normalizeCode(code: CountryCode): string {
    if (code === 'UK') return 'GB';
    return code;
}

/**
 * Country overrides - localized labels for all countries
 */
export const COUNTRY_OVERRIDES: CountryOverride[] = [
    // ==========================================
    // 🇮🇳 INDIA
    // ==========================================
    { overrideId: 'in_nbfc', functionId: 'alternative_lending', countryCode: 'IN', localLabel: 'NBFC / Microfinance', aliases: ['nbfc', 'microfinance', 'mfi'], regulationLevel: 'high' },
    { overrideId: 'in_chit', functionId: 'community_savings', countryCode: 'IN', localLabel: 'Chit Fund / Nidhi Company', aliases: ['chit fund', 'nidhi'], regulationLevel: 'medium' },
    { overrideId: 'in_ca', functionId: 'accounting_tax', countryCode: 'IN', localLabel: 'CA Firm', aliases: ['chartered accountant', 'ca firm'], regulationLevel: 'high' },
    { overrideId: 'in_dsa', functionId: 'consumer_lending', countryCode: 'IN', localLabel: 'Loan DSA', aliases: ['dsa', 'loan agent'], regulationLevel: 'medium' },
    { overrideId: 'in_payment', functionId: 'payments_processing', countryCode: 'IN', localLabel: 'Payment Gateway / UPI', aliases: ['upi', 'razorpay', 'paytm'], regulationLevel: 'high' },
    { overrideId: 'in_coaching', functionId: 'test_preparation', countryCode: 'IN', localLabel: 'IIT / NEET / UPSC Coaching', aliases: ['iit coaching', 'neet', 'upsc'], regulationLevel: 'low' },
    { overrideId: 'in_edtech', functionId: 'online_learning', countryCode: 'IN', localLabel: 'EdTech Company', aliases: ['edtech', 'byju'], regulationLevel: 'low' },
    { overrideId: 'in_pg', functionId: 'shared_accommodation', countryCode: 'IN', localLabel: 'PG / Hostel', aliases: ['pg', 'paying guest', 'hostel'], regulationLevel: 'low' },
    { overrideId: 'in_playschool', functionId: 'early_childhood', countryCode: 'IN', localLabel: 'Playschool / Creche', aliases: ['playschool', 'creche', 'anganwadi'], regulationLevel: 'low' },
    { overrideId: 'in_kirana', functionId: 'grocery_convenience', countryCode: 'IN', localLabel: 'Kirana Store', aliases: ['kirana', 'provision store'], regulationLevel: 'low' },
    { overrideId: 'in_thela', functionId: 'street_food', countryCode: 'IN', localLabel: 'Thela / Food Cart', aliases: ['thela', 'chaat'], regulationLevel: 'low' },
    { overrideId: 'in_ayurveda', functionId: 'alternative_medicine', countryCode: 'IN', localLabel: 'Ayurveda / Homeopathy', aliases: ['ayurveda', 'homeopathy', 'unani'], regulationLevel: 'medium' },
    { overrideId: 'in_pathology', functionId: 'diagnostic_imaging', countryCode: 'IN', localLabel: 'Pathology Lab', aliases: ['pathology', 'diagnostic lab'], regulationLevel: 'medium' },
    { overrideId: 'in_chemist', functionId: 'pharmacy_retail', countryCode: 'IN', localLabel: 'Medical Store / Chemist', aliases: ['chemist', 'medical store'], regulationLevel: 'high' },
    { overrideId: 'in_tiffin', functionId: 'cloud_kitchen', countryCode: 'IN', localLabel: 'Tiffin Service', aliases: ['tiffin', 'dabba'], regulationLevel: 'low' },
    { overrideId: 'in_sabzi', functionId: 'fresh_produce', countryCode: 'IN', localLabel: 'Sabzi Mandi', aliases: ['sabzi', 'vegetable vendor'], regulationLevel: 'low' },
    { overrideId: 'in_dharamshala', functionId: 'guest_houses', countryCode: 'IN', localLabel: 'Dharamshala / Guest House', aliases: ['dharamshala'], regulationLevel: 'low' },
    { overrideId: 'in_dhobi', functionId: 'laundry_drycleaning', countryCode: 'IN', localLabel: 'Dhobi / Laundry', aliases: ['dhobi', 'ironing'], regulationLevel: 'low' },

    // ==========================================
    // 🇺🇸 UNITED STATES
    // ==========================================
    { overrideId: 'us_cpa', functionId: 'accounting_tax', countryCode: 'US', localLabel: 'CPA Firm', aliases: ['cpa', 'certified public accountant'], regulationLevel: 'high' },
    { overrideId: 'us_lender', functionId: 'alternative_lending', countryCode: 'US', localLabel: 'Private Lender', aliases: ['private lender', 'hard money'], regulationLevel: 'high' },
    { overrideId: 'us_credit', functionId: 'credit_debt', countryCode: 'US', localLabel: 'Credit Repair Agency', aliases: ['credit repair', 'debt settlement'], regulationLevel: 'medium' },
    { overrideId: 'us_payment', functionId: 'payments_processing', countryCode: 'US', localLabel: 'Payment Processor', aliases: ['stripe', 'square', 'merchant services'], regulationLevel: 'high' },
    { overrideId: 'us_sat', functionId: 'test_preparation', countryCode: 'US', localLabel: 'SAT / ACT Prep', aliases: ['sat prep', 'act prep', 'college prep'], regulationLevel: 'low' },
    { overrideId: 'us_housing', functionId: 'shared_accommodation', countryCode: 'US', localLabel: 'Student Housing', aliases: ['dorm', 'off-campus housing'], regulationLevel: 'low' },
    { overrideId: 'us_daycare', functionId: 'early_childhood', countryCode: 'US', localLabel: 'Daycare Center', aliases: ['daycare', 'preschool'], regulationLevel: 'medium' },
    { overrideId: 'us_urgent', functionId: 'primary_care', countryCode: 'US', localLabel: 'Urgent Care', aliases: ['urgent care', 'walk-in clinic'], regulationLevel: 'high' },
    { overrideId: 'us_maid', functionId: 'cleaning_housekeeping', countryCode: 'US', localLabel: 'Maid Service', aliases: ['maid service', 'house cleaning'], regulationLevel: 'low' },
    { overrideId: 'us_smart', functionId: 'home_automation', countryCode: 'US', localLabel: 'Smart Home Services', aliases: ['smart home', 'alexa', 'nest'], regulationLevel: 'low' },
    { overrideId: 'us_cvs', functionId: 'pharmacy_retail', countryCode: 'US', localLabel: 'Pharmacy / Drugstore', aliases: ['cvs', 'walgreens', 'drugstore'], regulationLevel: 'high' },

    // ==========================================
    // 🇬🇧 UNITED KINGDOM
    // ==========================================
    { overrideId: 'gb_ca', functionId: 'accounting_tax', countryCode: 'GB', localLabel: 'Chartered Accountant', aliases: ['aca', 'acca', 'cima'], regulationLevel: 'high' },
    { overrideId: 'gb_broker', functionId: 'consumer_lending', countryCode: 'GB', localLabel: 'Loan Broker', aliases: ['mortgage broker', 'finance broker'], regulationLevel: 'high' },
    { overrideId: 'gb_ifa', functionId: 'insurance_brokerage', countryCode: 'GB', localLabel: 'Insurance Adviser', aliases: ['ifa', 'insurance broker'], regulationLevel: 'high' },
    { overrideId: 'gb_gcse', functionId: 'test_preparation', countryCode: 'GB', localLabel: 'GCSE / A-Level Prep', aliases: ['gcse', 'a-level', 'sixth form'], regulationLevel: 'low' },
    { overrideId: 'gb_halls', functionId: 'shared_accommodation', countryCode: 'GB', localLabel: 'Student Halls', aliases: ['halls of residence'], regulationLevel: 'low' },
    { overrideId: 'gb_nursery', functionId: 'early_childhood', countryCode: 'GB', localLabel: 'Nursery / Childminder', aliases: ['nursery', 'childminder'], regulationLevel: 'medium' },
    { overrideId: 'gb_off', functionId: 'grocery_convenience', countryCode: 'GB', localLabel: 'Off-Licence / Corner Shop', aliases: ['off-licence', 'newsagent'], regulationLevel: 'low' },
    { overrideId: 'gb_chemist', functionId: 'pharmacy_retail', countryCode: 'GB', localLabel: 'Chemist / Pharmacy', aliases: ['boots', 'chemist'], regulationLevel: 'high' },
    { overrideId: 'gb_gp', functionId: 'primary_care', countryCode: 'GB', localLabel: 'GP Surgery', aliases: ['gp surgery', 'nhs'], regulationLevel: 'high' },
    { overrideId: 'gb_estate', functionId: 'real_estate', countryCode: 'GB', localLabel: 'Estate Agent', aliases: ['estate agent', 'lettings agent'], regulationLevel: 'medium' },

    // ==========================================
    // 🇦🇪 UAE
    // ==========================================
    { overrideId: 'ae_finance', functionId: 'alternative_lending', countryCode: 'AE', localLabel: 'Finance Company', aliases: ['islamic finance'], regulationLevel: 'high' },
    { overrideId: 'ae_exchange', functionId: 'forex_remittance', countryCode: 'AE', localLabel: 'Exchange House', aliases: ['money exchange', 'al ansari'], regulationLevel: 'high' },
    { overrideId: 'ae_takaful', functionId: 'insurance_brokerage', countryCode: 'AE', localLabel: 'Takaful / Insurance', aliases: ['takaful', 'insurance broker'], regulationLevel: 'high' },
    { overrideId: 'ae_property', functionId: 'real_estate', countryCode: 'AE', localLabel: 'Property Broker', aliases: ['rera registered'], regulationLevel: 'high' },
    { overrideId: 'ae_pro', functionId: 'notary_compliance', countryCode: 'AE', localLabel: 'PRO Services', aliases: ['typing center', 'amer'], regulationLevel: 'medium' },
    { overrideId: 'ae_hotel', functionId: 'serviced_apartments', countryCode: 'AE', localLabel: 'Hotel Apartments', aliases: ['aparthotel'], regulationLevel: 'medium' },
    { overrideId: 'ae_shawarma', functionId: 'qsr', countryCode: 'AE', localLabel: 'Shawarma / Cafeteria', aliases: ['shawarma', 'cafeteria'], regulationLevel: 'medium' },

    // ==========================================
    // 🇸🇦 SAUDI ARABIA
    // ==========================================
    { overrideId: 'sa_bank', functionId: 'retail_banking', countryCode: 'SA', localLabel: 'Islamic Bank', aliases: ['islamic banking', 'sharia compliant'], regulationLevel: 'high' },
    { overrideId: 'sa_takaful', functionId: 'insurance_brokerage', countryCode: 'SA', localLabel: 'Takaful Provider', aliases: ['takaful'], regulationLevel: 'high' },
    { overrideId: 'sa_maktab', functionId: 'tutoring', countryCode: 'SA', localLabel: 'Maktab / Tuition Center', aliases: ['maktab'], regulationLevel: 'low' },

    // ==========================================
    // 🇩🇪 GERMANY
    // ==========================================
    { overrideId: 'de_steuer', functionId: 'accounting_tax', countryCode: 'DE', localLabel: 'Steuerberater', aliases: ['tax advisor', 'steuerberater'], regulationLevel: 'high' },
    { overrideId: 'de_apotheke', functionId: 'pharmacy_retail', countryCode: 'DE', localLabel: 'Apotheke', aliases: ['apotheke', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'de_kita', functionId: 'early_childhood', countryCode: 'DE', localLabel: 'Kita / Kindergarten', aliases: ['kita', 'kindergarten'], regulationLevel: 'medium' },
    { overrideId: 'de_hausarzt', functionId: 'primary_care', countryCode: 'DE', localLabel: 'Hausarzt', aliases: ['hausarzt', 'family doctor'], regulationLevel: 'high' },
    { overrideId: 'de_makler', functionId: 'real_estate', countryCode: 'DE', localLabel: 'Immobilienmakler', aliases: ['makler', 'real estate agent'], regulationLevel: 'medium' },
    { overrideId: 'de_sparkasse', functionId: 'retail_banking', countryCode: 'DE', localLabel: 'Sparkasse / Bank', aliases: ['sparkasse', 'volksbank'], regulationLevel: 'high' },

    // ==========================================
    // 🇫🇷 FRANCE
    // ==========================================
    { overrideId: 'fr_expert', functionId: 'accounting_tax', countryCode: 'FR', localLabel: 'Expert-Comptable', aliases: ['expert comptable'], regulationLevel: 'high' },
    { overrideId: 'fr_pharmacie', functionId: 'pharmacy_retail', countryCode: 'FR', localLabel: 'Pharmacie', aliases: ['pharmacie'], regulationLevel: 'high' },
    { overrideId: 'fr_creche', functionId: 'early_childhood', countryCode: 'FR', localLabel: 'Crèche / Maternelle', aliases: ['creche', 'maternelle'], regulationLevel: 'medium' },
    { overrideId: 'fr_medecin', functionId: 'primary_care', countryCode: 'FR', localLabel: 'Médecin Généraliste', aliases: ['medecin', 'doctor'], regulationLevel: 'high' },
    { overrideId: 'fr_agence', functionId: 'real_estate', countryCode: 'FR', localLabel: 'Agence Immobilière', aliases: ['agence immobiliere'], regulationLevel: 'medium' },
    { overrideId: 'fr_tabac', functionId: 'grocery_convenience', countryCode: 'FR', localLabel: 'Tabac / Épicerie', aliases: ['tabac', 'epicerie'], regulationLevel: 'low' },

    // ==========================================
    // 🇪🇸 SPAIN
    // ==========================================
    { overrideId: 'es_gestor', functionId: 'accounting_tax', countryCode: 'ES', localLabel: 'Gestoría', aliases: ['gestoria', 'asesor fiscal'], regulationLevel: 'high' },
    { overrideId: 'es_farmacia', functionId: 'pharmacy_retail', countryCode: 'ES', localLabel: 'Farmacia', aliases: ['farmacia'], regulationLevel: 'high' },
    { overrideId: 'es_guarderia', functionId: 'early_childhood', countryCode: 'ES', localLabel: 'Guardería', aliases: ['guarderia'], regulationLevel: 'medium' },
    { overrideId: 'es_centro', functionId: 'primary_care', countryCode: 'ES', localLabel: 'Centro de Salud', aliases: ['centro de salud'], regulationLevel: 'high' },
    { overrideId: 'es_inmobiliaria', functionId: 'real_estate', countryCode: 'ES', localLabel: 'Inmobiliaria', aliases: ['inmobiliaria'], regulationLevel: 'medium' },

    // ==========================================
    // 🇮🇹 ITALY
    // ==========================================
    { overrideId: 'it_commercialista', functionId: 'accounting_tax', countryCode: 'IT', localLabel: 'Commercialista', aliases: ['commercialista'], regulationLevel: 'high' },
    { overrideId: 'it_farmacia', functionId: 'pharmacy_retail', countryCode: 'IT', localLabel: 'Farmacia', aliases: ['farmacia'], regulationLevel: 'high' },
    { overrideId: 'it_asilo', functionId: 'early_childhood', countryCode: 'IT', localLabel: 'Asilo Nido', aliases: ['asilo nido'], regulationLevel: 'medium' },
    { overrideId: 'it_medico', functionId: 'primary_care', countryCode: 'IT', localLabel: 'Medico di Base', aliases: ['medico di base'], regulationLevel: 'high' },
    { overrideId: 'it_agenzia', functionId: 'real_estate', countryCode: 'IT', localLabel: 'Agenzia Immobiliare', aliases: ['agenzia immobiliare'], regulationLevel: 'medium' },

    // ==========================================
    // 🇧🇷 BRAZIL
    // ==========================================
    { overrideId: 'br_contador', functionId: 'accounting_tax', countryCode: 'BR', localLabel: 'Contador', aliases: ['contador', 'contabilidade'], regulationLevel: 'high' },
    { overrideId: 'br_farmacia', functionId: 'pharmacy_retail', countryCode: 'BR', localLabel: 'Farmácia / Drogaria', aliases: ['farmacia', 'drogaria'], regulationLevel: 'high' },
    { overrideId: 'br_creche', functionId: 'early_childhood', countryCode: 'BR', localLabel: 'Creche', aliases: ['creche'], regulationLevel: 'medium' },
    { overrideId: 'br_ubs', functionId: 'primary_care', countryCode: 'BR', localLabel: 'UBS / Posto de Saúde', aliases: ['ubs', 'posto de saude'], regulationLevel: 'high' },
    { overrideId: 'br_imobiliaria', functionId: 'real_estate', countryCode: 'BR', localLabel: 'Imobiliária', aliases: ['imobiliaria'], regulationLevel: 'medium' },
    { overrideId: 'br_mercado', functionId: 'grocery_convenience', countryCode: 'BR', localLabel: 'Mercadinho / Mercearia', aliases: ['mercadinho', 'mercearia'], regulationLevel: 'low' },
    { overrideId: 'br_pix', functionId: 'payments_processing', countryCode: 'BR', localLabel: 'PIX / Pagamentos', aliases: ['pix', 'pagamento'], regulationLevel: 'high' },

    // ==========================================
    // 🇲🇽 MEXICO
    // ==========================================
    { overrideId: 'mx_contador', functionId: 'accounting_tax', countryCode: 'MX', localLabel: 'Contador Público', aliases: ['contador', 'cp'], regulationLevel: 'high' },
    { overrideId: 'mx_farmacia', functionId: 'pharmacy_retail', countryCode: 'MX', localLabel: 'Farmacia', aliases: ['farmacia similares'], regulationLevel: 'high' },
    { overrideId: 'mx_guarderia', functionId: 'early_childhood', countryCode: 'MX', localLabel: 'Guardería / CENDI', aliases: ['guarderia', 'cendi'], regulationLevel: 'medium' },
    { overrideId: 'mx_oxxo', functionId: 'grocery_convenience', countryCode: 'MX', localLabel: 'Tiendita / OXXO', aliases: ['oxxo', 'tiendita', 'abarrotes'], regulationLevel: 'low' },
    { overrideId: 'mx_taqueria', functionId: 'street_food', countryCode: 'MX', localLabel: 'Taquería', aliases: ['taqueria', 'antojitos'], regulationLevel: 'low' },

    // ==========================================
    // 🇦🇷 ARGENTINA
    // ==========================================
    { overrideId: 'ar_contador', functionId: 'accounting_tax', countryCode: 'AR', localLabel: 'Contador Público', aliases: ['contador'], regulationLevel: 'high' },
    { overrideId: 'ar_farmacia', functionId: 'pharmacy_retail', countryCode: 'AR', localLabel: 'Farmacia', aliases: ['farmacia'], regulationLevel: 'high' },
    { overrideId: 'ar_jardin', functionId: 'early_childhood', countryCode: 'AR', localLabel: 'Jardín de Infantes', aliases: ['jardin'], regulationLevel: 'medium' },
    { overrideId: 'ar_kiosco', functionId: 'grocery_convenience', countryCode: 'AR', localLabel: 'Kiosco / Almacén', aliases: ['kiosco', 'almacen'], regulationLevel: 'low' },

    // ==========================================
    // 🇨🇴 COLOMBIA
    // ==========================================
    { overrideId: 'co_contador', functionId: 'accounting_tax', countryCode: 'CO', localLabel: 'Contador Público', aliases: ['contador'], regulationLevel: 'high' },
    { overrideId: 'co_drogueria', functionId: 'pharmacy_retail', countryCode: 'CO', localLabel: 'Droguería', aliases: ['drogueria'], regulationLevel: 'high' },
    { overrideId: 'co_tienda', functionId: 'grocery_convenience', countryCode: 'CO', localLabel: 'Tienda de Barrio', aliases: ['tienda'], regulationLevel: 'low' },

    // ==========================================
    // 🇯🇵 JAPAN
    // ==========================================
    { overrideId: 'jp_zeirishi', functionId: 'accounting_tax', countryCode: 'JP', localLabel: '税理士 (Zeirishi)', aliases: ['zeirishi', 'tax accountant'], regulationLevel: 'high' },
    { overrideId: 'jp_yakkyoku', functionId: 'pharmacy_retail', countryCode: 'JP', localLabel: '薬局 (Yakkyoku)', aliases: ['yakkyoku', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'jp_hoikuen', functionId: 'early_childhood', countryCode: 'JP', localLabel: '保育園 (Hoikuen)', aliases: ['hoikuen', 'nursery'], regulationLevel: 'medium' },
    { overrideId: 'jp_konbini', functionId: 'grocery_convenience', countryCode: 'JP', localLabel: 'コンビニ (Konbini)', aliases: ['konbini', '7-eleven', 'lawson'], regulationLevel: 'low' },
    { overrideId: 'jp_juku', functionId: 'test_preparation', countryCode: 'JP', localLabel: '塾 (Juku)', aliases: ['juku', 'cram school'], regulationLevel: 'low' },
    { overrideId: 'jp_fudousan', functionId: 'real_estate', countryCode: 'JP', localLabel: '不動産 (Fudousan)', aliases: ['fudousan', 'real estate'], regulationLevel: 'medium' },

    // ==========================================
    // 🇰🇷 SOUTH KOREA
    // ==========================================
    { overrideId: 'kr_sesamu', functionId: 'accounting_tax', countryCode: 'KR', localLabel: '세무사 (Semusa)', aliases: ['semusa', 'tax accountant'], regulationLevel: 'high' },
    { overrideId: 'kr_yakguk', functionId: 'pharmacy_retail', countryCode: 'KR', localLabel: '약국 (Yakguk)', aliases: ['yakguk', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'kr_hagwon', functionId: 'test_preparation', countryCode: 'KR', localLabel: '학원 (Hagwon)', aliases: ['hagwon', 'academy'], regulationLevel: 'low' },
    { overrideId: 'kr_pyeonuijeom', functionId: 'grocery_convenience', countryCode: 'KR', localLabel: '편의점 (Pyeonuijeom)', aliases: ['pyeonuijeom', 'cu', 'gs25'], regulationLevel: 'low' },

    // ==========================================
    // 🇨🇳 CHINA
    // ==========================================
    { overrideId: 'cn_kuaiji', functionId: 'accounting_tax', countryCode: 'CN', localLabel: '会计事务所', aliases: ['kuaiji', 'accounting firm'], regulationLevel: 'high' },
    { overrideId: 'cn_yaodian', functionId: 'pharmacy_retail', countryCode: 'CN', localLabel: '药店 (Yaodian)', aliases: ['yaodian', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'cn_peixun', functionId: 'test_preparation', countryCode: 'CN', localLabel: '培训机构', aliases: ['peixun', 'training center'], regulationLevel: 'medium' },
    { overrideId: 'cn_bianlidian', functionId: 'grocery_convenience', countryCode: 'CN', localLabel: '便利店', aliases: ['bianlidian', 'convenience store'], regulationLevel: 'low' },
    { overrideId: 'cn_alipay', functionId: 'payments_processing', countryCode: 'CN', localLabel: '支付宝/微信支付', aliases: ['alipay', 'wechat pay'], regulationLevel: 'high' },

    // ==========================================
    // 🇸🇬 SINGAPORE
    // ==========================================
    { overrideId: 'sg_acra', functionId: 'accounting_tax', countryCode: 'SG', localLabel: 'ACRA Registered Firm', aliases: ['acra', 'cpa'], regulationLevel: 'high' },
    { overrideId: 'sg_childcare', functionId: 'early_childhood', countryCode: 'SG', localLabel: 'Childcare Centre', aliases: ['pap', 'childcare'], regulationLevel: 'medium' },
    { overrideId: 'sg_hdb', functionId: 'real_estate', countryCode: 'SG', localLabel: 'HDB / Property Agent', aliases: ['hdb', 'cea registered'], regulationLevel: 'high' },
    { overrideId: 'sg_hawker', functionId: 'street_food', countryCode: 'SG', localLabel: 'Hawker Stall', aliases: ['hawker'], regulationLevel: 'low' },
    { overrideId: 'sg_tuition', functionId: 'tutoring', countryCode: 'SG', localLabel: 'Tuition Centre', aliases: ['tuition', 'enrichment'], regulationLevel: 'low' },

    // ==========================================
    // 🇲🇾 MALAYSIA
    // ==========================================
    { overrideId: 'my_akauntan', functionId: 'accounting_tax', countryCode: 'MY', localLabel: 'Akauntan Bertauliah', aliases: ['akauntan', 'mia'], regulationLevel: 'high' },
    { overrideId: 'my_farmasi', functionId: 'pharmacy_retail', countryCode: 'MY', localLabel: 'Farmasi', aliases: ['farmasi', 'guardian'], regulationLevel: 'high' },
    { overrideId: 'my_tadika', functionId: 'early_childhood', countryCode: 'MY', localLabel: 'Tadika / Taska', aliases: ['tadika', 'taska'], regulationLevel: 'medium' },
    { overrideId: 'my_kedai', functionId: 'grocery_convenience', countryCode: 'MY', localLabel: 'Kedai Runcit', aliases: ['kedai runcit'], regulationLevel: 'low' },

    // ==========================================
    // 🇮🇩 INDONESIA
    // ==========================================
    { overrideId: 'id_akuntan', functionId: 'accounting_tax', countryCode: 'ID', localLabel: 'Kantor Akuntan', aliases: ['akuntan', 'kap'], regulationLevel: 'high' },
    { overrideId: 'id_apotek', functionId: 'pharmacy_retail', countryCode: 'ID', localLabel: 'Apotek', aliases: ['apotek'], regulationLevel: 'high' },
    { overrideId: 'id_paud', functionId: 'early_childhood', countryCode: 'ID', localLabel: 'PAUD / TK', aliases: ['paud', 'tk', 'taman kanak-kanak'], regulationLevel: 'medium' },
    { overrideId: 'id_warung', functionId: 'grocery_convenience', countryCode: 'ID', localLabel: 'Warung', aliases: ['warung', 'toko kelontong'], regulationLevel: 'low' },
    { overrideId: 'id_gopay', functionId: 'payments_processing', countryCode: 'ID', localLabel: 'GoPay / OVO / DANA', aliases: ['gopay', 'ovo', 'dana'], regulationLevel: 'high' },
    { overrideId: 'id_bimbel', functionId: 'test_preparation', countryCode: 'ID', localLabel: 'Bimbel', aliases: ['bimbel', 'bimbingan belajar'], regulationLevel: 'low' },

    // ==========================================
    // 🇹🇭 THAILAND
    // ==========================================
    { overrideId: 'th_accounting', functionId: 'accounting_tax', countryCode: 'TH', localLabel: 'สำนักงานบัญชี', aliases: ['accounting office'], regulationLevel: 'high' },
    { overrideId: 'th_raan', functionId: 'pharmacy_retail', countryCode: 'TH', localLabel: 'ร้านขายยา', aliases: ['pharmacy', 'boots'], regulationLevel: 'high' },
    { overrideId: 'th_711', functionId: 'grocery_convenience', countryCode: 'TH', localLabel: '7-Eleven / ร้านสะดวกซื้อ', aliases: ['7-eleven', 'mini mart'], regulationLevel: 'low' },
    { overrideId: 'th_tutor', functionId: 'tutoring', countryCode: 'TH', localLabel: 'โรงเรียนกวดวิชา', aliases: ['tutor', 'cram school'], regulationLevel: 'low' },

    // ==========================================
    // 🇻🇳 VIETNAM
    // ==========================================
    { overrideId: 'vn_ketoan', functionId: 'accounting_tax', countryCode: 'VN', localLabel: 'Công ty Kế toán', aliases: ['ke toan', 'accounting'], regulationLevel: 'high' },
    { overrideId: 'vn_nhathuoc', functionId: 'pharmacy_retail', countryCode: 'VN', localLabel: 'Nhà thuốc', aliases: ['nha thuoc', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'vn_mamnon', functionId: 'early_childhood', countryCode: 'VN', localLabel: 'Trường Mầm non', aliases: ['mam non', 'kindergarten'], regulationLevel: 'medium' },
    { overrideId: 'vn_taptap', functionId: 'grocery_convenience', countryCode: 'VN', localLabel: 'Tạp hóa', aliases: ['tap hoa', 'mini mart'], regulationLevel: 'low' },

    // ==========================================
    // 🇵🇭 PHILIPPINES
    // ==========================================
    { overrideId: 'ph_cpa', functionId: 'accounting_tax', countryCode: 'PH', localLabel: 'CPA Firm', aliases: ['cpa', 'bookkeeping'], regulationLevel: 'high' },
    { overrideId: 'ph_botika', functionId: 'pharmacy_retail', countryCode: 'PH', localLabel: 'Botika / Mercury Drug', aliases: ['botika', 'mercury drug'], regulationLevel: 'high' },
    { overrideId: 'ph_sari', functionId: 'grocery_convenience', countryCode: 'PH', localLabel: 'Sari-sari Store', aliases: ['sari-sari'], regulationLevel: 'low' },
    { overrideId: 'ph_review', functionId: 'test_preparation', countryCode: 'PH', localLabel: 'Review Center', aliases: ['review center', 'board exam prep'], regulationLevel: 'low' },

    // ==========================================
    // 🇳🇬 NIGERIA
    // ==========================================
    { overrideId: 'ng_ican', functionId: 'accounting_tax', countryCode: 'NG', localLabel: 'ICAN Chartered Accountant', aliases: ['ican', 'anan'], regulationLevel: 'high' },
    { overrideId: 'ng_pharmacy', functionId: 'pharmacy_retail', countryCode: 'NG', localLabel: 'Pharmacy / Chemist', aliases: ['chemist', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'ng_pos', functionId: 'payments_processing', countryCode: 'NG', localLabel: 'POS Agent', aliases: ['pos', 'mobile money'], regulationLevel: 'medium' },

    // ==========================================
    // 🇿🇦 SOUTH AFRICA
    // ==========================================
    { overrideId: 'za_ca', functionId: 'accounting_tax', countryCode: 'ZA', localLabel: 'CA(SA)', aliases: ['ca sa', 'saica'], regulationLevel: 'high' },
    { overrideId: 'za_chemist', functionId: 'pharmacy_retail', countryCode: 'ZA', localLabel: 'Pharmacy / Clicks', aliases: ['clicks', 'dischem'], regulationLevel: 'high' },
    { overrideId: 'za_spaza', functionId: 'grocery_convenience', countryCode: 'ZA', localLabel: 'Spaza Shop', aliases: ['spaza'], regulationLevel: 'low' },

    // ==========================================
    // 🇰🇪 KENYA
    // ==========================================
    { overrideId: 'ke_cpa', functionId: 'accounting_tax', countryCode: 'KE', localLabel: 'CPA Kenya', aliases: ['cpa', 'icpak'], regulationLevel: 'high' },
    { overrideId: 'ke_mpesa', functionId: 'payments_processing', countryCode: 'KE', localLabel: 'M-Pesa Agent', aliases: ['mpesa', 'mobile money'], regulationLevel: 'medium' },
    { overrideId: 'ke_duka', functionId: 'grocery_convenience', countryCode: 'KE', localLabel: 'Duka', aliases: ['duka', 'kiosk'], regulationLevel: 'low' },

    // ==========================================
    // 🇪🇬 EGYPT
    // ==========================================
    { overrideId: 'eg_mohaseb', functionId: 'accounting_tax', countryCode: 'EG', localLabel: 'محاسب قانوني', aliases: ['mohaseb', 'accountant'], regulationLevel: 'high' },
    { overrideId: 'eg_saydaliya', functionId: 'pharmacy_retail', countryCode: 'EG', localLabel: 'صيدلية', aliases: ['saydaliya', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'eg_bakal', functionId: 'grocery_convenience', countryCode: 'EG', localLabel: 'بقالة', aliases: ['bakal', 'grocery'], regulationLevel: 'low' },

    // ==========================================
    // 🇹🇷 TURKEY
    // ==========================================
    { overrideId: 'tr_muhasebe', functionId: 'accounting_tax', countryCode: 'TR', localLabel: 'Muhasebe Bürosu', aliases: ['muhasebe', 'smmm'], regulationLevel: 'high' },
    { overrideId: 'tr_eczane', functionId: 'pharmacy_retail', countryCode: 'TR', localLabel: 'Eczane', aliases: ['eczane', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'tr_bakkal', functionId: 'grocery_convenience', countryCode: 'TR', localLabel: 'Bakkal / Market', aliases: ['bakkal', 'market'], regulationLevel: 'low' },
    { overrideId: 'tr_dershane', functionId: 'test_preparation', countryCode: 'TR', localLabel: 'Dershane', aliases: ['dershane', 'kurs'], regulationLevel: 'low' },

    // ==========================================
    // 🇵🇰 PAKISTAN
    // ==========================================
    { overrideId: 'pk_ca', functionId: 'accounting_tax', countryCode: 'PK', localLabel: 'Chartered Accountant', aliases: ['icap', 'ca'], regulationLevel: 'high' },
    { overrideId: 'pk_davakhana', functionId: 'pharmacy_retail', countryCode: 'PK', localLabel: 'Medical Store / Davakhana', aliases: ['davakhana', 'chemist'], regulationLevel: 'high' },
    { overrideId: 'pk_academy', functionId: 'test_preparation', countryCode: 'PK', localLabel: 'Academy / Coaching', aliases: ['academy', 'tuition'], regulationLevel: 'low' },
    { overrideId: 'pk_kiryana', functionId: 'grocery_convenience', countryCode: 'PK', localLabel: 'Kiryana Store', aliases: ['kiryana', 'general store'], regulationLevel: 'low' },
    { overrideId: 'pk_easypaisa', functionId: 'payments_processing', countryCode: 'PK', localLabel: 'Easypaisa / JazzCash', aliases: ['easypaisa', 'jazzcash'], regulationLevel: 'medium' },

    // ==========================================
    // 🇧🇩 BANGLADESH
    // ==========================================
    { overrideId: 'bd_ca', functionId: 'accounting_tax', countryCode: 'BD', localLabel: 'Chartered Accountant', aliases: ['icab', 'ca'], regulationLevel: 'high' },
    { overrideId: 'bd_pharmacy', functionId: 'pharmacy_retail', countryCode: 'BD', localLabel: 'Pharmacy / Oushodh', aliases: ['pharmacy', 'oushodh'], regulationLevel: 'high' },
    { overrideId: 'bd_coaching', functionId: 'test_preparation', countryCode: 'BD', localLabel: 'Coaching Centre', aliases: ['coaching', 'tuition'], regulationLevel: 'low' },
    { overrideId: 'bd_dokan', functionId: 'grocery_convenience', countryCode: 'BD', localLabel: 'Dokan', aliases: ['dokan', 'grocery'], regulationLevel: 'low' },
    { overrideId: 'bd_bkash', functionId: 'payments_processing', countryCode: 'BD', localLabel: 'bKash / Nagad', aliases: ['bkash', 'nagad'], regulationLevel: 'medium' },

    // ==========================================
    // 🇦🇺 AUSTRALIA
    // ==========================================
    { overrideId: 'au_cpa', functionId: 'accounting_tax', countryCode: 'AU', localLabel: 'CPA / CA', aliases: ['cpa australia', 'chartered accountant'], regulationLevel: 'high' },
    { overrideId: 'au_chemist', functionId: 'pharmacy_retail', countryCode: 'AU', localLabel: 'Chemist Warehouse', aliases: ['chemist warehouse', 'priceline'], regulationLevel: 'high' },
    { overrideId: 'au_childcare', functionId: 'early_childhood', countryCode: 'AU', localLabel: 'Childcare Centre', aliases: ['childcare', 'daycare'], regulationLevel: 'medium' },
    { overrideId: 'au_gp', functionId: 'primary_care', countryCode: 'AU', localLabel: 'GP / Medical Centre', aliases: ['gp', 'bulk billing'], regulationLevel: 'high' },
    { overrideId: 'au_rea', functionId: 'real_estate', countryCode: 'AU', localLabel: 'Real Estate Agent', aliases: ['rea', 'domain'], regulationLevel: 'medium' },

    // ==========================================
    // 🇳🇿 NEW ZEALAND
    // ==========================================
    { overrideId: 'nz_ca', functionId: 'accounting_tax', countryCode: 'NZ', localLabel: 'Chartered Accountant', aliases: ['caanz'], regulationLevel: 'high' },
    { overrideId: 'nz_pharmacy', functionId: 'pharmacy_retail', countryCode: 'NZ', localLabel: 'Pharmacy', aliases: ['chemist warehouse', 'life pharmacy'], regulationLevel: 'high' },
    { overrideId: 'nz_ece', functionId: 'early_childhood', countryCode: 'NZ', localLabel: 'ECE Centre', aliases: ['ece', 'kindy'], regulationLevel: 'medium' },

    // ==========================================
    // 🇨🇦 CANADA
    // ==========================================
    { overrideId: 'ca_cpa', functionId: 'accounting_tax', countryCode: 'CA', localLabel: 'CPA Canada', aliases: ['cpa', 'chartered professional accountant'], regulationLevel: 'high' },
    { overrideId: 'ca_shoppers', functionId: 'pharmacy_retail', countryCode: 'CA', localLabel: 'Pharmacy / Shoppers', aliases: ['shoppers drug mart', 'rexall'], regulationLevel: 'high' },
    { overrideId: 'ca_daycare', functionId: 'early_childhood', countryCode: 'CA', localLabel: 'Daycare / Garderie', aliases: ['daycare', 'garderie'], regulationLevel: 'medium' },
    { overrideId: 'ca_walkin', functionId: 'primary_care', countryCode: 'CA', localLabel: 'Walk-in Clinic', aliases: ['walk-in clinic', 'family doctor'], regulationLevel: 'high' },

    // ==========================================
    // 🇷🇺 RUSSIA
    // ==========================================
    { overrideId: 'ru_buhgalter', functionId: 'accounting_tax', countryCode: 'RU', localLabel: 'Бухгалтерия', aliases: ['buhgalter', 'accountant'], regulationLevel: 'high' },
    { overrideId: 'ru_apteka', functionId: 'pharmacy_retail', countryCode: 'RU', localLabel: 'Аптека', aliases: ['apteka', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'ru_detskiy', functionId: 'early_childhood', countryCode: 'RU', localLabel: 'Детский сад', aliases: ['detskiy sad', 'kindergarten'], regulationLevel: 'medium' },
    { overrideId: 'ru_magazin', functionId: 'grocery_convenience', countryCode: 'RU', localLabel: 'Магазин', aliases: ['magazin', 'pyaterochka'], regulationLevel: 'low' },

    // ==========================================
    // 🇵🇱 POLAND
    // ==========================================
    { overrideId: 'pl_ksiegowosc', functionId: 'accounting_tax', countryCode: 'PL', localLabel: 'Biuro Księgowe', aliases: ['ksiegowosc', 'accounting'], regulationLevel: 'high' },
    { overrideId: 'pl_apteka', functionId: 'pharmacy_retail', countryCode: 'PL', localLabel: 'Apteka', aliases: ['apteka', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'pl_przedszkole', functionId: 'early_childhood', countryCode: 'PL', localLabel: 'Przedszkole / Żłobek', aliases: ['przedszkole', 'zlobek'], regulationLevel: 'medium' },
    { overrideId: 'pl_zabka', functionId: 'grocery_convenience', countryCode: 'PL', localLabel: 'Żabka / Sklep', aliases: ['zabka', 'sklep'], regulationLevel: 'low' },

    // ==========================================
    // 🇳🇱 NETHERLANDS
    // ==========================================
    { overrideId: 'nl_accountant', functionId: 'accounting_tax', countryCode: 'NL', localLabel: 'Accountantskantoor', aliases: ['accountant', 'boekhouder'], regulationLevel: 'high' },
    { overrideId: 'nl_apotheek', functionId: 'pharmacy_retail', countryCode: 'NL', localLabel: 'Apotheek', aliases: ['apotheek', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'nl_kinderdagverblijf', functionId: 'early_childhood', countryCode: 'NL', localLabel: 'Kinderdagverblijf', aliases: ['kinderdagverblijf', 'creche'], regulationLevel: 'medium' },
    { overrideId: 'nl_huisarts', functionId: 'primary_care', countryCode: 'NL', localLabel: 'Huisarts', aliases: ['huisarts', 'gp'], regulationLevel: 'high' },
    { overrideId: 'nl_makelaar', functionId: 'real_estate', countryCode: 'NL', localLabel: 'Makelaar', aliases: ['makelaar', 'real estate'], regulationLevel: 'medium' },

    // ==========================================
    // 🇧🇪 BELGIUM
    // ==========================================
    { overrideId: 'be_comptable', functionId: 'accounting_tax', countryCode: 'BE', localLabel: 'Comptable / Boekhouder', aliases: ['comptable', 'boekhouder'], regulationLevel: 'high' },
    { overrideId: 'be_pharmacie', functionId: 'pharmacy_retail', countryCode: 'BE', localLabel: 'Pharmacie / Apotheek', aliases: ['pharmacie', 'apotheek'], regulationLevel: 'high' },

    // ==========================================
    // 🇨🇭 SWITZERLAND
    // ==========================================
    { overrideId: 'ch_treuhand', functionId: 'accounting_tax', countryCode: 'CH', localLabel: 'Treuhand', aliases: ['treuhand', 'fiduciaire'], regulationLevel: 'high' },
    { overrideId: 'ch_apotheke', functionId: 'pharmacy_retail', countryCode: 'CH', localLabel: 'Apotheke / Pharmacie', aliases: ['apotheke', 'pharmacie'], regulationLevel: 'high' },
    { overrideId: 'ch_kita', functionId: 'early_childhood', countryCode: 'CH', localLabel: 'Kita / Crèche', aliases: ['kita', 'creche'], regulationLevel: 'medium' },

    // ==========================================
    // 🇦🇹 AUSTRIA
    // ==========================================
    { overrideId: 'at_steuerberater', functionId: 'accounting_tax', countryCode: 'AT', localLabel: 'Steuerberater', aliases: ['steuerberater'], regulationLevel: 'high' },
    { overrideId: 'at_apotheke', functionId: 'pharmacy_retail', countryCode: 'AT', localLabel: 'Apotheke', aliases: ['apotheke'], regulationLevel: 'high' },

    // ==========================================
    // 🇸🇪 SWEDEN
    // ==========================================
    { overrideId: 'se_redovisning', functionId: 'accounting_tax', countryCode: 'SE', localLabel: 'Redovisningsbyrå', aliases: ['redovisning', 'accounting'], regulationLevel: 'high' },
    { overrideId: 'se_apotek', functionId: 'pharmacy_retail', countryCode: 'SE', localLabel: 'Apotek', aliases: ['apotek', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'se_forskola', functionId: 'early_childhood', countryCode: 'SE', localLabel: 'Förskola', aliases: ['forskola', 'daycare'], regulationLevel: 'medium' },

    // ==========================================
    // 🇳🇴 NORWAY
    // ==========================================
    { overrideId: 'no_regnskap', functionId: 'accounting_tax', countryCode: 'NO', localLabel: 'Regnskapsbyrå', aliases: ['regnskap', 'accounting'], regulationLevel: 'high' },
    { overrideId: 'no_apotek', functionId: 'pharmacy_retail', countryCode: 'NO', localLabel: 'Apotek', aliases: ['apotek', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'no_barnehage', functionId: 'early_childhood', countryCode: 'NO', localLabel: 'Barnehage', aliases: ['barnehage', 'kindergarten'], regulationLevel: 'medium' },

    // ==========================================
    // 🇩🇰 DENMARK
    // ==========================================
    { overrideId: 'dk_revisor', functionId: 'accounting_tax', countryCode: 'DK', localLabel: 'Revisor', aliases: ['revisor', 'accountant'], regulationLevel: 'high' },
    { overrideId: 'dk_apotek', functionId: 'pharmacy_retail', countryCode: 'DK', localLabel: 'Apotek', aliases: ['apotek', 'pharmacy'], regulationLevel: 'high' },

    // ==========================================
    // 🇫🇮 FINLAND
    // ==========================================
    { overrideId: 'fi_tilitoimisto', functionId: 'accounting_tax', countryCode: 'FI', localLabel: 'Tilitoimisto', aliases: ['tilitoimisto', 'accounting'], regulationLevel: 'high' },
    { overrideId: 'fi_apteekki', functionId: 'pharmacy_retail', countryCode: 'FI', localLabel: 'Apteekki', aliases: ['apteekki', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'fi_paivakoti', functionId: 'early_childhood', countryCode: 'FI', localLabel: 'Päiväkoti', aliases: ['paivakoti', 'daycare'], regulationLevel: 'medium' },

    // ==========================================
    // 🇮🇪 IRELAND
    // ==========================================
    { overrideId: 'ie_cpa', functionId: 'accounting_tax', countryCode: 'IE', localLabel: 'Chartered Accountant', aliases: ['cpa ireland', 'acca'], regulationLevel: 'high' },
    { overrideId: 'ie_chemist', functionId: 'pharmacy_retail', countryCode: 'IE', localLabel: 'Chemist / Pharmacy', aliases: ['boots', 'lloyds'], regulationLevel: 'high' },
    { overrideId: 'ie_creche', functionId: 'early_childhood', countryCode: 'IE', localLabel: 'Crèche / Montessori', aliases: ['creche', 'montessori'], regulationLevel: 'medium' },

    // ==========================================
    // 🇵🇹 PORTUGAL
    // ==========================================
    { overrideId: 'pt_contabilista', functionId: 'accounting_tax', countryCode: 'PT', localLabel: 'Contabilista Certificado', aliases: ['contabilista', 'toc'], regulationLevel: 'high' },
    { overrideId: 'pt_farmacia', functionId: 'pharmacy_retail', countryCode: 'PT', localLabel: 'Farmácia', aliases: ['farmacia'], regulationLevel: 'high' },

    // ==========================================
    // 🇬🇷 GREECE
    // ==========================================
    { overrideId: 'gr_logistis', functionId: 'accounting_tax', countryCode: 'GR', localLabel: 'Λογιστής', aliases: ['logistis', 'accountant'], regulationLevel: 'high' },
    { overrideId: 'gr_farmakeio', functionId: 'pharmacy_retail', countryCode: 'GR', localLabel: 'Φαρμακείο', aliases: ['farmakeio', 'pharmacy'], regulationLevel: 'high' },

    // ==========================================
    // 🇮🇱 ISRAEL
    // ==========================================
    { overrideId: 'il_roeh', functionId: 'accounting_tax', countryCode: 'IL', localLabel: 'רואה חשבון', aliases: ['roeh heshbon', 'cpa'], regulationLevel: 'high' },
    { overrideId: 'il_beit', functionId: 'pharmacy_retail', countryCode: 'IL', localLabel: 'בית מרקחת', aliases: ['beit mirkachat', 'super-pharm'], regulationLevel: 'high' },
    { overrideId: 'il_gan', functionId: 'early_childhood', countryCode: 'IL', localLabel: 'גן ילדים', aliases: ['gan yeladim', 'kindergarten'], regulationLevel: 'medium' },
];

/**
 * Get overrides for a specific country
 */
export function getCountryOverrides(countryCode: CountryCode): CountryOverride[] {
    if (countryCode === 'GLOBAL' || !countryCode) return [];
    const normalized = normalizeCode(countryCode);
    return COUNTRY_OVERRIDES.filter(o => o.countryCode === normalized);
}

/**
 * Get override for a specific function in a country
 */
export function getFunctionOverride(functionId: string, countryCode: CountryCode): CountryOverride | undefined {
    if (countryCode === 'GLOBAL' || !countryCode) return undefined;
    const normalized = normalizeCode(countryCode);
    return COUNTRY_OVERRIDES.find(o => o.functionId === functionId && o.countryCode === normalized);
}

/**
 * Check if a country has any overrides defined
 */
export function hasCountryOverrides(countryCode: CountryCode): boolean {
    if (countryCode === 'GLOBAL' || !countryCode) return false;
    const normalized = normalizeCode(countryCode);
    return COUNTRY_OVERRIDES.some(o => o.countryCode === normalized);
}
