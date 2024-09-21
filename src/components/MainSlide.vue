<template>
    <swiper v-if="slides.length"
    :slidesPerView="slidesPerView"
    :spaceBetween="20"
    :centeredSlides="true"
    :loop="true"
    :grabCursor="true"
    :navigation="true"
    @swiper="onSwiper"
    >
    <swiper-slide v-for="slide in slides" :key="slide">
        <router-link :to="'/products/'+slide.link">
            <img :src="'/images/'+slide.image" :class="slideClasee" />
        </router-link>
    </swiper-slide>
</swiper>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import useScreen from '../composables/useScreen';

const { screenSize } = useScreen();

let mySwiper = null;
let slideTimeout = null;

const onSwiper = (swiper) => {
    mySwiper = swiper;
    setTimeout(() => {
        if(mySwiper?.destroyed===true) {
            return;
        }

        mySwiper.slideNext()
    }, 500);
    startAutoSlide();
};

const slides = ref([
    {
        image: 'box3.webp',
        link: 'b301 set of 2'
    },
    {
        image: 'the-original.webp',
        link: 'a300'
    },
    {
        image: 'b101.webp',
        link: 'b101 set of 2'
    },
    {
        image: 'b201.webp',
        link: 'b201 set of 2'
    },
    {
        image: 'box2.webp',
        link: 'b301 set of 2'
    }
]);

const slidesPerView = computed(() => {
    return screenSize.value === 'large' 
    ? 1
    : screenSize.value === 'medium'
    ? 2.5
    : 1.3;
});

const slideClasee = computed(() => {
    return screenSize.value === 'large' ? 'img-large' : 'img-small';
});

function slideNext() {
    if (mySwiper && !mySwiper.destroyed) {
        mySwiper.slideNext();
        startAutoSlide();
    } 
}

function startAutoSlide() {
    clearTimeout(slideTimeout);
    slideTimeout = setTimeout(slideNext, 3000); 
}

function resetAutoSlide() {
    if (!mySwiper?.destroyed) {
        clearTimeout(slideTimeout);
        startAutoSlide();
    }
}

onMounted(() => {
    if (mySwiper) {
        mySwiper.el.addEventListener('touchstart', resetAutoSlide);
        mySwiper.el.addEventListener('mousedown', resetAutoSlide);
    }
});

onBeforeUnmount(() => {
    if (mySwiper) {
        mySwiper.el.removeEventListener('touchstart', resetAutoSlide);
        mySwiper.el.removeEventListener('mousedown', resetAutoSlide);
    }
    clearTimeout(slideTimeout);
});

</script>

<style scoped>
img {
    width: 100%;
    border-radius: 10px;
}
.img-large {
    object-fit: cover;
    height: 100%;
    align-self: stretch;
}
.img-small {
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.2);
}
</style>