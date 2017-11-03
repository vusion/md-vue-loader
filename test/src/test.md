# example
## test html

```html
<p>
    just sample txt
</p>
```

## test vue
this line will show the result from vue.
```vue
<template>
    <p>
        Test vue. {{a}} font color is red.
    </p>
</template>
<script>
    export default {
        data: function () {
            return  {
                a: 1,
            };
        }
    }
</script>
<style>
p {
    color: red;
}
</style>
```

## test vue copy
this line will show the result from vue.
```vue
<template>
    <p>
        Test vue. {{a}} font color is green.
    </p>
</template>
<script>
    export default {
        data: function () {
            return  {
                a: 1,
            };
        }
    }
</script>
<style scoped>
p {
    color: green;
}
</style>
```

## test vue2
this line will show the result from vue.
```vue
<template>
    <p>
        Test vue. {{a2}}
        <button @click="click">click me</button>
    </p>
</template>
<script>
    export default {
        data: function () {
            return  {
                a2: 1,
            };
        },
        methods: {
            click() {
                this.a2++;
            },
        },
    }
</script>
```

## test html2

```html
<p>
    just sample txt2
</p>
```