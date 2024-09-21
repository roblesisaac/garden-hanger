<template>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Main Image Swiper -->
    <div class="relative aspect-[4/5]">
    <Swiper
        :slides-per-view="1"
        :loop="true"
        :initial-slide="activeImage"
        @slideChange="onSlideChange"
        @swiper="onSwiper"
        class="w-full h-full rounded-lg shadow-lg"
    >
        <SwiperSlide v-for="(img, index) in mainProduct.images" :key="index">
        <img
            :src="imagePath(index)"
            :alt="mainSku"
            class="w-full h-full object-cover rounded-lg"
        />
        </SwiperSlide>
    </Swiper>

    <!-- Price Badge -->
    <div
        class="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-tl-lg rounded-br-lg shadow-lg transform translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-300 ease-in-out z-10"
    >
        <div class="flex flex-col items-end">
        <span class="text-2xl font-bold">
            {{ formatAsPrice(listing.price) }}
        </span>
        </div>
    </div>
    </div>

    <!-- Thumbnails -->
    <div class="grid grid-cols-4 gap-4 content-start">
    <div
        v-for="(img, index) in mainProduct.images"
        :key="img"
        class="aspect-[1/1]"
    >
        <v-lazy-image 
            :src="imagePath(index)"
            :src-placeholder="imagePlaceholder(index)"
            alt="Planter Hanger"
            :class="[
            'w-full h-full object-cover rounded cursor-pointer transition-all duration-300',
            isActiveThumb(index) ? 'ring-2 ring-blue-500' : 'hover:opacity-75'
            ]"
            @click="activateImage(index)"
        />

        <!-- <img
        :src="imagePath(index)"
        :alt="mainSku"
        :class="[
            'w-full h-full object-cover rounded cursor-pointer transition-all duration-300',
            isActiveThumb(index) ? 'ring-2 ring-blue-500' : 'hover:opacity-75'
        ]"
        @click="activateImage(index)"
        /> -->
    </div>
    </div>
</div>
</template>
  
  <script setup>
  import { computed, ref, watch } from 'vue';
  import { Swiper, SwiperSlide } from 'swiper/vue';
  import { formatAsPrice } from '../utils/formats';
  import useListings from '../composables/useListings';
  import VLazyImage from "v-lazy-image";

  const props = defineProps({
    listing: Object,
  });
  
  const { getMainSku, getMainProduct } = useListings();
  
  const mainSku = computed(() => getMainSku(props.listing));
  const mainProduct = computed(() => getMainProduct(props.listing));
  
  const activeImage = ref(0);
  let swiperInstance = null;
  
  function imagePath(index = 0) {
    const imageName = mainProduct.value.images[index];
    return `/images/${imageName}.webp`;
  }

  function imagePlaceholder(index = 0) {
    const imageName = mainProduct.value.images[index];
    return `/image/5/${imageName}.webp`;
  }
  
  function activateImage(index) {
    activeImage.value = index;
    if (swiperInstance) {
      swiperInstance.slideToLoop(index);
    }
  }
  
  function onSlideChange(swiper) {
    activeImage.value = swiper.realIndex;
  }
  
  function onSwiper(swiper) {
    swiperInstance = swiper;
  }
  
  function isActiveThumb(index) {
    return activeImage.value === index;
  }
  
  watch(mainSku, () => {
    activeImage.value = 0;
    if (swiperInstance) {
      swiperInstance.slideToLoop(0);
    }
  });
</script>
  