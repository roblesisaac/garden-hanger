import { throwError } from './errors';

export function formatNumber(num, pad = 2) {
    try {
        return num.toString().padStart(pad, '0');
    } catch (error) {
        throwError(error);
    }
}

export function formatPrice(value, { toFixed = 2, thousands = true } = {}) {
    try {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numericValue)) {
            return 'Invalid Price';
        }
        
        let formatted = numericValue.toFixed(toFixed);
        
        if (thousands) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            formatted = parts.join('.');
        }
        
        return '$' + formatted;
    } catch (error) {
        throwError(error);
    }
}

export function proper(str) {
    try {
        if (!str) return '';

        if(typeof str !== 'string') {
            str = String(str);
        }
        
        return str.toLowerCase().replace(/\b(\w)/g, function(firstLetter) {
            return firstLetter.toUpperCase();
        });
    } catch (error) {
        throwError(error);
    }
}

export function formatDate(inputDate) { // outputs YYYY-MM-DD
    try {
        const date = new Date(inputDate);
        
        if (isNaN(date)) {
            throw new Error('Invalid date input');
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        throwError(error);
    }
}

export function formatDateFromId(id) {
    try {
        // First try to match the ISO date format from Etsy orders
        const isoMatch = id.match(/^\d{4}-\d{2}-\d{2}T/);
        if (isoMatch) {
            const date = new Date(id);
            if (!isNaN(date)) {
                return formatDateTime(date);
            }
        }

        // Fall back to existing ObjectId date parsing
        const matches = id.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/g);
        if (matches && matches.length > 0) {
            const dateString = matches[0].replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
            const date = new Date(dateString);
            return formatDateTime(date);
        }
        
        return "Invalid date";
    } catch (error) {
        console.error('Error formatting date:', error);
        return "Invalid date";
    }
}

function formatDateTime(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Convert to PST (UTC-8)
    const pstDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);
    
    const month = months[pstDate.getMonth()];
    const day = pstDate.getDate();
    const year = pstDate.getFullYear();
    
    const hours = pstDate.getHours().toString().padStart(2, '0');
    const minutes = pstDate.getMinutes().toString().padStart(2, '0');
    const seconds = pstDate.getSeconds().toString().padStart(2, '0');
    
    return `${month} ${day}, ${year} at ${hours}:${minutes}:${seconds} PST`;
}