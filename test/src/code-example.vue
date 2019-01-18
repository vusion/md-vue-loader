<template>
<div class="root">
    <div class="live"><slot></slot></div>
    <div class="code"><slot name="code"></slot></div>
</div>
</template>

<script>
export default {
    name: 'u-code-example',
};
</script>

<style scoped>
.root {
    border: 1px solid #ccc;
    background: #f2f5f8;
}

.live {
    padding: 15px;
}

.code {}
</style>
