# example
## test2 html

```html
<p>
    just sample txt
</p>
```

## test2 vue
this line will show the result from vue.
```vue
<template>
    <p>
        test2 vue. {{a}}
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
```

## test2 vue copy
this line will show the result from vue.
```vue
<template>
    <p>
        test2 vue. {{a}}
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

## test2 vue2
this line will show the result from vue.
```vue
<template>
    <p>
        test2 vue. {{a2}}
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
<style>
p {
    color: red;
}
</style>
```

## test2 html2

```html
<p>
    just sample txt2
</p>
```