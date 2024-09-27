import { params } from '@ampt/sdk';

const ENV_NAME = params('ENV_NAME');
const AMPT_URL = params('AMPT_URL');
const hostName = AMPT_URL.replace('https://', '');
const customDomain = params('CUSTOM_DOMAIN') || hostName;

const baseUrl = ENV_NAME === 'prod' ? `https://${customDomain}` : AMPT_URL;
const domain = ENV_NAME === 'prod' ? '.'+customDomain : '.'+hostName;

export default {
    CONTACT: {
        SITENAME: params('SITE_NAME'),
        SITE_URL: baseUrl,
        PHONE: params('CONTACT_PHONE'),
        EMAIL: params('CONTACT_EMAIL'),
        COMPANY: params('CONTACT_COMPANY'),
        SES_EMAIL: params('SES_EMAIL'),
        SES_USER: params('SES_USER'),
        SES_PASS: params('SES_PASS')
    },
    ADDRESS_ORIGIN: {
        name: params('SITE_NAME'),
        phone: params('CONTACT_PHONE'),
        email: params('CONTACT_EMAIL'),
        company: params('CONTACT_COMPANY'),
        street: params('ADDRESS_ORIGIN_STREET'),
        city: params('ADDRESS_ORIGIN_CITY'),
        state: 'CA',
        zipCode: params('ADDRESS_ORIGIN_ZIP')
    },
    APP_NAME: params('APP_NAME'),
    AMPT_URL,
    baseUrl,
    COUNTRY: 'US',
    CRYPT_IV: JSON.parse(params('CRYPT_IV')),
    CRYPT_KEY: JSON.parse(params('CRYPT_KEY')),
    CUSTOM_DOMAIN: customDomain,
    domain,
    ENV_NAME,
    FRIENDLY_NAME: params('FRIENDLY_NAME'),
    hostName,
    GoogleConfig: {
        clientID: params('GOOGLE_CLIENT_ID'),
        clientSecret: params('GOOGLE_CLIENT_SECRET'),
        callbackURL: `${baseUrl}/api/auth/google/callback`,
        passReqToCallback: true
    },
    RECAPTCHA_KEY: params('RECAPTCHA_SECRET_KEY'),
    RECAPTCHA_PUBLIC_KEY: params('RECAPTCHA_PUBLIC_KEY'),
    RSA_PRIVATE: params('RSA_PRIVATE').replace(/\\n/g, '\n'),
    RSA_PUBLIC: params('RSA_PUBLIC').replace(/\\n/g, '\n'),
    SESSION_ID: params('SESSION_ID'),
    SHIP: {
        SHIPPO_TEST: params('SHIPPO_TEST'),
        SHIPPO_PROD: params('SHIPPO_PROD'),
        EASYSHIP_PROD: params('EASYSHIP'),
        EASYSHIP_SAND: params('EASYSHIP_SAND'),
        EASYSHIP_SAND_PROD: params('EASYSHIP_SAND_PROD'),
        ZIP_CODE_BASE: params('ZIP_CODE_BASE'),
        SHIP_ENGINE_PROD: params('SHIP_ENGINE_PROD'),
        SHIP_ENGINE_SAND: params('SHIP_ENGINE_SANDBOX')
    },
    STRIPE: {
        PUBLIC: params('STRIPE_PUBLIC'),
        PRIVATE: params('STRIPE_PRIVATE'),
        PRIVATE_TEST: params('STRIPE_PRIVATE_TEST'),
        PUBLIC_TEST: params('STRIPE_PUBLIC_TEST'),
        // WHSEC_TEST: params('STRIPE_WHSEC_TEST') // webhook key
    },
    AUTH0_AUDIENCE: params('AUTH0_AUDIENCE'),
    AUTH0_ISSUER_BASE_URL: params('AUTH0_ISSUER_BASE_URL'),
    URL: `https://${customDomain}`
};