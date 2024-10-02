import fetch from 'node-fetch';
import config from '../../config/environment';
import isProd from '../../utils/isProd';

const API_BASE_URL = 'https://api.easyship.com/2023-01';

export async function validateAddress(address) {
    const formattedAddress = formatAddressForApiRequest(address);
    const endpoint = `${API_BASE_URL}/addresses/validations`;
    const headers = getHeaders();

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedAddress)
    });

    return await response.json();
}

export async function fetchRates(addressOrigin, addressDestination, shipment) {
    const formattedAddressOrigin = formatAddressForApiRequest(addressOrigin);
    const formattedAddressDestination = formatAddressForApiRequest(addressDestination);
    const formattedShipment = formatShipmentParcels(shipment);
    const endpoint = `${API_BASE_URL}/rates`;
    const headers = getHeaders();

    const formattedRateBody = {
        origin_address: formattedAddressOrigin,
        destination_address: formattedAddressDestination,
        ...formattedShipment
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedRateBody)
    });

    const json = await response.json();

    return json;
}

export async function createShipment(addressOrigin, addressDestination, shipmentBoxes) {
    const formattedAddressOrigin = formatAddressForApiRequest(addressOrigin);
    const formattedAddressDestination = formatAddressForApiRequest(addressDestination);
    const formattedShipment = formatShipmentParcels(shipmentBoxes);
    const endpoint = `${API_BASE_URL}/shipments`;
    const headers = getHeaders();

    const formattedBody = {
        origin_address: formattedAddressOrigin,
        destination_address: formattedAddressDestination,
        ...formattedShipment
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedBody)
    });

    const jsonResponse = await response.json();
    const { shipment } = jsonResponse;

    return shipment;
}

export function normalizeRates(fetchedShipment) {
    fetchedShipment.rates = fetchedShipment.rates.map(rate => ({
        _id: rate.courier_id,
        courier_name: rate.courier_name,
        price: rate.total_charge,
        delivered_by: `${rate.min_delivery_time}-${rate.max_delivery_time} days`,
        logo_url: rate.courier_logo_url
    }));
}

function formatAddressForApiRequest(address) {
    return {
        contact_name: address.name || 'N/A',
        company_name: address.company || 'N/A',
        line_1: address.street,
        city: address.city,
        state: address.state,
        postal_code: String(address.zipCode),
        country_alpha2: 'US',
        contact_phone: address.phone || 'N/A',
        contact_email: address.email || 'test@gmail.com',
        residential: address.residential || false,
        replace_with_validation_result: true
    };
}

function formatShipmentParcels(shipment) {
    const { boxes } = shipment;
    return {
        shipping_settings: { units: { weight: 'lb', dimensions: 'in' } },
        insurance: { is_insured: true },
        incoterms: 'DDU',
        courier_selection: { show_courier_logo_url: true },
        parcels: boxes.map(box => ({
            box: {
                width: box.width,
                height: box.height,
                length: box.length
            },
            total_actual_weight: box.totalWeight + 1,
            items: formatItems(box.items)
        }))
    };
}

function formatItems(items) {
    if (!items) {
        return [{
            quantity: 1,
            declared_currency: 'USD',
            hs_code: '94038990',
            declared_customs_value: 1,
            description: 'Garden Hanger'
        }];
    }

    return items.map((item) => ({
        quantity: item.qty || 1,
        declared_currency: 'USD',
        hs_code: item.hs_code || '94038990',
        declared_customs_value: 1,
        dimensions: {
            length: item.length,
            width: item.width,
            height: item.height
        },
        sku: item.sku,
        actual_weight: item.weight,
        description: item.description || 'Garden Hanger'        
    }));
}

function getHeaders() {
    const authToken = isProd() ? config.SHIP.EASYSHIP_PROD : config.SHIP.EASYSHIP_SAND;

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };
}