<template>
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-[60]">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <div class="bg-indigo-600 text-white pl-6 py-4 flex justify-between items-center">
        <h2 class="text-xl font-semibold">
          Shipping Options for Order #{{ orderData.orderId }}
        </h2>
        <button @click="$emit('close')" class="text-white hover:text-indigo-200">
          <X />
        </button>
      </div>

      <div class="flex-grow overflow-y-auto">
        <div v-if="currentStep === 1" class="p-6 space-y-4">
          <label for="serviceProvider" class="block text-sm font-medium text-gray-700">
            Select Shipping Service Provider
          </label>
          <select
            id="serviceProvider"
            v-model="selectedServiceProvider"
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
          >
            <option v-for="provider in shippingServiceProviders" :key="provider" :value="provider">
              {{ provider.charAt(0).toUpperCase() + provider.slice(1) }}
            </option>
          </select>
        </div>

        <div v-else-if="currentStep === 2" class="p-6 space-y-6">
          <div v-if="isLoading" class="text-center py-12">
            <p class="text-gray-600 font-medium mb-4">Loading shipping options...</p>
            <div class="animate-pulse flex space-x-4 justify-center">
              <div class="rounded-full bg-indigo-300 h-3 w-3"></div>
              <div class="rounded-full bg-indigo-300 h-3 w-3"></div>
              <div class="rounded-full bg-indigo-300 h-3 w-3"></div>
            </div>
          </div>

          <template v-else-if="shippingOptions">
            <div v-if="shippingOptions.availableOption.boxes?.length" class="bg-gray-50 p-6 rounded-lg">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Available Option (Multiple Boxes)</h3>
                <button @click="addBox('available')" 
                  class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  Add Box
                </button>
              </div>
              <ul class="space-y-4">
                <li v-for="(box, boxIndex) in shippingOptions.availableOption.boxes" :key="boxIndex" 
                  class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div class="flex justify-between items-start mb-2">
                    <p class="font-medium text-gray-800">Box {{ boxIndex + 1 }}</p>
                    <button @click="removeBox('available', boxIndex)" 
                      class="text-red-600 hover:text-red-800">
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                  <div class="grid grid-cols-4 gap-2 mb-2">
                    <div>
                      <label class="block text-xs text-gray-500">Length</label>
                      <input type="number" v-model.number="box.length" 
                        class="w-full p-1 border rounded" 
                        @input="recalculateBoxWeights" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500">Width</label>
                      <input type="number" v-model.number="box.width" 
                        class="w-full p-1 border rounded" 
                        @input="recalculateBoxWeights" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500">Height</label>
                      <input type="number" v-model.number="box.height" 
                        class="w-full p-1 border rounded" 
                        @input="recalculateBoxWeights" />
                    </div>
                    <div>
                      <label class="block text-xs text-gray-500">Box Weight</label>
                      <input type="number" v-model.number="box.boxWeight" 
                        class="w-full p-1 border rounded" 
                        @input="recalculateBoxWeights" 
                        step="0.1" />
                    </div>
                  </div>
                  <p class="text-sm text-gray-600">Total Weight: {{ box.totalWeight }} lbs</p>
                  <ul class="mt-3 space-y-2">
                    <li v-for="(item, itemIndex) in box.items" :key="`${boxIndex}-${itemIndex}`" 
                      class="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div class="flex items-center flex-grow mr-2">
                        <input type="checkbox" :id="`item-${boxIndex}-${itemIndex}`" 
                          class="form-checkbox h-4 w-4 text-indigo-600" />
                        <label :for="`item-${boxIndex}-${itemIndex}`" class="ml-2 text-sm text-gray-700 flex-grow">
                          {{ (item.sku || 'N/A').toUpperCase() }} x {{ item.qty }}
                        </label>
                        <input type="number" v-model.number="item.weight" 
                          class="w-20 p-1 border rounded text-sm" 
                          @input="recalculateBoxWeights" 
                          step="0.1" />
                      </div>
                      <button @click="moveItem(boxIndex, itemIndex)" 
                        class="text-indigo-600 hover:text-indigo-800 text-sm">
                        Move
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
              <p class="mt-4 text-sm text-gray-600">Total Weight: {{ calculateTotalWeight('available') }} lbs</p>
              <button @click="fetchShippingRates(shippingOptions.availableOption, 'available')" 
                class="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300">
                Fetch Rates For Available Option
              </button>
            </div>

            <div class="bg-gray-50 p-6 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Ideal Option (Single Box)</h3>
              <div class="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label class="block text-xs text-gray-500">Length</label>
                  <input type="number" v-model.number="shippingOptions.idealOption.boxes[0].length" 
                    class="w-full p-1 border rounded" 
                    @input="recalculateIdealBoxWeight" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500">Width</label>
                  <input type="number" v-model.number="shippingOptions.idealOption.boxes[0].width" 
                    class="w-full p-1 border rounded" 
                    @input="recalculateIdealBoxWeight" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500">Height</label>
                  <input type="number" v-model.number="shippingOptions.idealOption.boxes[0].height" 
                    class="w-full p-1 border rounded" 
                    @input="recalculateIdealBoxWeight" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500">Box Weight</label>
                  <input type="number" v-model.number="shippingOptions.idealOption.boxes[0].boxWeight" 
                    class="w-full p-1 border rounded" 
                    @input="recalculateIdealBoxWeight" 
                    step="0.1" />
                </div>
              </div>
              <p class="text-sm text-gray-600 mt-1">Total Weight: {{ calculateTotalWeight('ideal') }} lbs</p>
              <button @click="fetchShippingRates(shippingOptions.idealOption, 'ideal')" 
                class="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300">
                Fetch Rates For Ideal Option
              </button>
            </div>
          </template>
        </div>

        <div v-else-if="currentStep === 3" class="p-6">
          <ShippingRatesSelection 
            :orderData="orderData"
            :shipment-rates-data="fetchedShipmentRates" 
            :selectedServiceProvider="selectedServiceProvider"
            @purchased-label="$emit('close')" 
          />
        </div>
      </div>

      <div class="bg-gray-100 px-6 py-4 flex justify-between items-center">
        <button 
          v-if="currentStep > 1" 
          @click="currentStep--" 
          class="text-indigo-600 hover:text-indigo-800 transition duration-200 flex items-center"
        >
          <ArrowLeft />
          Back
        </button>
        <button 
          v-if="currentStep < 3" 
          @click="handleNext" 
          class="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ShippingRatesSelection from './ShippingRatesSelection.vue';
import { X, ArrowLeft, TrashIcon } from 'lucide-vue-next';
import useShipping from '../composables/useShipping';
import useApi from '../composables/useApi';

const props = defineProps({
  orderData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);

const { createShipment, getShippingOptions } = useShipping();
const { notify } = useApi();

const shippingServiceProviders = ref(['shippo', 'easyship', 'easypost', 'ship_engine']);
const selectedServiceProvider = ref('shippo');
const shippingOptions = ref(null);
const fetchedShipmentRates = ref(null);
const isLoading = ref(false);
const currentStep = ref(1);

function addBox(optionType) {
  const newBox = {
    length: 12,
    width: 12,
    height: 12,
    boxWeight: 1.1,
    items: [],
    totalWeight: 1.1
  };
  shippingOptions.value[`${optionType}Option`].boxes.push(newBox);
}

function removeBox(optionType, boxIndex) {
  if(!confirm('Are you sure you want to delete this box?')) {
    return;
  }
  const boxes = shippingOptions.value[`${optionType}Option`].boxes;
  if (boxes.length > 1) {
    boxes.splice(boxIndex, 1);
  }
}

function moveItem(fromBoxIndex, itemIndex) {
  const boxes = shippingOptions.value.availableOption.boxes;
  const item = boxes[fromBoxIndex].items[itemIndex];
  
  boxes[fromBoxIndex].items.splice(itemIndex, 1);
  
  let toBoxIndex = (fromBoxIndex + 1) % boxes.length;
  if (toBoxIndex === fromBoxIndex && boxes.length === 1) {
    addBox('available');
    toBoxIndex = boxes.length - 1;
  }
  
  boxes[toBoxIndex].items.push(item);
  
  recalculateBoxWeights();
}

function recalculateBoxWeights() {
  const boxes = shippingOptions.value.availableOption.boxes;
  boxes.forEach(box => {
    box.totalWeight = box.boxWeight || 1.1;
    box.items.forEach(item => {
      box.totalWeight += (item.weight || 0) * item.qty;
    });
    box.totalWeight = Number(box.totalWeight.toFixed(2));
  });
}

function recalculateIdealBoxWeight() {
  const idealBox = shippingOptions.value.idealOption.boxes[0];
  idealBox.totalWeight = idealBox.boxWeight || 1.1;
  idealBox.items.forEach(item => {
    idealBox.totalWeight += (item.weight || 0) * item.qty;
  });
  idealBox.totalWeight = Number(idealBox.totalWeight.toFixed(2));
}

function calculateTotalWeight(optionType) {
  const boxes = shippingOptions.value[`${optionType}Option`].boxes;
  const totalWeight = boxes.reduce((sum, box) => sum + box.totalWeight, 0);
  return Number(totalWeight.toFixed(2));
}

async function fetchShippingRates(shippingOption, optionName) {
  isLoading.value = true;
  try {
    const fetchedRates = await createShipment(
      props.orderData.shippingAddress,
      shippingOption,
      selectedServiceProvider.value
    );

    fetchedShipmentRates.value = fetchedRates;

    if(fetchedRates?.messages?.length) {
      notify(fetchedRates.messages, { sustain: true });
    }

    currentStep.value = 3;
  } catch (err) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

function handleNext() {
  if (currentStep.value === 1 && selectedServiceProvider.value) {
    currentStep.value = 2;
  }
}

onMounted(async () => {
  try {
    isLoading.value = true;
    const shipmentData = await getShippingOptions(props.orderData.orderItems);
    
    shipmentData.availableOption.boxes.forEach(box => {
      box.boxWeight = box.boxWeight || 1.1;
    });
    shipmentData.idealOption.boxes[0].boxWeight = shipmentData.idealOption.boxes[0].boxWeight || 1.1;
    
    shippingOptions.value = shipmentData;
  } catch (error) {
    console.error('Error fetching shipping options:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>