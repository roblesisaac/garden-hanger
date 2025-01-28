<template>
  <div class="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg overflow-hidden border border-gray-200">
    <!-- Minimized Details -->
    <div @click="toggleExpand" class="cursor-pointer p-4 sm:p-6">
      <div class="flex justify-between flex-row">
        <div class="flex flex-col">
          <div class="flex items-center space-x-3">
            <span class="text-sm font-medium text-gray-600">
              {{ orderData.orderSource === 'etsy' ? 'Etsy Order' : 'Order' }} #{{ orderData.orderId }}
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mt-2">{{ getOrderTitle() }}</h3>
          <p class="text-sm text-gray-500">{{ getItemCount() }} item(s)</p>
        </div>
        <div class="flex flex-grow flex-col items-end">
          <!-- Label Status -->
          <OrderStatusLabel 
            :orderData="orderData"
            @status-changed="handleUpdateOrder({ status: $event })"
          />
          <p class="text-lg font-semibold text-green-600">${{ orderData.totalPrice }}</p>
          <p class="text-xs text-gray-400">{{ formatDateFromId(orderData._id) }}</p>
        </div>
      </div>
    </div>

    <!-- Expanded Section -->
    <div v-if="expanded" class="border-t border-gray-200 p-4 sm:p-6 bg-white">
      <div class="space-y-6">
        <!-- Previous Refunds -->
        <OrderRowPreviousRefunds :orderData="orderData" />
        
        <!-- Shipping Address -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-md font-semibold text-gray-700">Shipping Address</h4>
            <button v-if="canUpdateAddress" @click="toggleEditAddress" class="text-sm text-blue-600 hover:text-blue-800">
              {{ isEditingAddress ? 'Cancel' : 'Edit' }}
            </button>
          </div>
          <div v-if="!isEditingAddress">
            <address class="text-sm text-gray-600 not-italic space-y-1">
              <p>{{ orderData.shippingAddress.customerName }}</p>
              <p>{{ orderData.shippingAddress.street }}</p>
              <p>{{ orderData.shippingAddress.city }}, {{ orderData.shippingAddress.state }} {{ orderData.shippingAddress.zipCode }}</p>
              <p>{{ orderData.shippingAddress.email }}</p>
            </address>
          </div>
          <div v-else>
            <OrderRowUpdateAddressForm :orderData="orderData" @address-changed="handleUpdateOrder" />
          </div>
        </div>
        
        <!-- Order Items -->
        <div>
          <h4 class="text-md font-semibold text-gray-700 mb-3">Order Items</h4>
          <ul class="space-y-2">
            <li v-for="item in orderData.orderItems" :key="item._id" class="text-sm bg-gray-50 p-2 rounded">
                <router-link :to="'/products/' + (item.title || '').toLowerCase()" class="font-medium text-blue-600">
                    {{ item.title }}
                </router-link>
                <span class="text-gray-500 ml-2">(Qty: {{ item.qty }})</span>
            </li>
          </ul>
        </div>
        
        <!-- Tracking URL Section -->
        <div v-if="orderData.trackingUrl" class="bg-blue-50 rounded-lg p-4">
          <h4 class="text-md font-semibold text-gray-700 mb-3">Track Your Order</h4>
          <p class="text-sm text-gray-600 mb-2">Your order is on its way! Click the button below to track its progress.</p>
          <a :href="orderData.trackingUrl" target="_blank" class="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium">
            Track Shipment
          </a>
        </div>
        
        <!-- Cancel Order Component -->
        <div v-if="canUpdateAddress">
          <OrderRowCancelOrder 
            :orderData="orderData"
            @close="showCancelOrder = false"
            v-if="showCancelOrder"
          />
          <button 
            v-else
            @click="showCancelOrder = true"
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Cancel Order
          </button>
        </div>
      
        <!-- Admin Section -->
        <div v-if="userStore.isAdmin" class="mt-8 space-y-4">
          <!-- Admin Capture / Refund Buttons -->
          <OrderPaymentManager 
            v-if="orderData.stripeSession && orderData.orderSource !== 'etsy'"
            :orderData="orderData" 
            @payment-status-changed="handleUpdateOrder({ paymentStatus: $event })" 
          />
          
          <!-- Label Image -->
          <div v-if="orderData.purchasedLabelUrl" class="flex flex-col items-center">
            <button @click="showLabel = !showLabel" class="flex-1 w-full text-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium">
              {{ showLabel ? 'Hide' : 'View' }} Shipping Label
            </button>
            <img v-if="showLabel" :src="orderData.purchasedLabelUrl" alt="Shipping Label" class="mt-4 rounded-lg shadow-md max-w-full h-auto" />
          </div>
          
          <!-- Toggle Label Button -->
          <div v-if="canPrintShippingLabel" class="flex flex-col items-center">
            <button @click="showCreateLabel = !showCreateLabel" class="flex-1 text-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold">
              Show Create Label Form
            </button>
          </div>
          
          <!-- Create Label Section -->
          <CreateLabel v-if="showCreateLabel" :orderData="orderData" @close="showCreateLabel = false" />
        </div>
      </div>
    </div>
  
  <!-- Toggle Row Arrows -->
  <div @click="toggleExpand" class="cursor-pointer p-2 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
    <ChevronUp v-if="expanded" class="text-gray-500" />
    <ChevronDown v-else class="text-gray-500" />
  </div>
</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import OrderPaymentManager from './OrderPaymentManager.vue';
import CreateLabel from './CreateLabel.vue';
import OrderRowUpdateAddressForm from './OrderRowUpdateAddressForm.vue';
import OrderRowCancelOrder from './OrderRowCancelOrder.vue';
import OrderStatusLabel from './OrderStatusLabel.vue';
import OrderRowPreviousRefunds from './OrderRowPreviousRefunds.vue'
import { formatDateFromId } from '../../api/utils/formats';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';

import { useUserStore } from '../stores/userStore';
import useOrders from '../composables/useOrders';

const { updateOrder } = useOrders();
const userStore = useUserStore();

const props = defineProps({
  orderData: Object
});

const expanded = ref(false);
const showLabel = ref(false);
const showCreateLabel = ref(false);
const isEditingAddress = ref(false);
const showCancelOrder = ref(false);

const canUpdateAddress = computed(() => {
  // Allow admin to edit address regardless of status
  if (userStore.isAdmin) return true;
  
  const { status } = props.orderData;
  return ['created', 'on_hold'].includes(status.toLowerCase());
});

const canPrintShippingLabel = computed(() => {
  // Allow admin to print label if no label exists yet
  if (userStore.isAdmin) return !props.orderData.purchasedLabelUrl;
  
  const { purchasedLabelUrl, paymentStatus } = props.orderData;
  const unacceptableStatuses = ['unpaid', 'failed'];
  return !purchasedLabelUrl && !unacceptableStatuses.includes(paymentStatus.toLowerCase());
});

const toggleExpand = () => {
    expanded.value = !expanded.value;
};

const toggleEditAddress = () => {
    isEditingAddress.value = !isEditingAddress.value;
};

const getOrderTitle = () => {
  if (props.orderData.orderSource === 'etsy') {
    const firstItem = props.orderData.orderItems[0];
    return firstItem ? firstItem.title : 'Untitled Order';
  }
  const firstItem = props.orderData.stripeSession?.line_items?.data[0];
  return firstItem ? firstItem.description : 'Untitled Order';
};

const getItemCount = () => {
    if (props.orderData.orderSource === 'etsy') {
        return props.orderData.orderItems.reduce((total, item) => total + item.qty, 0);
    }
    return props.orderData.stripeSession?.line_items?.data.reduce((total, item) => total + item.quantity, 0) || 0;
};

const getStatusClass = () => {
    const status = props.orderData.status.toLowerCase();
    return {
        'bg-yellow-100 text-yellow-800': status === 'created',
        'bg-orange-100 text-orange-800': status === 'on_hold',
        'bg-green-200 text-green-900': status === 'processing',
        'bg-red-100 text-red-800': status === 'cancelled',
        'bg-blue-100 text-blue-800': status === 'shipped',
        'bg-green-100 text-green-800': status === 'delivered',
        'bg-gray-100 text-gray-800': status === 'returned',
    };
};

const handleUpdateOrder = async (updates) => {
  try {
    if(updates.shippingAddress && !canUpdateAddress.value) {
      alert('You can only update orders with created or on_hold status');
      isEditingAddress.value = false;
      return;
    }
    
    await updateOrder(props.orderData._id, updates);
    
    if (updates.shippingAddress) {
      isEditingAddress.value = false;
    }
  } catch (err) {
    console.error('Failed to update order:', err);
  }
}
</script>