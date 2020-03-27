
``` vue
<template>
<div>
    <p>This is a vue componenfffft.</p>
    <button @click="number++">Click me!</button> {{ number }}
    <p class="vue">Component template should contain exactly one root element.sssssss</p>
</div>
</template>

<script>
export default {
    data() {
        return {
            number: 0,
        };
    },
}
</script>

<style scoped>
.vue {
    color: red;
}
</style>
```
