import AmptModel from 'ampt-model';

const listingSchema = {
    title: String,
    etsyLookup: String,
    line: String,
    description: String,
    coverPhoto: String,
    productsInListing: [{
        sku: String,
        qty: Number
    }],
    value: Number,
    price: Number,
    status: {
        type: String,
        enum: ['active', 'inactive']
    },
    sellers: [
        {
            name: {
                type: String,
                enum: ['etsy', 'ebay', 'amazon', 'walmart']
            },
            status: {
                type: String,
                enum: ['active', 'inactive']
            },
            listing_id: String,
            url: String
        }
    ],
    label1: 'title',
    label2: 'line',
    label3: 'status',
    label4: 'etsyLookup'

}

export default AmptModel('listings', listingSchema);