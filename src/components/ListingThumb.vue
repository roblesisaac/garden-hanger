<template>
    <div class="q-grid parent">
        <div v-if="showImage !== false" class="q-cell-1">
            <router-link :to="'/products/' + listing.title">
                <v-lazy-image 
                    :src="imagePath()"
                    :src-placeholder="imagePlaceholder()"
                    alt="Planter Hanger"
                />
                <!-- <img class="cover-photo" loading="lazy" :src="imagePath()" :alt="mainProduct.name"> -->
            </router-link>
        </div>
        <div class="q-cell-1 details">
            <router-link :to="'/products/' + listing.title">
            <h4 class="title"><span v-if="mainProduct.application">For</span> {{ mainProduct.application || mainProduct.title }}</h4>
            <small><b>Sku: </b>{{ listing.title.toUpperCase() }}</small>
            <br>
            <small v-if="mainProduct.features">*{{ mainProduct.features }}</small>
            <br>
            <b class="view-details" :to="'/products/' + listing.title">View Details »</b>
            </router-link>
        </div>
    </div>
    </template>
    
    <script setup>
    import { computed } from 'vue';
    import VLazyImage from "v-lazy-image";
    import useListings from '../composables/useListings';

    const { getMainProduct, getListingCoverPhoto, getListingCoverPlaceholder } = useListings();

    const props = defineProps({
        listing: Object,
        showImage: Boolean
    });

    const mainProduct = computed(() => {
        return getMainProduct(props.listing)
    });

    
    function imagePath() {
        return getListingCoverPhoto(props.listing);
    }

    function imagePlaceholder() {
        return getListingCoverPlaceholder(props.listing);
    }
    
    </script>
    
    <style scoped>
    img {
        width: 100%;
        border-radius: 5px 5px 0 0;
    
    }
    
    h4.title {
        font-family: Arial, sans-serif;
        font-weight: bold;
        color: #000;
    }
    
    .details {
        padding: 10px 15px;
    }
    
    .parent {
        height: 100%;
        background-color: #fff;
        border: 1px solid #ccc;
        box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
        border-radius: 5px;
    }
    .view-details {
        font-weight: bold;
    }
    </style>