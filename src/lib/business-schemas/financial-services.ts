/**
 * Financial Services Category Schema
 * 
 * Complete schema definition for financial services businesses including:
 * - Retail Banking
 * - Alternative/Non-Bank Lending (NBFCs)
 * - Consumer & Commercial Lending
 * - Payments & Processing
 * - Wealth & Asset Management
 * - Insurance Brokerage
 * - Accounting & Tax Advisory
 * - Investment & Trading
 * - Foreign Exchange & Remittance
 * - Credit Advisory & Debt Services
 * - Fintech
 * - Community Savings Groups
 */

import { CategorySchema } from './types';

export const FINANCIAL_SERVICES_SCHEMA: CategorySchema = {
    schema_version: "1.0",
    category_id: "financial_services",
    category_label: "Financial Services",

    expertise_schema: {
        // =========================================
        // CORE IDENTITY
        // =========================================
        core_identity: {
            business_function: {
                type: "enum",
                required: true,
                label: "Business Type",
                options: [
                    { value: "retail_banking", label: "Retail Banking" },
                    { value: "alternative_lending", label: "Alternative Lending / NBFC" },
                    { value: "consumer_lending", label: "Consumer Lending" },
                    { value: "commercial_lending", label: "Commercial Lending" },
                    { value: "payments_processing", label: "Payments & Processing" },
                    { value: "wealth_management", label: "Wealth & Asset Management" },
                    { value: "insurance_brokerage", label: "Insurance Brokerage" },
                    { value: "accounting_tax", label: "Accounting & Tax Advisory" },
                    { value: "investment_trading", label: "Investment & Trading Services" },
                    { value: "forex_remittance", label: "Foreign Exchange & Remittance" },
                    { value: "credit_debt", label: "Credit Advisory & Debt Services" },
                    { value: "fintech", label: "Financial Technology (Fintech)" },
                    { value: "community_savings", label: "Community Savings Groups" }
                ]
            },
            sub_category_tags: {
                type: "multi_select",
                required: false,
                label: "Business Tags",
                options: [
                    { value: "retail_focused", label: "Retail/Individual Focused" },
                    { value: "sme_focused", label: "SME/MSME Focused" },
                    { value: "corporate_focused", label: "Corporate Focused" },
                    { value: "rural_focused", label: "Rural/Underbanked Focused" },
                    { value: "digital_first", label: "Digital First" },
                    { value: "branch_network", label: "Branch Network" },
                    { value: "agent_based", label: "Agent-Based" },
                    { value: "women_focused", label: "Women Focused" },
                    { value: "youth_focused", label: "Youth Focused" },
                    { value: "nri_focused", label: "NRI Focused" }
                ]
            }
        },

        // =========================================
        // LICENSE & REGULATORY
        // =========================================
        license_and_regulatory: {
            regulatory_body: {
                type: "enum",
                required: true,
                label: "Primary Regulatory Body",
                options: [
                    { value: "rbi", label: "Reserve Bank of India (RBI)" },
                    { value: "sebi", label: "Securities & Exchange Board (SEBI)" },
                    { value: "irdai", label: "Insurance Regulatory (IRDAI)" },
                    { value: "pfrda", label: "PFRDA (Pension Fund)" },
                    { value: "icai", label: "ICAI (Chartered Accountants)" },
                    { value: "multiple", label: "Multiple Regulators" },
                    { value: "state_rcs", label: "State Registrar / Cooperatives" },
                    { value: "none", label: "Not Directly Regulated" }
                ]
            },
            license_types: {
                type: "multi_select",
                required: false,
                label: "Licenses Held",
                options: [
                    // Banking
                    { value: "banking_license", label: "Banking License" },
                    { value: "payment_bank", label: "Payment Bank License" },
                    { value: "small_finance_bank", label: "Small Finance Bank" },
                    // NBFC
                    { value: "nbfc_nd", label: "NBFC (Non-Deposit)" },
                    { value: "nbfc_d", label: "NBFC (Deposit Taking)" },
                    { value: "nbfc_mfi", label: "NBFC-MFI (Microfinance)" },
                    { value: "nbfc_p2p", label: "NBFC-P2P Lending" },
                    // Investment
                    { value: "sebi_ria", label: "SEBI RIA (Registered Investment Adviser)" },
                    { value: "sebi_ra", label: "SEBI Research Analyst" },
                    { value: "sebi_broker", label: "SEBI Stock Broker" },
                    { value: "amfi_distributor", label: "AMFI Mutual Fund Distributor" },
                    // Insurance
                    { value: "irdai_agent", label: "IRDAI Insurance Agent" },
                    { value: "irdai_broker", label: "IRDAI Insurance Broker" },
                    { value: "irdai_corporate", label: "IRDAI Corporate Agent" },
                    // Payments
                    { value: "ppi_license", label: "PPI License (Prepaid Instruments)" },
                    { value: "pa_license", label: "Payment Aggregator License" },
                    { value: "bbps_agent", label: "BBPS Agent" },
                    // Forex
                    { value: "ad1_license", label: "AD-I (Authorized Dealer)" },
                    { value: "ad2_license", label: "AD-II (Limited Forex)" },
                    { value: "ffmc", label: "FFMC (Full-Fledged Money Changer)" },
                    // Professional
                    { value: "ca_firm", label: "Chartered Accountant Firm" },
                    { value: "cs_firm", label: "Company Secretary Firm" },
                    { value: "cma_firm", label: "Cost & Management Accountant" }
                ]
            },
            registration_numbers: {
                type: "object",
                required: false,
                label: "Registration Numbers",
                properties: {
                    rbi_registration: { type: "string", label: "RBI Registration No." },
                    sebi_registration: { type: "string", label: "SEBI Registration No." },
                    irdai_registration: { type: "string", label: "IRDAI Registration No." },
                    pan_number: { type: "string", label: "PAN Number" },
                    gstin: { type: "string", label: "GSTIN" }
                }
            }
        },

        // =========================================
        // PRODUCTS & SERVICES
        // =========================================
        products_and_services: {
            // LENDING PRODUCTS
            lending_products: {
                type: "multi_select",
                required: false,
                label: "Lending Products",
                condition: { field: "core_identity.business_function", includes: ["retail_banking", "alternative_lending", "consumer_lending", "commercial_lending"] },
                options: [
                    { value: "personal_loan", label: "Personal Loan" },
                    { value: "home_loan", label: "Home Loan / Mortgage" },
                    { value: "car_loan", label: "Car / Vehicle Loan" },
                    { value: "education_loan", label: "Education Loan" },
                    { value: "gold_loan", label: "Gold Loan" },
                    { value: "business_loan", label: "Business Loan" },
                    { value: "msme_loan", label: "MSME Loan" },
                    { value: "working_capital", label: "Working Capital Finance" },
                    { value: "invoice_financing", label: "Invoice Financing" },
                    { value: "microfinance", label: "Microfinance / Group Loans" },
                    { value: "line_of_credit", label: "Line of Credit" },
                    { value: "overdraft", label: "Overdraft Facility" },
                    { value: "credit_card", label: "Credit Card" },
                    { value: "bnpl", label: "Buy Now Pay Later (BNPL)" },
                    { value: "equipment_financing", label: "Equipment Financing" },
                    { value: "construction_finance", label: "Construction Finance" },
                    { value: "project_finance", label: "Project Finance" }
                ]
            },

            // DEPOSIT & SAVINGS
            deposit_products: {
                type: "multi_select",
                required: false,
                label: "Deposit & Savings Products",
                condition: { field: "core_identity.business_function", includes: ["retail_banking", "community_savings"] },
                options: [
                    { value: "savings_account", label: "Savings Account" },
                    { value: "current_account", label: "Current Account" },
                    { value: "fixed_deposit", label: "Fixed Deposit" },
                    { value: "recurring_deposit", label: "Recurring Deposit" },
                    { value: "nre_nro_account", label: "NRE/NRO Account" },
                    { value: "salary_account", label: "Salary Account" },
                    { value: "joint_account", label: "Joint Account" },
                    { value: "minor_account", label: "Minor Account" },
                    { value: "senior_citizen_fd", label: "Senior Citizen FD" },
                    { value: "savings_group", label: "Savings Group / Chit" }
                ]
            },

            // INVESTMENT PRODUCTS
            investment_products: {
                type: "multi_select",
                required: false,
                label: "Investment Products",
                condition: { field: "core_identity.business_function", includes: ["wealth_management", "investment_trading", "retail_banking"] },
                options: [
                    { value: "mutual_funds", label: "Mutual Funds" },
                    { value: "stocks_equities", label: "Stocks / Equities" },
                    { value: "bonds_debentures", label: "Bonds & Debentures" },
                    { value: "etfs", label: "ETFs" },
                    { value: "sip", label: "Systematic Investment Plan (SIP)" },
                    { value: "pms", label: "Portfolio Management Services (PMS)" },
                    { value: "aif", label: "Alternative Investment Funds (AIF)" },
                    { value: "nps", label: "National Pension System (NPS)" },
                    { value: "ppf", label: "PPF" },
                    { value: "sukanya_samriddhi", label: "Sukanya Samriddhi" },
                    { value: "sovereign_gold_bond", label: "Sovereign Gold Bonds" },
                    { value: "ipo_trading", label: "IPO Trading" },
                    { value: "derivatives", label: "Derivatives (F&O)" },
                    { value: "cryptocurrency", label: "Cryptocurrency" },
                    { value: "real_estate_investment", label: "Real Estate Investment" }
                ]
            },

            // INSURANCE PRODUCTS
            insurance_products: {
                type: "multi_select",
                required: false,
                label: "Insurance Products",
                condition: { field: "core_identity.business_function", includes: ["insurance_brokerage", "retail_banking"] },
                options: [
                    { value: "term_life", label: "Term Life Insurance" },
                    { value: "endowment", label: "Endowment Plans" },
                    { value: "ulip", label: "ULIPs" },
                    { value: "health_insurance", label: "Health Insurance" },
                    { value: "motor_insurance", label: "Motor Insurance" },
                    { value: "home_insurance", label: "Home Insurance" },
                    { value: "travel_insurance", label: "Travel Insurance" },
                    { value: "business_insurance", label: "Business Insurance" },
                    { value: "fire_insurance", label: "Fire Insurance" },
                    { value: "marine_insurance", label: "Marine Insurance" },
                    { value: "cyber_insurance", label: "Cyber Insurance" },
                    { value: "professional_liability", label: "Professional Liability" },
                    { value: "group_insurance", label: "Group Insurance" },
                    { value: "pension_annuity", label: "Pension & Annuity" }
                ]
            },

            // PAYMENT SERVICES
            payment_services: {
                type: "multi_select",
                required: false,
                label: "Payment Services",
                condition: { field: "core_identity.business_function", includes: ["payments_processing", "retail_banking", "fintech"] },
                options: [
                    { value: "upi_payments", label: "UPI Payments" },
                    { value: "payment_gateway", label: "Payment Gateway" },
                    { value: "pos_terminal", label: "POS Terminal" },
                    { value: "qr_code_payments", label: "QR Code Payments" },
                    { value: "neft_rtgs", label: "NEFT/RTGS" },
                    { value: "imps", label: "IMPS" },
                    { value: "debit_card", label: "Debit Card" },
                    { value: "prepaid_card", label: "Prepaid Cards / Wallets" },
                    { value: "aadhaar_pay", label: "Aadhaar Pay" },
                    { value: "bill_payments", label: "Bill Payments (BBPS)" },
                    { value: "mobile_recharge", label: "Mobile Recharge" },
                    { value: "dmt", label: "Domestic Money Transfer (DMT)" },
                    { value: "aeps", label: "AEPS (Aadhaar Banking)" },
                    { value: "merchant_acquiring", label: "Merchant Acquiring" }
                ]
            },

            // FOREX & REMITTANCE
            forex_services: {
                type: "multi_select",
                required: false,
                label: "Forex & Remittance Services",
                condition: { field: "core_identity.business_function", includes: ["forex_remittance", "retail_banking"] },
                options: [
                    { value: "inward_remittance", label: "Inward Remittance" },
                    { value: "outward_remittance", label: "Outward Remittance" },
                    { value: "foreign_currency", label: "Foreign Currency Exchange" },
                    { value: "forex_card", label: "Forex Card / Travel Card" },
                    { value: "wire_transfer", label: "Wire Transfer" },
                    { value: "money_transfer_operator", label: "Money Transfer Operator (MTO)" },
                    { value: "trade_finance", label: "Trade Finance / LC" }
                ]
            },

            // PROFESSIONAL SERVICES
            professional_services: {
                type: "multi_select",
                required: false,
                label: "Professional Services",
                condition: { field: "core_identity.business_function", includes: ["accounting_tax", "credit_debt"] },
                options: [
                    { value: "tax_filing", label: "Tax Filing (ITR)" },
                    { value: "gst_services", label: "GST Services" },
                    { value: "bookkeeping", label: "Bookkeeping" },
                    { value: "auditing", label: "Auditing" },
                    { value: "payroll", label: "Payroll Services" },
                    { value: "company_registration", label: "Company Registration" },
                    { value: "trademark_ip", label: "Trademark & IP" },
                    { value: "compliance", label: "Compliance Services" },
                    { value: "virtual_cfo", label: "Virtual CFO" },
                    { value: "credit_repair", label: "Credit Repair" },
                    { value: "debt_counseling", label: "Debt Counseling" },
                    { value: "credit_score", label: "Credit Score Services" },
                    { value: "debt_settlement", label: "Debt Settlement" },
                    { value: "collection_recovery", label: "Collection & Recovery" }
                ]
            }
        },

        // =========================================
        // CLIENT SEGMENTS
        // =========================================
        client_segments: {
            target_segments: {
                type: "multi_select",
                required: true,
                label: "Target Client Segments",
                options: [
                    { value: "salaried_individuals", label: "Salaried Individuals" },
                    { value: "self_employed", label: "Self-Employed / Professionals" },
                    { value: "small_business", label: "Small Business Owners" },
                    { value: "msme", label: "MSME / SME" },
                    { value: "startups", label: "Startups" },
                    { value: "large_corporate", label: "Large Corporates" },
                    { value: "hni", label: "High Net Worth Individuals (HNI)" },
                    { value: "uhni", label: "Ultra HNI" },
                    { value: "nri", label: "NRIs / PIOs" },
                    { value: "farmers", label: "Farmers / Agricultural" },
                    { value: "women_entrepreneurs", label: "Women Entrepreneurs" },
                    { value: "senior_citizens", label: "Senior Citizens" },
                    { value: "students", label: "Students" },
                    { value: "government_employees", label: "Government Employees" },
                    { value: "underbanked", label: "Underbanked / Unbanked" }
                ]
            },
            sector_focus: {
                type: "multi_select",
                required: false,
                label: "Industry/Sector Focus",
                options: [
                    { value: "retail_trade", label: "Retail & Trade" },
                    { value: "manufacturing", label: "Manufacturing" },
                    { value: "construction", label: "Construction & Real Estate" },
                    { value: "healthcare", label: "Healthcare" },
                    { value: "education", label: "Education" },
                    { value: "hospitality", label: "Hospitality & Tourism" },
                    { value: "transportation", label: "Transportation & Logistics" },
                    { value: "agriculture", label: "Agriculture & Allied" },
                    { value: "it_services", label: "IT & Technology" },
                    { value: "textiles", label: "Textiles & Apparel" },
                    { value: "food_processing", label: "Food Processing" },
                    { value: "export_import", label: "Export/Import" }
                ]
            },
            loan_amount_range: {
                type: "object",
                required: false,
                label: "Typical Ticket Size",
                properties: {
                    min_amount: { type: "currency", label: "Minimum Amount (₹)" },
                    max_amount: { type: "currency", label: "Maximum Amount (₹)" },
                    average_amount: { type: "currency", label: "Average Amount (₹)" }
                }
            }
        },

        // =========================================
        // SERVICE DELIVERY
        // =========================================
        service_delivery: {
            delivery_channels: {
                type: "multi_select",
                required: true,
                label: "Service Delivery Channels",
                options: [
                    { value: "branch_office", label: "Branch / Office" },
                    { value: "mobile_app", label: "Mobile App" },
                    { value: "website_portal", label: "Website / Portal" },
                    { value: "whatsapp", label: "WhatsApp Banking" },
                    { value: "phone_banking", label: "Phone Banking" },
                    { value: "atm", label: "ATM Network" },
                    { value: "csc_agent", label: "CSC / Agent Network" },
                    { value: "doorstep", label: "Doorstep Service" },
                    { value: "video_banking", label: "Video Banking" }
                ]
            },
            turnaround_time: {
                type: "object",
                required: false,
                label: "Service Turnaround",
                properties: {
                    loan_approval: { type: "string", label: "Loan Approval Time" },
                    account_opening: { type: "string", label: "Account Opening Time" },
                    kyc_verification: { type: "string", label: "KYC Verification Time" },
                    disbursement: { type: "string", label: "Disbursement Time" }
                }
            },
            digital_capabilities: {
                type: "multi_select",
                required: false,
                label: "Digital Capabilities",
                options: [
                    { value: "video_kyc", label: "Video KYC" },
                    { value: "aadhaar_based_kyc", label: "Aadhaar-based eKYC" },
                    { value: "esign", label: "eSign / Digital Signature" },
                    { value: "instant_approval", label: "Instant/AI-based Approval" },
                    { value: "paperless_process", label: "Paperless Processing" },
                    { value: "api_integration", label: "API Integration" },
                    { value: "whatsapp_service", label: "WhatsApp Service" },
                    { value: "chatbot", label: "AI Chatbot" },
                    { value: "mobile_banking", label: "Mobile Banking" }
                ]
            }
        },

        // =========================================
        // PRICING & FEES
        // =========================================
        pricing_and_fees: {
            fee_structure: {
                type: "multi_select",
                required: false,
                label: "Fee Structure",
                options: [
                    { value: "processing_fee", label: "Processing Fee" },
                    { value: "annual_maintenance", label: "Annual Maintenance Charges" },
                    { value: "flat_fee", label: "Flat Fee per Transaction" },
                    { value: "percentage_fee", label: "Percentage-based Fee" },
                    { value: "subscription", label: "Subscription Model" },
                    { value: "success_fee", label: "Success Fee" },
                    { value: "retainer", label: "Retainer Model" },
                    { value: "hourly_billing", label: "Hourly Billing" },
                    { value: "no_hidden_charges", label: "No Hidden Charges" }
                ]
            },
            interest_rate_type: {
                type: "enum",
                required: false,
                label: "Interest Rate Type",
                condition: { field: "core_identity.business_function", includes: ["retail_banking", "alternative_lending", "consumer_lending", "commercial_lending"] },
                options: [
                    { value: "fixed", label: "Fixed Rate" },
                    { value: "floating", label: "Floating Rate" },
                    { value: "hybrid", label: "Hybrid" }
                ]
            },
            interest_rate_range: {
                type: "object",
                required: false,
                label: "Interest Rate Range",
                properties: {
                    min_rate: { type: "number", label: "Minimum Rate (%)" },
                    max_rate: { type: "number", label: "Maximum Rate (%)" }
                }
            }
        },

        // =========================================
        // TRUST & COMPLIANCE
        // =========================================
        trust_and_compliance: {
            certifications: {
                type: "multi_select",
                required: false,
                label: "Certifications & Memberships",
                options: [
                    { value: "iso_27001", label: "ISO 27001 (Security)" },
                    { value: "isae_3402", label: "ISAE 3402 / SOC" },
                    { value: "pci_dss", label: "PCI-DSS Compliant" },
                    { value: "crisil_rated", label: "CRISIL Rated" },
                    { value: "icra_rated", label: "ICRA Rated" },
                    { value: "care_rated", label: "CARE Rated" },
                    { value: "amfi_member", label: "AMFI Member" },
                    { value: "nse_member", label: "NSE Member" },
                    { value: "bse_member", label: "BSE Member" },
                    { value: "sa_mfi", label: "Sa-Dhan / MFIN Member" }
                ]
            },
            data_security: {
                type: "multi_select",
                required: false,
                label: "Data Security Measures",
                options: [
                    { value: "encrypted_data", label: "Encrypted Data Storage" },
                    { value: "2fa", label: "Two-Factor Authentication" },
                    { value: "biometric", label: "Biometric Security" },
                    { value: "fraud_detection", label: "Fraud Detection System" },
                    { value: "audit_logs", label: "Audit Logging" },
                    { value: "data_center", label: "Tier-3 Data Center" },
                    { value: "gdpr_compliant", label: "GDPR Compliant" }
                ]
            },
            credit_rating: {
                type: "object",
                required: false,
                label: "Credit Rating",
                properties: {
                    rating: { type: "string", label: "Rating" },
                    agency: { type: "string", label: "Rating Agency" },
                    last_updated: { type: "timestamp", label: "Last Updated" }
                }
            }
        },

        // =========================================
        // LLM USAGE CONTEXT
        // =========================================
        llm_usage_context: {
            allowed_topics: [
                "products_services",
                "eligibility",
                "interest_rates",
                "fee_structure",
                "documentation_required",
                "process_timelines",
                "branch_locations",
                "contact_information",
                "account_types"
            ],
            restricted_topics: [
                "guaranteed_returns",
                "tax_advice_without_disclaimer",
                "specific_investment_recommendations",
                "confidential_client_data",
                "competitor_comparisons",
                "unofficial_discounts"
            ],
            response_style: {
                tone: "professional_trustworthy",
                verbosity: "medium",
                upsell_allowed: true
            },
            response_rules: {
                always_add_disclaimers: true,
                never_guarantee_approvals: true,
                reference_terms_conditions: true
            }
        }
    }
};

export default FINANCIAL_SERVICES_SCHEMA;
