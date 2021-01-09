<script>
    import { hourStore, minuteStore, secondStore } from "../stores/timeStore.js";
    
    export let app;

    let inProgress = false;

    const up = (store) => {
        store.update(value => {
            if (value !== 59) {
                return value + 1
            }
            return 0
        });
    }
    const down = (store) => {
        store.update(value => {
            if (value !== 0) {
                return value - 1
            }
            return 59
        });
    }

    const start = () => {
        inProgress = true;
        app.startFrame($hourStore * 3600 + $minuteStore * 60 + $secondStore);
    };

    window.addEventListener("timeOut", () => {
        inProgress = false;
    })

</script>

<style>
    .controler {
        padding: 8px;
        background-color: #00000060;
        position: fixed;
        top: 8px;
        left: 8px;
    }
    .time {
        font-size: 20px;
        padding: 4px;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .line {
        display: flex;
        height: 30px;
        margin-bottom: 8px;
    }
    .line > button  {
        height: 100%;
        width: 30px;
        height: 30px;
    }
    .line > .display {
        height: 100%;
        width: 45px;
        height: 30px;
    }

    button {
        background-color: transparent;
        border: 1px solid white;
        color: white;
        transition: background-color 0.3s;
        line-height: 17px;
        cursor: pointer;
    }
    button:hover {
        background-color: white;
        color: black;
    }
    .display {
        width: 30px;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .start-btn {
        width: 100%;
        margin-bottom: 0;
        height: 30px;
    }
</style>

<div class="controler">
    {#if inProgress}
        <div class="time">
            {$hourStore ? $hourStore + "h" : ""} 
            {$minuteStore ? $minuteStore + "m" : ""} 
            {$secondStore ? $secondStore + "s" : ""} 
        </div>
    {:else}
        <div class="line">
            <button on:click={() => {down(hourStore)}}>-</button>
            <div class="display">{$hourStore}h</div>
            <button on:click={() => {up(hourStore)}}>+</button>
        </div>
        <div class="line">
            <button on:click={() => {down(minuteStore)}}>-</button>
            <div class="display">{$minuteStore}m</div>
            <button on:click={() => {up(minuteStore)}}>+</button>
        </div>
        <div class="line">
            <button on:click={() => {down(secondStore)}}>-</button>
            <div class="display">{$secondStore}s</div>
            <button on:click={() => {up(secondStore)}}>+</button>
        </div>
        <button class="start-btn" on:click={start}>START</button>
    {/if}
</div>