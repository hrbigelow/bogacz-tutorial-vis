<script>
  import { Plot } from './plot.js'
  let plot = new Plot()
  plot.update()
  let colors = [ 'blue', 'green', 'red', 'orange' ]
  let divw=0, divh=0;

  function numberDisplay(nums, places=2) {
    var fn = (n) => 
      Math.abs(n) > 1000 || Math.abs(n) < 1e-2 ? n.toExponential(places) :
        n.toFixed(places);
    if (nums instanceof Array) return nums.map(fn);
    else return fn(nums);
  }

  function h(evt, logscale=false) {
    let el = evt.target
    let id = el.id
    let val
    if (el.type == 'checkbox')
      val = el.checked
    else
      if (logscale)
        val = Math.pow(10, parseFloat(el.value))
      else
        val = parseFloat(el.value)
    
    plot.set_param(id, val)
    plot.update()
    plot.resize_viewport(divw, divh)
    plot = plot
    // console.log(`h with ${id} ${val}`)
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
          <!-- beware mixing bind:value and on:input.
            See https://svelte.dev/docs#template-syntax-element-directives-bind-property

            If you're using bind: directives together with on: directives, the
            order that they're defined in affects the value of the bound
            variable when the event handler is called.
          -->
          {#if obj.logscale}
            <label class='ib'>{obj.id}
              <input id={obj.id}
                     type=range
                     on:input={(evt) => h(evt, true)}
                     min={Math.log10(obj.min)}
                     max={Math.log10(obj.max)} 
                     step={(Math.log10(obj.max) - Math.log10(obj.min)) / 1000}
                     value={Math.log10(obj.val)}>
                     <div class='ib'>{numberDisplay(obj.val, 3)}</div>
            </label>
          {:else}
            <label class='ib'>{obj.id}
              <input id={obj.id}
                     type=range
                     on:input={h}
                     min={obj.min}
                     max={obj.max} 
                     step={(obj.max - obj.min) / 1000}
                     value={obj.val}>
              <div class='ib'>{numberDisplay(obj.val)}</div>
            </label>
          {/if}
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

  .ib {
    display: inline-block;
  }

</style>

