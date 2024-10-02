<template>
<div class="q-grid parent">
    <div class="q-cell-1">
        <h1>Our Products</h1>
    </div>
    <div class="q-cell-1">
        <ProductLine v-for="productLine in productLines" :key="productLine.line" :productLine="productLine" class="product-line" />
    </div>
</div>

</template>

<script setup>
import ProductLine from '../components/ProductLine.vue';

import productLines from '../staticDb/productLinesDb';
</script>

<style scoped>
h1 {
    text-align: center;
    text-decoration: underline;
}
.parent {
    padding: 50px 0;
    max-width: 1000px;
    margin: 0 auto;
}
.product-line {
    padding: 30px 0;
    border-bottom: 3px solid #ccc;    
}
</style>