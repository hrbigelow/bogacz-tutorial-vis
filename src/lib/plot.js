import { Model } from './model.js'
import * as d3 from 'd3';

export class Plot {
  // produce a curve from a model
  constructor() {
    this.model = new Model()
    this.v_sim = 2
  }

  // call after update 
  resize_viewport(width, height) {
    this.xtransform = d3.scaleLinear().domain([0, this.model.maxt]).range([0, width])
    let [y_min, y_max] = this.get_y_bounds()
    let margin = (y_max - y_min) * 0.05
    this.ytransform = d3.scaleLinear()
      .domain([y_max + margin, y_min - margin])
      .range([0, height])
  }

  get_params() {
    return this.model.get_all_params()
  }

  get_state_inventory() {
    return this.model.get_state_inventory()
  }

  set_param(id, val) {
    console.log(`set_param(${id}, ${val})`)
    this.model[id] = val
  }

  get_y_bounds() {
    let maxval = this.run.data.reduce((acc,el) => { return Math.max(acc,el) })
    let minval = this.run.data.reduce((acc,el) => { return Math.min(acc,el) })
    return [minval, maxval]
  }

  // update the model state (or reinstantiate the model)
  update() {
    // console.log('in update')
    this.model.reset_activation_state()
    this.run = this.model.run(this.v_sim)
    this.stride = this.run.states.length
  }

  // produce the svg path 'd' element for the i'th curve
  curve(offset) {
    let x = this.run.time.map(el => this.xtransform(el))
    let y = this.run.data.filter(
      (_, ind) => { return ind % this.stride == offset })
      .map(el => this.ytransform(el))
    const coords = d3.zip(x, y)
    const line = d3.line()(coords)
    return line
  }

}

