import useDb from './useDb';
import productLines from '../staticDb/productLinesDb';

const productsDb = useDb('products');
const listingsDb = useDb('listings');

const productsCollection = productsDb.getCollection();
const listings = listingsDb.getCollection('listings');

export default function useListings() {
    function calcListingValue(listing) {
        return listing.productsInListing.reduce((total, product) => 
            total + (getProduct(product.sku).price * product.qty), 0
        )
    }

    function findProduct(sku) {
        return productsCollection.items.find((p) => p.sku === sku);
    }

    function getProduct(sku) {
        return productsCollection.items.find(product => product.sku === sku);
    }

    function getListing(listingTitle) {
        return listings.items.find((l) => l.title === listingTitle);
    }

    function getListingCoverPhoto(listing) {
        if(listing.coverPhoto) {
            return listing.coverPhoto;
        }
        const mainProduct = getMainProduct(listing);
        const imageName = mainProduct.images[0];

        return `/images/${imageName}.webp`;
    }

    function getListingCoverPlaceholder(listing) {
        if(listing.coverPhoto) {
            return listing.coverPhoto;
        }
        const mainProduct = getMainProduct(listing);
        const imageName = mainProduct.images[0];

        return `/image/80/${imageName}.webp`;
    }

    function getMainSku(listing) {
        return listing?.productsInListing?.[0]?.sku; 
    }

    function getMainProduct(listing) {
        const mainSku = getMainSku(listing);
        return findProduct(mainSku)
    }

    function getProductLineData(listing) {
        const mainProduct = getMainProduct(listing);
        return productLines.find(pl => pl.line === mainProduct.line);  
    }

    function getListingDescription(listing) {
        if(listing.description) {
            return listing.description;
        }

        const { application } = getMainProduct(listing) || {};
        return application
    }

    return {
        calcListingValue,
        getListing,
        getListingCoverPhoto,
        getListingCoverPlaceholder,
        getMainSku,
        getMainProduct,
        getProductLineData,
        getListingDescription
    }
}