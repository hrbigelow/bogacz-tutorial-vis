<script>
  import { Plot } from './plot.js'
  let plot = new Plot()
  plot.update()
  let colors = [ 'blue', 'green', 'red', 'orange' ]
  let divw=0, divh=0;

  function h(evt) {
    let el = evt.target
    let id = el.id
    let val
    if (el.type == 'checkbox')
      val = el.checked
    else
      val = parseFloat(el.value)
    
    plot.set_param(id, val)
    plot.update()
    plot.resize_viewport(divw, divh)
    plot = plot
    // console.log(x, y, width, height, plot.model.get_state())
  }

  $: plot.resize_viewport(divw, divh)

</script>

<div class='gbox'>
  <div class='framed grid0' bind:clientWidth={divw} bind:clientHeight={divh}/>
  <svg class='grid0' width="1200" height="500" >
    {#each plot.get_state_inventory() as state, i}
      <path id={state.id} 
            style="stroke: {colors[i]};"
                   class='curve'
            d="{plot.curve(state.offset)}"/>
    {/each}
  </svg>
  <div class='grid1'>
    {#each plot.get_params() as obj}
      <div>
        {#if obj.type == 'float'}
          <label>{obj.id}
            <!-- beware mixing bind:value and on:input.
              See https://svelte.dev/docs#template-syntax-element-directives-bind-property

              If you're using bind: directives together with on: directives, the
              order that they're defined in affects the value of the bound
              variable when the event handler is called.
            -->
            <input id={obj.id}
                   type=range
                   on:input={h}
                   min={obj.min} max={obj.max} step=0.1>
            {obj.val}
          </label>
        {:else if obj.type === 'bool'}
          <label>{obj.id}
            <input id={obj.id}
                   type=checkbox
                   on:change={h}>
          </label>
        {/if}
                   
      </div>
    {/each}
  </div>

</div>


<style>

  .curve {
    fill: none;
    stroke: rgba(255, 0, 0, 1);
    stroke-width: 2px;
  }

  .gbox {
    display: grid;
  }

  .grid0 {
    grid-area: 1/1/1/1;
    align-self: stretch;
    justify-self: stretch;
  }

  .grid1 {
    grid-area: 2/2/2/1;
    align-self: stretch;
    justify-self: stretch;
  }


  .framed {
    border: 1px solid gray;
  }

</style>

