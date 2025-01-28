<template>
    <div class="q-grid form">
      <div class="q-cell-1">
        <!-- Title -->
        <EditPropVue :data="listingDataLocal" prop="title" />

        <!-- Etsy Lookup -->
        <EditPropVue :data="listingDataLocal" prop="etsyLookup" />
        <!-- Line -->
        <EditPropVue :data="listingDataLocal" prop="line" />
  
        <!-- Description -->
        <EditPropVue :data="listingDataLocal" prop="description" type="textarea" />
  
        <!-- Total Value -->
        <EditPropVue :data="listingDataLocal" prop="value" type="number" />
  
        <!-- Price -->
        <EditPropVue :data="listingDataLocal" prop="price" type="number" />
  
        <!-- Status -->
        <EditPropVue :data="listingDataLocal" prop="status" :options="['active', 'inactive']" />
  
        <!-- Products In Listing -->
        <div class="q-grid products-in-listing">
          <div class="q-cell-1 right"><b>Products In Listing</b></div>
  
          <!-- Product Selector -->
          <div class="q-cell-1" v-for="(product, index) in listingDataLocal.productsInListing" :key="index">
            <div class="q-grid">
              <!-- SKU -->
              <div class="q-cell-1">
                <div class="q-grid middle">
                  <div class="q-cell-50 right p10r">
                    <b><small>Sku: </small></b>
                  </div>
                  <div class="q-cell-50">
                    <datalist id="products">
                      <option v-for="(item, index) in productsCollection.items" :key="index" :value="item.sku"></option>
                    </datalist>
                    <input type="text" list="products" v-model="product.sku">
                  </div>
                </div>
              </div>
  
              <!-- Quantity -->
              <div class="q-cell-1">
                <EditPropVue :data="product" prop="qty" type="number" />
              </div>
            </div>
          </div>
        </div>
  
        <!-- Temporary Save Button -->
        <button v-if="!listingDataLocal._id" @click="postIt">Post Item</button>
  
        <!-- Remove Listing -->
        <button v-if="listingDataLocal._id" @click="removeItem(listingDataLocal._id)" class="remove-item">Remove Item</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted } from 'vue';
  
  // Components
  import EditPropVue from './EditProp.vue';
  
  // Composables
  import useDb from '../composables/useDb';
  import useListings from '../composables/useListings';

  const { calcListingValue } = useListings();
  
  const props = defineProps({
    listingData: Object
  });
  
  const listingDataLocal = ref(props.listingData || emptyListing());  
  const listingsDb = useDb('listings');
  const productsDb = useDb('products');  
  const productsCollection = productsDb.getCollection();
  
  function emptyListing() {
    return {
      title: '',
      description: '',
      productsInListing: [{
        sku: '',
        qty: 1
      }],
      totalValue: 1,
      price: 1,
      status: 'active'
    }
  };
  
  async function postIt() {
    try {
      await listingsDb.saveItem(listingDataLocal.value);
      listingDataLocal.value = emptyListing();
    } catch (err) {
      console.log(err);
    }
  }
  
  function removeItem(id) {
    listingsDb.removeItem(id);
  }
  
  watch(() => props.listingData, (newVal) => {
    listingDataLocal.value = newVal || emptyListing();
  }, { deep: true });
  
  watch(listingDataLocal, () => {
    listingsDb.updateItem(listingDataLocal.value);
  }, { deep: true });

  onMounted(() => {
    listingDataLocal.value.value = calcListingValue(listingDataLocal.value)

    if(!listingDataLocal.value.price) {
      listingDataLocal.value.price = listingDataLocal.value.value;
    }
  });

  </script>
  
  <style scoped>
    button {
      width: 100%;
    }
    .edit-shipping {
      padding-top: 20px;
    }
    .form {
      padding: 20px;
    }
    .label-container {
      padding-right: 20px;
      text-align: right;
    }
    .products-in-listing {
      padding: 20px;
    }
    .remove-item {
      background-color: var(--darkest-red);
    }
    .stock-count {
      font-weight: bold;
      color: var(--darkest-blue);
      text-align: center;
    }
  </style>
  