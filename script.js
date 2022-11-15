/* eslint-disable no-new */
/* eslint-disable prettier/prettier */
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const width = canvas.width;
const height = canvas.height;
canvas.style.background = "#000";
//const types = ["red", "blue", "green", "yellow", "purple", "orange", "darkblue", "pink", "teal", "magenta", "cyan", "lime", "Chartreuse"];
const types=['red','green','blue', 'pink', 'cyan', 'magenta', 'yellow', 'black', 'white', 'orange', 'gray', 'brown', 'lime', 'purple', 'silver', 'navy', 'aqua',
               // 'teal', 'olive', 'maroon', 'darkred', 'fuchsia', 'darkblue', 'darkgreen', 'darkcyan', 'darkmagenta', 'darkyellow', 'darkgray', 'darkkhaki', 'darkgoldenrod',
               // 'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray', 'darkturquoise', 'darkviolet',
              //  'deeppink', 'deepskyblue', 'dimgray', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'gold', 'goldenrod', 'greenyellow',
              //  'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
              //  'lightcyan', 'lightgoldenrodyellow', 'lightgreen', 'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightsteelblue',
              //  'lightyellow', 'limegreen', 'linen', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
              //  'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'oldlace', 'olivedrab', 'orangered', 'orchid',
              //  'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'plum', 'powderblue', 'rosybrown', 'royalblue', 'saddlebrown',
               // 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna', 'skyblue', 'slateblue', 'slategray', 'snow', 'springgreen'
]
function random(min, max) { return Math.random() * (max - min) + min; }
class Particle {
  constructor(x, y, vx, vy, ax, ay, r, type) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.vx = vx;
    this.vy = vy;
    this.ax = ax;
    this.ay = ay;
    this.type = type;
  }

  draw(particles) {
    // count number of partiles less than 100px away
    let count = 0;
    for (let i = 0; i < particles.length; i++) {
      let dx = this.x - particles[i].x;
      let dy = this.y - particles[i].y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        count++;
      }
    }
    if(this.r * count /4 >= 1) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * count/4 , 0, Math.PI * 2);
      ctx.fillStyle = this.type;
      ctx.fill();
    }

  }
}

class AttractionRepulsionRule {
  constructor(strength, minDist, maxDist, forceVector) {
    this.strength = strength;
    this.minDist = minDist;
    this.maxDist = maxDist;
    this.forceVector = forceVector;
  }

  apply(p1, p2, i, j) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.minDist || dist < p1.r + p2.r|| dist > this.maxDist) return;
    const force = p1.r * p2.r * this.strength / (dist * dist);
    if(dist < p1.r + p2.r * 2) {
      // always attract
      p1.ax += 1 * dx / dist;
      p1.ay += 1 * dy / dist;
    } else {  
      p1.ax += (force * dx * this.forceVector.x) / dist;
      p1.ay += (force * dy * this.forceVector.y) / dist;
   }

    return [p1];
  }
}

class Ruleset {
  rules;
  constructor() {
    this.rules = {};
  }

  addRule (type1, type2, rule) {
    if (!this.rules[type1]) this.rules[type1] = {};
    this.rules[type1][type2] = rule;
  }

  apply (p1, p2, i, j) {
    let rule = this.rules[p1.type][p2.type];
    if(!rule) rule = this.rules[p2.type][p1.type];
    if (rule) return rule.apply(p1, p2, i, j);
    return [];
  }

  static createRuleset(types) {
    const rules = new Ruleset();
    types.forEach((type1) => {
      types.forEach((type2) => {
       // if (type1 === type2) return;
        const minDist = random(5, 100);
        const maxDist = random(minDist + 1, 1500);
        const fv = {
          x: random(-1, 1),
          y: random(-1, 1),
        }
        rules.addRule(type1, type2, new AttractionRepulsionRule(random(-50, 50), minDist, maxDist, fv));
      });
    });
    return rules;
  }
}

class Iterator {
  constructor(arr, ruleSet, update, draw) {
    this.arr = arr;
    this.ruleSet = ruleSet;
    this.update = update;
    this.draw = draw
    this.arr.forEach((p1, i) => {
      let collisions = [];
      this.arr.forEach((p2, j) => {
        this.ruleSet.apply(p1, p2, i, j);
        if (this.update) this.update(this.arr[i], this.arr[j], i, j);
        // are the particles colliding?
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p1.r + p2.r && p1 !== p2) {
          collisions.push([p1, p2]);
        }
      });
      collisions.forEach((collision) => {
        const p1 = collision[0];
        const p2 = collision[1];
        // particles take up space and bounnce off each other
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const overlap = (p1.r + p2.r) - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        p1.x -= overlap * nx / 10 
        p1.y -= overlap * ny / 10 
        p2.x += overlap * nx / 10 
        p2.y += overlap * ny / 10 
      }) 
      collisions = [];
      if (this.draw) this.draw(this.arr[i]);
    });
  }
}

function createParticles(num, types) {
  const particles = [];
  for (let i = 0; i < num; i++) {
    particles.push(
      new Particle(
        random(0, canvas.width),
        random(0, canvas.height),
        0,
        0,
        0,
        0,
        random(0.5,0.5), 
        types[Math.floor(random(0, types.length))]
      )
    );
  }
  return particles;
} 

const ruleset = Ruleset.createRuleset(types);
const particles = createParticles(400, types);

// globalalpha is used to fade the particles
ctx.globalAlpha = 0.7;
// set globalCompositeOperation to "lighter" to make the particles glow
ctx.globalCompositeOperation = "darker";

const loop = () => {
  // clear canvas
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
 ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
  //ctx.fillRect(0, 0, canvas.width, canvas.height);
  // update particles
  new Iterator(particles, ruleset, (p1, p2, i, j) => {
    p1.np = 0;
    p2.np = 0;
  })
  new Iterator(particles, ruleset, (p1, p2, i, j) => {
    const nx = p1.x + p1.vx;
    const ny = p1.y + p1.vy;
    const nd = Math.sqrt(nx * nx + ny * ny);
    if(nd > p1.r + p1.r) {
      p1.vx += p1.ax;
      p1.vy += p1.ay;
      p1.x += p1.vx;
      p1.y += p1.vy;
      p1.ax = 0;
      p1.ay = 0;
    }
    // wrap around
    if (p1.x>= width) p1.x = p1.r
    if (p1.x <= 0) p1.x = width - p1.r;
    if (p1.y  >= height) p1.y = p1.r;
    if (p1.y  <= 0) p1.y = height - p1.r;
    // drag
    p1.vx *= 0.993;
    p1.vy *= 0.993;
  }, (p) => {
    // draw particles
    p.draw(particles);
  });
  requestAnimationFrame(loop);
};

loop();