import random from 'random';
/* Implementation of model from https://pubmed.ncbi.nlm.nih.gov/28298703/
 * A tutorial on the free-energy framework for modelling perception and learning
 * by Rafal Bogacz
 * 
 */
export class Model {
  constructor(mu_v=3, sigma_v=1, sigma_u=1, update_rate=0.01, 
    learn_rate=0.01, use_hebbian=false, noisy=false, maxt=5) {
    // functions
    // the top-down generative function
    this.g = function(v) {
      return v**2 
    }

    this.g_grad = function(v) {
      return 2 * v
    }

    // parameters
    this.mu_v = mu_v
    this.sigma_v = sigma_v
    this.sigma_u = sigma_u

    // activation state
    this.time = 0
    this.phi = 0
    this.eps_u = 0
    this.eps_v = 0
    this.e_u = 0 // auxiliary node used to update sigma_u, eq #68

    // initial
    this.phi_initial = 0

    // model behavior
    this.maxt = maxt
    this.update_rate = update_rate
    this.learn_rate = learn_rate 
    this.hebbian = use_hebbian
    this.noisy_observation = noisy

    // introspection
    this.hparams = [ 'update_rate', 'learn_rate', 'hebbian', 'noisy_observation', 'maxt' ]
    this.params = [ 'mu_v', 'sigma_v', 'sigma_u' ]
    this.states = [ 'phi', 'eps_u', 'eps_v', 'e_u' ]
    this.schema = {
      mu_v: { min: 0, max: 5, type: 'float', logscale: false },
      sigma_v: { min: 0.1, max: 3.0, type: 'float', logscale: true },
      sigma_u: { min: 0.1, max: 3.0, type: 'float', logscale: true },
      update_rate: { min: 0.001, max: 0.1, type: 'float', logscale: true },
      learn_rate: { min: 0.001, max: 0.1, type: 'float', logscale: true },
      hebbian: { type: 'bool' },
      noisy_observation: { type: 'bool' },
      maxt: { min: 0, max: 100, type: 'float', logscale: false },
      phi_initial: { min: 0, max: 5, type: 'float', logscale: false }
    }
      
  }

  display() {
      return `Model
  Params:
  mu_v=${this.mu_v}
  sigma_v=${this.sigma_v}
  sigma_u=${this.sigma_u}
  
  Behavior:
  update_rate=${this.update_rate}
  learn_rate=${this.learn_rate}
  use_hebbian=${this.hebbian}
  
  Activation State:
  phi=${this.phi}
  eps_u=${this.eps_u}
  eps_v=${this.eps_v}
  e_u=${this.e_u}`
  }

  reset_activation_state() {
    this.time = 0
    this.phi = this.phi_initial
    this.eps_u = 0
    this.eps_v = 0
    this.e_u = 0
  }

  update_state(u) {
    if (this.hebbian) 
      this._update_state_hebbian(u)
    else
      this._update_state_analytical(u)
    this.time += this.update_rate
  }

  _update_state_hebbian(u) {
    let dt = this.update_rate
    let phi_update = this.eps_u * this.g_grad(this.phi) - this.eps_v // eq 12
    let eps_v_update = this.phi - this.mu_v - this.sigma_v * this.eps_v // eq 13
    let eps_u_update = u - this.g(this.phi) - this.e_u // eq 59
    let e_u_update = this.sigma_u * this.eps_u - this.e_u // eq 60
    this.phi += dt * phi_update 
    this.eps_v += dt * eps_v_update 
    this.eps_u += dt * eps_u_update
    this.e_u += dt * e_u_update
  }

  _update_state_analytical(u) {
    let dt = this.update_rate
    let phi_update = this.eps_u * this.g_grad(this.phi) - this.eps_v // eq 12
    let eps_v_update = this.phi - this.mu_v - this.sigma_v * this.eps_v // eq 13
    let eps_u_update = u - this.g(this.phi) - this.sigma_u * this.eps_u // eq 14
    this.phi += dt * phi_update 
    this.eps_v += dt * eps_v_update 
    this.eps_u += dt * eps_u_update
  }

  fixed_point_eps_v(u) {
    return (this.phi - this.mu_v) // this.sigma_v # eq 10 and 69 (multivar)
  }

  diseq_eps_v(u) {
    return this.fixed_point_eps_v(u) - this.eps_v
  }

  _grad_sigma_u_hebbian(u) {
    return 0.5 * (this.eps_u ** 2 - 1.0 / this.sigma_u) // eq 21 
  }

  _grad_sigma_u_analytical(u) {
    // eq 17 (this is the gradient that does not obey hebbian learning rules)
    return 0.5 * (
      ((u - this.g(this.phi)) **2 / this.sigma_u **2) 
      - 1.0 / this.sigma_u
    )
  }

  /* generate a sample for u, the sensory input
   * NOTE: this is NOT a sample of actual light intensity, since
   * that is never known directly
   */
  sample_v() {
    let f = random.normal(this.mu_v, this.sigma_v)
    return f()
  }

  sample_u_given_v(v) {
    let u_recons = this.g(v)
    let f = random.normal(u_recons, this.sigma_u)
    return f()
  }

  get_all_params() {
    let all_pars = Object.keys(this.schema)
    return all_pars.map(name => { 
      return { id: name, val: this[name], ...this.schema[name] } })
  }

  get_state_names() {
    if (! this.hebbian)
      return this.states.filter(id => id != 'e_u')
    else
      return this.states
  }

  get_model_state() {
    return this.get_state_names().map(s => this[s])
  }

  get_state_inventory() {
    return this.get_state_names().map((id, i) => { 
      return { id: id, offset: i } 
    })
  }

  run(v_sim) {
    let steps = Math.floor(this.maxt / this.update_rate)
    if (steps > 30000)
      throw `steps = ${steps} exceeded maximum`
    // console.log(`run(${v_sim}) with ${steps} steps`)
    
    let states = this.get_state_inventory()
    const stride = states.length
    let data = new Float32Array(steps * stride)
    let time = new Float32Array(steps)
    for (let s=0, off=0; s != steps; s++, off+=stride) {
      let sample_u;
      if (this.noisy_observation)
        sample_u = this.sample_u_given_v(v_sim)
      else
        sample_u = this.g(v_sim)
      this.update_state(sample_u)
      time[s] = this.time
      let state = this.get_model_state()
      for (let i = 0; i != state.length; i++) 
        data[off+i] = state[i]
    }

    // console.log(`finished`)
    return { 'time': time, 'data': data, 'states': states }
  }

}

