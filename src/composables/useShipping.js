import useApi from './useApi';
import useDb from './useDb';
import { useCartStore } from '../stores/cartStore';
import { isValidZipCode } from '../utils/validation';

const useBoxes = useDb('boxes');
const productDb = useDb('products');
const products = productDb.getCollection();

const { post } = useApi();
const boxesDb = useBoxes.getCollection();

export default function useShipping() {
    function calculateBoxDimensions(itemsInShipment) {
        const units = [];
        let totalWeight = 0;
    
        itemsInShipment.forEach(item => {
            const { length, width, height, weight } = item.dimensions;
            const { qty: totalUnits } = item;
    
            for (let i = 0; i < totalUnits; i++) {
                units.push({ length, width, height, weight, sku: item.sku, qty: 1 });
                totalWeight += weight;
            }
        });
    
        units.sort((a, b) => (b.length * b.width * b.height) - (a.length * a.width * a.height));
    
        let dimensions = {
            length: 0,
            width: 0,
            height: 0
        };
    
        units.forEach(unit => {
            dimensions.length = Math.max(dimensions.length, unit.length);
            dimensions.width = Math.max(dimensions.width, unit.width);
            dimensions.height += unit.height;
        });
    
        return {
            dimensions,
            totalWeight,
            units
        };
    }

    function calculatePackagingWeight(itemsLength) {
        const baseWeight = 1.1;
        const weightPerItem = 0.22;        
        const additionalWeight = itemsLength * weightPerItem;
    
        return baseWeight + additionalWeight;
    }

    async function createShipment(shippingAddress, shippingOption, provider) {
        try {
            const body = {
                address: shippingAddress,
                boxes: shippingOption.boxes,
                weight: shippingOption.totalWeight
            };

            const shipments = await post(`/shipping/create/shipment/${provider}`, body);
            return shipments;
        } catch (err) {
            console.error('Error in useShipping.createShipment:', err);
            throw err;
        }
    }

    function findProduct(sku) {
        return products.items.find(p => p.sku === sku);
    }

    function formatItemsForShipmentCreation(cartItems) {
        const itemsInShipment = [];
  
        for (const listing of cartItems) {
            for (const productInListing of listing.productsInListing) {
                const product = { ...findProduct(productInListing.sku) };
                const { height, length, weight, width } = product.dimensions;
  
                itemsInShipment.push({
                    sku: product.sku,
                    dimensions: {
                        height, length, weight, width
                    },
                    qty: listing.qty * productInListing.qty
                });
            }
        }
  
        return itemsInShipment;
    }

    function findIdealBox(boxDimensions, predefinedBoxes) {
        const sortedBoxes = [...predefinedBoxes].sort((a, b) => 
            (a.length * a.width * a.height) - (b.length * b.width * b.height)
        );

        for (const box of sortedBoxes) {
            if (
                boxDimensions.length <= box.length &&
                boxDimensions.width <= box.width &&
                boxDimensions.height <= box.height
            ) {
                return box;
            }
        }
        
        return {
            length: boxDimensions.length,
            width: boxDimensions.width,
            height: boxDimensions.height,
            isAvailable: false
        };
    }

    function packItemsIntoBoxes(units, availableBoxes) {
        const packedBoxes = [];
        let currentBox = null;
        let remainingSpace = { length: 0, width: 0, height: 0 };
        let totalWeightOfAllBoxes = 0;

        for (const item of units) {
            if (!currentBox || 
                item.length > remainingSpace.length || 
                item.width > remainingSpace.width || 
                item.height > remainingSpace.height) {
                
                if (currentBox) {
                    packedBoxes.push(currentBox);
                    totalWeightOfAllBoxes += currentBox.totalWeight;
                }
                
                currentBox = availableBoxes.find(box => 
                    item.length <= box.length &&
                    item.width <= box.width &&
                    item.height <= box.height
                );

                if (!currentBox) {
                    return {
                        isAvailable: false,
                        message: 'No suitable box found for shipment'
                    }
                }

                remainingSpace = { ...currentBox };
                currentBox = { ...currentBox, items: [], totalWeight: 1.1 };
            }

            const existingItem = currentBox.items.find(boxItem => boxItem.sku === item.sku);

            if (existingItem) {
                existingItem.qty += 1;
            } else {
                currentBox.items.push({ ...item, qty: 1 });
            }

            currentBox.totalWeight += item.weight + 0.22;
            remainingSpace.height -= item.height;
        }

        if (currentBox && currentBox.items.length > 0) {
            packedBoxes.push(currentBox);
            totalWeightOfAllBoxes += currentBox.totalWeight;
        }

        return { packedBoxes, totalWeightOfAllBoxes };
    }

    async function getShippingOptions(items) {
        items = items || useCartStore().items;

        const itemsInShipment = formatItemsForShipmentCreation(items);
        const { dimensions, totalWeight, units } = calculateBoxDimensions(itemsInShipment);

        await waitForBoxesDb();

        const idealBox = findIdealBox(dimensions, boxesDb.items);
        const { packedBoxes, totalWeightOfAllBoxes } = packItemsIntoBoxes(units, boxesDb.items);
        const totalWeightCalc = Number(totalWeight + calculatePackagingWeight(units.length))

        const shippingOptions = {
            idealOption: {
                boxes: [{
                    ...idealBox,
                    items: units,
                    totalWeight: totalWeightCalc
                }],
                totalWeight: totalWeightCalc
            },
            availableOption: {
                boxes: packedBoxes,
                totalWeight: Number(totalWeightOfAllBoxes || 0)
            }
        };

        return shippingOptions;
    }

    async function fetchEstimate(zipCode, items) {
        try {
            items = items || useCartStore().items;
            zipCode = String(zipCode);

            if(zipCode.length < 5) {
                return {};
            }

            const shipmentOptions = await getShippingOptions(items);
            const { boxes, totalWeight } = shipmentOptions.availableOption;
    
            const body = { 
                zipCode,
                boxes,
                weight: totalWeight
            };
        
            const lowestRate = await post('shipping/rates/estimate', body);    
            return lowestRate || {};
        } catch (err) {
            console.error('Error in useShipping.fetchEstimate:', err);
            throw err;
        }
    }

    async function purchaseLabel(orderId, rateId, provider) {
        try {
            const purchasedLabel = await post(`shipping/purchase-label/${provider}`, { orderId, rateId });

            return purchasedLabel;
        } catch (err) {
            throw err;
        }
    }

    async function validateAddress(addressToValidate) {
        try {
            if(!isValidZipCode(addressToValidate.zipCode)) {
                throw new Error('Please fill out required fields');
            }

            const { street, city, state, zipCode } = addressToValidate;
    
            if (!street || !city || !state || !zipCode) {
                console.log('Missing required fields in addressToValidate:', addressToValidate)
                return false;
            }
    
            const validatedAddress = await post('/shipping/address/validate', addressToValidate);

            return validatedAddress;
        } catch (err) {
            console.error('Error in useShipping.validateAddress:', err);
            throw err;
        }
    }

    async function waitForBoxesDb() {
        while (boxesDb.isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    return {
        createShipment,
        getShippingOptions,
        fetchEstimate,
        purchaseLabel,
        validateAddress
    }
}