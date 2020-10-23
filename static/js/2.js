Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (let i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}

function Controls() {
    this.choose = 'line';
    this.delay = 250;
    this.hold = false
    document.getElementById('choose').children['delay'].value = this.delay
    document.getElementById('choose').children['delay_button'].onclick = function () {
        controls.delay = Number(document.getElementById('choose').children['delay'].value);
    }
    document.getElementById('choose').children['stop_button'].onclick = function () {
        if (controls.hold){
            controls.hold = false
            document.getElementById('choose').children['stop_button'].value = 'Стоп'
        }
        else{
            controls.hold = true
            document.getElementById('choose').children['stop_button'].value = 'Продолжить'
        }
    }
    document.getElementById('choose').children['line'].onclick = function () {
        controls.choose = 'line'
    }
    document.getElementById('choose').children['pixel'].onclick = function () {
        controls.choose = 'pixel'
    }
    this.zBuffer = document.getElementById('z_buffer')
    this.zBuffer.setAttribute('width', window.screen.availWidth - 300);
    this.zBuffer.setAttribute('height', 10);
    this.zBuffer = this.zBuffer.getContext('2d')
    translateContext(this.zBuffer)
    this.draw = function (zBuffer) {
        for (let i = 0; i < zBuffer.length; i++) {
            if (zBuffer[i] === Number.NEGATIVE_INFINITY)
                this.zBuffer.fillStyle = 'rgb(0, 0, 0)'
            else {
                let coef = 255 / max(zBuffer)
                this.zBuffer.fillStyle = `rgb(${zBuffer[i] * coef}, ${zBuffer[i] * coef}, ${zBuffer[i] * coef})`
            }
            this.zBuffer.fillRect(i, 0, 1, this.zBuffer.height)
        }

    }
    this.info = {}
    this.updateInfo = function (name, pair, i) {
        this.info[name] = pair
        this.i = i
        let text = `Скан. строка: ${i}\n`
        for (let v in this.info){
            if (this.info[v])
                text += `Имя фигуры: ${v}, левое ребро (${this.info[v].left.edge[0]}) -> (${this.info[v].left.edge[1]}), 
                правое ребро (${this.info[v].right.edge[0]}) -> (${this.info[v].right.edge[1]})
                активно с скан. строки ${this.info[v].active.min} по ${this.info[v].active.max}\n\n`
            else
                text += `Имя фигуры: ${v}, неактивна\n`
        }
        document.getElementById('info').innerText = text
    }

}

let controls = new Controls()

function max(array) {
    let el = Number.NEGATIVE_INFINITY
    for (let i = 0; i < array.length; i++)
        if (array[i] > el)
            el = array[i]
    return el
}

function Shape(edges, color, name) {
    this.name = name
    this.color = color;
    this.edges = edges;
    this.edges.forEach(function (edge) {
        if (edge[0][1] > edge[1][1]) {
            let swap = edge[0]
            edge[0] = edge[1]
            edge[1] = swap
        }
    })

    this.points = []
    var self = this;
    this.edges.forEach(function (edge) {
        edge.forEach(function (point) {
            let check = false;
            self.points.forEach(function (p) {
                if (p.equals(point))
                    check = true;
            })
            if (!check)
                self.points.push(point)
        })
    })

    this.equation = {a: 0, b: 0, c: 0, d: 0}
    for (let i = 0; i < this.points.length; i++) {
        let j;
        if (i === this.points.length - 1)
            j = 0;
        else
            j = i + 1
        this.equation.a += (this.points[i][1] - this.points[j][1]) * (this.points[i][2] + this.points[j][2])
        this.equation.b += (this.points[i][2] - this.points[j][2]) * (this.points[i][0] + this.points[j][0])
        this.equation.c += (this.points[i][0] - this.points[j][0]) * (this.points[i][1] + this.points[j][1])
    }
    this.equation.d = -(this.equation.a * this.points[0][0] + this.equation.b * this.points[0][1] + this.equation.c * this.points[0][2])
    this.getZ = function(x, y){
        return -(this.equation.a * x + this.equation.b * y + this.equation.d) / this.equation.c
    }

    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;
    this.points.forEach(function (point) {
        if (point[1] < min)
            min = Math.round(point[1]);
        else if (point[1] > max)
            max = Math.round(point[1]);
    })
    this.active = {min: min, max: max};

    this.pairs = []
    let pair = []
    let oldPair = []
    oldPair.start = null
    for (let i = this.active.min; i <= this.active.max + 1; i++) {
        pair = []
        this.edges.forEach(function (edge) {
            if ((i + 0.5) > edge[0][1] && (i + 0.5) < edge[1][1])
                pair.push(edge)
        })
        if (!pair.equals(oldPair)) {
            if (oldPair.start) {
                let right, left;
                if (oldPair[0][0][0] > oldPair[1][0][0])
                    [right, left] = oldPair
                else if (oldPair[0][1][0] > oldPair[1][1][0])
                    [right, left] = oldPair
                else
                    [left, right] = oldPair
                this.pairs.push(new Pair(right, left, oldPair.start, i))
            }
            oldPair = pair
            oldPair.start = i

        }
    }
    this.getPair = function (y) {
        for (let i = 0; i < this.pairs.length; i++){
            if ((this.pairs[i].active.min < y) && (this.pairs[i].active.max > y))
                return this.pairs[i];
        }
    }

}


function Pair(right, left, from, to) {
    function getFunction(a, b) {
        function res(y){
            let xPair = b[0] - a[0]
            let yPair = b[1] - a[1]
            return xPair * y / yPair + (a[0] - xPair * a[1] / yPair)
        }
        return res
    }
    this.right = {edge: right, f: getFunction(right[0], right[1])}
    this.left = {edge: left, f: getFunction(left[0], left[1])}
    this.active = {min: from, max: to};

}

function setUpCanvas(canvasId) {
    let canvas = document.getElementById(canvasId);

    canvas.setAttribute('width', window.screen.availWidth - 300);
    canvas.setAttribute('height', window.screen.availHeight - 200);
    let ctx = canvas.getContext('2d');
    translateContext(ctx);
    ctx.drawPixel = function (x, y, color) {
        this.fillStyle = color
        this.fillRect(x, y, 1, 1)
    }
    return ctx;
}

function translateContext(ctx) {
    const scaleCoefficient = 2;
    ctx.translate(0, ctx.canvas.height);
    ctx.scale(1, -1);
    ctx.scale(scaleCoefficient, scaleCoefficient);
    ctx.height = ctx.canvas.height / scaleCoefficient;
    ctx.width = ctx.canvas.width / scaleCoefficient;
    ctx.startX = 0;
    ctx.startY = 0;
}


function drawBackground(ctx) {
    ctx.fillStyle = 'rgb(166,173,232)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'rgb(14, 4, 142)';
    ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}


function createOffScreenCanvas(canvas) {
    canvas.offScreenCanvas = document.createElement('canvas');
    canvas.offScreenCanvas.width = canvas.getContext('2d').width;
    canvas.offScreenCanvas.height = canvas.getContext('2d').height;
    let ctx = canvas.offScreenCanvas.getContext('2d');
    ctx.translate(0, ctx.canvas.height);
    ctx.scale(1, -1);

    drawBackground(ctx);
}

function middle(i) {
    return i + 0.5
}

function fill(arr, value) {
    for (let i = 0; i < arr.length; i++)
        arr[i] = value;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function draw(ctx, figures) {
    for (let i = ctx.startY; i <= ctx.startY + ctx.height; i++){
        let zBuffer = Array(Math.round(ctx.width));
        let realBuffer = Array(Math.round(ctx.width));
        let oldBuffer;
        fill(zBuffer, Number.NEGATIVE_INFINITY);
        fill(realBuffer, null);
        for (let f = 0; f < figures.length; f++){
            let pair = figures[f].getPair(middle(i));
            oldBuffer = realBuffer.slice()
            if (pair) {
                let [a, b] = [pair.left.f(middle(i)), pair.right.f(middle(i))]
                for (let j = ctx.startX; j <= ctx.startX + ctx.width; j++) {
                    if (middle(j) > a && middle(j) < b){
                        // if (figures[f].name === 'длинный зеленый прямоуг')
                        //         console.log(figures[f].getZ(middle(j), middle(i)))
                        if (figures[f].getZ(middle(j), middle(i)) > zBuffer[j]){
                            zBuffer[j] = figures[f].getZ(middle(j), middle(i));
                            realBuffer[j] = figures[f].color;
                        }
                    }
                }
            }
            controls.updateInfo(figures[f].name, pair, i)
            controls.draw(zBuffer)
            if (!realBuffer.equals(oldBuffer)) {
                for (let k = 0; k <= realBuffer.length; k++) {
                    if (realBuffer[k]) {
                        ctx.drawPixel(ctx.startX + k, i, realBuffer[k]);
                        if (controls.choose === 'pixel')
                            await sleep(controls.delay)
                    }
                }
                if (controls.choose === 'line')
                    await sleep(controls.delay)
            }
            while (controls.hold){
                await sleep(200)
            }
        }
    }
}

function main() {
    let ctx = setUpCanvas('canvas');
    createOffScreenCanvas(ctx.canvas);
    ctx.drawImage(ctx.canvas.offScreenCanvas, ctx.startX, ctx.startY);

    let rect = new Shape(rectangle, 'black', 'прямоуг')
    let trio = new Shape(triangle, 'yellow', 'треуг')
    let longRect = new Shape(long, 'red', 'длинный красный прямоуг')
    let many = new Shape(six, 'blue', 'шестиуг')
    let longRect2 = new Shape(long2, 'green', 'длинный зеленый прямоуг')
    console.log(longRect2)
    draw(ctx, [rect, trio, longRect, many, longRect2])
}
main()