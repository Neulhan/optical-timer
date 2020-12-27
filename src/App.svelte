<script>
	import App from "./clock"
	import { onMount } from "svelte"
	import Controler from "./components/controler.svelte"
	let app;
	onMount(() => {
		app = new App()
		window.addEventListener("resize", app.resize)
	})
</script>

<main>
	<Controler {app}></Controler>
</main>

<style>
</style>