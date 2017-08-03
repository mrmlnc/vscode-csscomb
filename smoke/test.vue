<template>
	<div class="hello"></div>
</template>

<style scoped lang="less">
.test {
	& > .nested {
		content: ""
	}
}
</style>
