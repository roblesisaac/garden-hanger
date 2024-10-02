import fetch from 'node-fetch';
import config from '../../config/environment';

const API_BASE_URL = 'https://api.goshippo.com';

export async function createShipment(addressOrigin, addressDestination, shipment) {
    const formattedAddressOrigin = formatAddressForShipment(addressOrigin);
    const formattedAddressDestination = formatAddressForShipment(addressDestination);
    const formattedShipment = formatShipmentParcels(shipment);
    const endpoint = `${API_BASE_URL}/shipments`;
    const headers = getHeaders();

    const formattedBody = {
        address_from: formattedAddressOrigin,
        address_to: formattedAddressDestination,
        parcels: formattedShipment,
        async: false
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedBody),
    });

    try {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();

        return json;
    } catch (err) {
        console.log(err);
        return {};
    }
}

export async function fetchRates(addressOrigin, addressDestination, shipment) {
    const formattedAddressOrigin = formatAddressForShipment(addressOrigin);
    const formattedAddressDestination = formatAddressForShipment(addressDestination);
    const formattedShipment = formatShipmentParcels(shipment);
    const endpoint = `${API_BASE_URL}/shipments/`;
    const headers = getHeaders();

    const formattedRateBody = {
        address_from: formattedAddressOrigin,
        address_to: formattedAddressDestination,
        parcels: [formattedShipment],
        async: false
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedRateBody)
    });

    return await response.json();
}

export function normalizeRates(fetchedShipment) {
    fetchedShipment.rates = fetchedShipment.rates.map(rate => ({
        _id: rate.object_id,
        courier_name: rate.provider,
        price: parseFloat(rate.amount),
        delivered_by: rate.estimated_days 
          ? `${rate.estimated_days} days` 
          : "Delivery time not available",
        logo_url: rate.provider_image_200
    }));
}

export async function purchaseLabel(rateId) {
    const body = { 
        rate: rateId,
        label_file_type: 'PNG',
        async: false
    };

    const endpoint = `${API_BASE_URL}/transactions`;

    const purchasedLabel = await fetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });

    return await purchasedLabel.json();
}

export function labelHasError(purchasedLabel) {
    if(purchasedLabel.status === 'ERROR') {
        return purchasedLabel.messages.map(message => message.text).join(' ');
    }

    return false;
}

export function extractLabelUrls(purchasedLabel) {
    const { label_url, tracking_url_provider } = purchasedLabel;
    
    return {
        purchasedLabelUrl: label_url,
        trackingUrl: tracking_url_provider,
    }
}

export async function validateAddress(address) {
    const formattedAddress = formatAddressForValidation(address);
    const endpoint = `${API_BASE_URL}/v2/addresses`;
    const headers = getHeaders();

    const queryParams = new URLSearchParams(formattedAddress).toString();
    const url = `${endpoint}/validate?${queryParams}`;

    const response = await fetch(url, { headers });
    return await response.json();
}

function formatAddressForShipment(address) {
    return {
        name: address.name || address.customerName,
        company: address.company,
        street1: address.street,
        city: address.city,
        state: address.state,
        zip: address.zipCode,
        country: 'US',
        phone: address.phone || config.CONTACT.PHONE,
        email: address.email || config.CONTACT.EMAIL,
        is_residential: address.residential || true
    };
}

function formatAddressForValidation(address) {
    return {
        address_line_1: address.street,
        city_locality: address.city,
        state_province: address.state,
        postal_code: address.zipCode,
        country_code: 'US',
        organization: address.company || ''
    };
}

function formatShipmentParcels(shipment) {
    const { boxes } = shipment;

    return boxes.map(({ length, width, height, totalWeight }) => ({
        length,
        width,
        height,
        weight: totalWeight,
        distance_unit: 'in',
        mass_unit: 'lb'
    }));
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `ShippoToken ${config.SHIP.SHIPPO_PROD}`
    };
}