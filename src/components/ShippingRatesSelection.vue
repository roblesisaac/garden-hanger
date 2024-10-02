<template>
  <div class="max-w-2xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">Select Shipping Method</h2>
    
    <div v-for="rate in shipmentRatesData.rates" :key="rate._id" class="mb-4">
      <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer">
        <label class="flex items-center p-4 cursor-pointer">
          <input 
            type="radio" 
            :name="'shipping-rate'" 
            @change="selectRate(rate)" 
            :value="rate._id" 
            v-model="selectedRateId"
            class="form-radio h-5 w-5 text-blue-600"
          >
          <div class="ml-4 flex-grow">
            <h3 class="font-semibold text-gray-800">{{ rate.courier_name }}</h3>
            <p class="text-sm text-gray-600">Estimated delivery: {{ rate.delivered_by }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-lg text-gray-800">${{ rate.price.toFixed(2) }}</p>
          </div>
        </label>
        <div class="px-4 pb-4 flex justify-end">
          <img :src="'/images/' + getImageLogo(rate)" :alt="rate.courier_name + ' logo'" class="h-8 object-contain">
        </div>
      </div>
      
      <transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 transform scale-95"
        enter-to-class="opacity-100 transform scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 transform scale-100"
        leave-to-class="opacity-0 transform scale-95"
      >
        <div v-if="rate._id === selectedRateId" class="mt-3">
          <button 
            @click="handlePurchaseLabel(rate._id)" 
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
          >
            Purchase Label <LoadingDotsVue v-if="purchasingLabel" />
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import LoadingDotsVue from '../components/LoadingDots.vue';
import useShipping from '../composables/useShipping';

const { purchaseLabel } = useShipping();

const props = defineProps({
  orderData: Object,
  shipmentRatesData: Object,
  selectedServiceProvider: String
});

const emit = defineEmits(['purchased-label']);

const selectedRateId = ref(null);
const purchasingLabel = ref(false);

function getImageLogo(rate) {
  const courierName = rate.courier_name.toLowerCase();
  if (courierName.includes('ups')) return 'shipping/UPS.png';
  if (courierName.includes('usps')) return 'shipping/USPS.png';
  if (courierName.includes('fedex')) return 'shipping/FEDEX.png'
  return 'cards/visa.png';
}

function selectRate(rate) {
  console.log({
    rate,
    shipmentRatesData: props.shipmentRatesData,
    selectedServiceProvider: props.selectedServiceProvider
  });
  selectedRateId.value = rate._id;
}

async function handlePurchaseLabel(rateId) {
  purchasingLabel.value = true;
  try {
    const orderId = props.orderData._id;
    const { updatedOrder } = await purchaseLabel(orderId, rateId, props.selectedServiceProvider);

    props.orderData.purchasedLabelUrl = updatedOrder.purchasedLabelUrl;
    props.orderData.trackingUrl = updatedOrder.trackingUrl;
    props.orderData.status = updatedOrder.status;
    emit('purchased-label');
  } catch (error) {
    console.log('Error handling purchase label:', error);
  } finally {
    purchasingLabel.value = false;
  }
  }
</script>