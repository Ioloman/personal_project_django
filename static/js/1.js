let projection = {
    axonometrix: true,
    x: [1, 2],
    y: [0, 2],
    z: [0, 1],
    translation: {x: -5, y: -50, z: -20},
    surface: 'x',
    angleX: new Degrees(0),
    angleY: new Degrees(-25),
    angleZ: new Degrees(15),
    scale: [5, 5, 5]
}

let elem = document.getElementById('angles');
elem.children.x.value = String(projection.angleX.degree);
elem.children.y.value = String(projection.angleY.degree);
elem.children.z.value = String(projection.angleZ.degree);

elem = document.getElementById('translate');
elem.children.x.value = String(projection.translation.x);
elem.children.y.value = String(projection.translation.y);
elem.children.z.value = String(projection.translation.z);

document.getElementById('project').onclick = function(){
    if (Number(document.getElementById('projection_type').value)){
        projection.axonometrix = true;
        projection.surface = document.getElementById('projection_surface').value;
        projection.angleX.set(Number(document.getElementById('angles').children.x.value));
        projection.angleY.set(Number(document.getElementById('angles').children.y.value));
        projection.angleZ.set(Number(document.getElementById('angles').children.z.value));

        projection.translation.x = Number(document.getElementById('translate').children.x.value);
        projection.translation.y = Number(document.getElementById('translate').children.y.value);
        projection.translation.z = Number(document.getElementById('translate').children.z.value);
    } else {
        projection.axonometrix = false;
        projection.surface = 'z'
    }
}

let controls = new Controls();

function Degrees(degree){
    this.degree = degree;
    this.get = function () {
        return (Math.PI / 180) * this.degree;
    }
    this.set = function (set_degree) {
        this.degree = set_degree;
    }
}

function Shape(points, edges, ctx, style, affine=false){
    this.points3D = points;
    this.edges = edges;
    this.style = style;
    this.ctx = ctx;
    this.project = function () {
        this.points2D = getProjection(scale(this.points3D, ...(projection.scale)));
    }
    this.project();
    this.draw = function () {
        this.project();
        drawShape(this.ctx, this.points2D, this.edges, this.style);
    }
    if (affine){
        this.controls = controls;

        this.rotate_angle = 0.8;
        this.scale_speed = 1.006;
        this.move_speed = 0.3;
        this.custom_params = {basic_speed: 0.2, speed: 0.2, basic_angle: 3, angle: 3, slow: 0.994};
        this.rotate = function (x, y, z, rotateAngle) {
            let matrix = math.matrix([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]);
            let angle = new Degrees(rotateAngle).get();
            if (x){
                matrix = math.multiply(
                    matrix,
                    [
                        [1, 0, 0, 0],
                        [0, Math.cos(angle), Math.sin(angle), 0],
                        [0, - Math.sin(angle), Math.cos(angle), 0],
                        [0, 0, 0, 1]
                    ]
                )
            }
            if (y){
                matrix = math.multiply(
                    matrix,
                    [
                        [Math.cos(angle), 0, - Math.sin(angle), 0],
                        [0, 1, 0, 0],
                        [Math.sin(angle), 0, Math.cos(angle), 0],
                        [0, 0, 0, 1]
                    ]
                )
            }
            if (z){
                matrix = math.multiply(
                    matrix,
                    [
                        [Math.cos(angle), Math.sin(angle), 0, 0],
                        [- Math.sin(angle), Math.cos(angle), 0, 0],
                        [0, 0, 1, 0],
                        [0, 0, 0, 1]
                    ]
                )
            }
            this.points3D = math.multiply(this.points3D, matrix);
        }
        this.scale = function (x, y, z, all) {
            let alpha, betta, gamma;
            if (x) {
                if (x === '+')
                    alpha = this.scale_speed;
                else if (x === '-')
                    alpha = 1 / this.scale_speed;
            } else
                alpha = 1;
            if (y) {
                if (y === '+')
                    betta = this.scale_speed;
                else if (y === '-')
                    betta = 1 / this.scale_speed;
            } else
                betta = 1;
            if (z) {
                if (z === '+')
                    gamma = this.scale_speed;
                else if (z === '-')
                    gamma = 1 / this.scale_speed;
            } else
                gamma = 1;
            if (all) {
                if (all === '+')
                    [alpha, betta, gamma] = [this.scale_speed, this.scale_speed, this.scale_speed];
                else if (all === '-')
                    [alpha, betta, gamma] = [1 / this.scale_speed, 1 / this.scale_speed, 1 / this.scale_speed];
            }
            let matrix = math.matrix([
                [alpha, 0, 0, 0],
                [0, betta, 0, 0],
                [0, 0, gamma, 0],
                [0, 0, 0, 1]
            ])
            this.points3D = math.multiply(this.points3D, matrix);
        }
        this.move = function (enable, x, z, speed) {
            if (enable){
                let angleX = new Degrees(x).get();
                let angleZ = new Degrees(z).get();
                let matrix = math.matrix([
                    [1, 0, 0, 0],
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [Math.cos(angleX) * speed,
                        Math.sin(angleX) * speed,
                        Math.sin(angleZ) * speed,
                        1]
                ]);
                if (x === 360){
                    matrix._data[3][0] = 0;
                    matrix._data[3][1] = 0;
                }
                this.points3D = math.multiply(this.points3D, matrix);
            }
        }
        this.custom = function (x, y, z) {
            if (x){
                this.rotate(true, false, false, this.custom_params.angle);
                this.move(true, 0, 0, this.custom_params.speed);
            } else if (y){
                this.rotate(false, true, false, this.custom_params.angle);
                this.move(true, 90, 0, this.custom_params.speed);
            } else if (z){
                this.rotate(false, false, true, this.custom_params.angle);
                this.move(true, 360, 90, this.custom_params.speed);
            }
            this.custom_params.speed *= this.custom_params.slow;
            this.custom_params.angle *= this.custom_params.slow;
        }
        this.updateAndDraw = function () {
            this.rotate(this.controls.rotate.x, this.controls.rotate.y, this.controls.rotate.z, this.rotate_angle);
            this.scale(this.controls.scale.x, this.controls.scale.y, this.controls.scale.z, this.controls.scale.all);
            this.move(this.controls.move.enable, this.controls.move.x, this.controls.move.z, this.move_speed);
            this.custom(this.controls.custom.x, this.controls.custom.y, this.controls.custom.z);
            this.draw();
        }
    }

}

function Controls() {
    this.rotate = {x: false, y: false, z: false};
    this.scale = {x: false, y: false, z: false, all: false};
    this.move = {enable: false, x: 360 / 2, z: 360 / 2};
    this.custom = {x: false, y: false, z: false, stop: true};
    // rotate handlers
    for (let v in this.rotate) {
        document.getElementById('rotate_input').children[v].onclick = function () {
            if (document.getElementById('rotate_input').children[v].checked)
                controls.rotate[v] = true;
            else
                controls.rotate[v] = false;
        }
    }
    // scale handlers
    for (let v in this.scale){
        document.getElementById('scale_input').children[v + '+'].onclick = function () {
            if (controls.scale[v] === '+')
                controls.scale[v] = false;
            else
                controls.scale[v] = '+';
        }
        document.getElementById('scale_input').children[v + '-'].onclick = function () {
            if (controls.scale[v] === '-')
                controls.scale[v] = false;
            else
                controls.scale[v] = '-';
        }

    }
    // move handlers
    document.getElementById('move_button').onclick = function () {
        let button = document.getElementById('move_button');
        if (button.textContent === 'Двигаться')
            button.textContent = 'Остановиться';
        else
            button.textContent = 'Двигаться';
        if (controls.move.enable === true)
            controls.move.enable = false;
        else
            controls.move.enable = true;
    }
    document.getElementById('horizontal').onclick = function () {
        controls.move.x = Number(document.getElementById('horizontal').value);
    }
    document.getElementById('vertical').onclick = function () {
        controls.move.z = Number(document.getElementById('vertical').value);
    }
    // custom handlers
    for (let v in this.custom){
        document.getElementById('custom_input').children[v].onclick = function () {
            controls.custom = {x: false, y: false, z: false, stop: false};
            controls.custom[v] = true;
            square.custom_params.speed = square.custom_params.basic_speed;
            square.custom_params.angle = square.custom_params.basic_angle;
        }
    }

}

function setUpCanvas(canvasId){
    let canvas = document.getElementById(canvasId);

    canvas.setAttribute('width', window.screen.availWidth - 300);
    canvas.setAttribute('height', window.screen.availHeight - 200);
    let ctx = canvas.getContext('2d');
    translateContext(ctx);
    return ctx;
}

function translateContext(ctx) {
    const scaleCoefficient = 3;
    ctx.translate(0, ctx.canvas.height);
    ctx.scale(1, -1);
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.scale(scaleCoefficient, scaleCoefficient);
    ctx.height = ctx.canvas.height / scaleCoefficient;
    ctx.width = ctx.canvas.width / scaleCoefficient;
    ctx.startX = - ctx.width / 2;
    ctx.startY = - ctx.height / 2;
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


function getProjection(points) {
    let projectionMatrix;
    if (projection.axonometrix) {
        projectionMatrix = math.multiply(
            [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ],
            [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [projection.translation.x, projection.translation.y, projection.translation.z, 1]
            ]
        );
        // вокруг y
        let angle = projection.angleY.get();
        projectionMatrix = math.multiply(
            projectionMatrix,
            [
                [Math.cos(angle), 0, -Math.sin(angle), 0],
                [0, 1, 0, 0],
                [Math.sin(angle), 0, Math.cos(angle), 0],
                [0, 0, 0, 1]
            ]
        );
        //вокруг z
        angle = projection.angleZ.get();
        projectionMatrix = math.multiply(
            projectionMatrix,
            [
                [Math.cos(angle), Math.sin(angle), 0, 0],
                [-Math.sin(angle), Math.cos(angle), 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ]
        );
        //вокруг x
        angle = projection.angleX.get();
        projectionMatrix = math.multiply(
            projectionMatrix,
            [
                [1, 0, 0, 0],
                [0, Math.cos(angle), Math.sin(angle), 0],
                [0, -Math.sin(angle), Math.cos(angle), 0],
                [0, 0, 0, 1]
            ]
        );
    }
    else {
        const F = 0.5;
        const ANGLE = 45 * (Math.PI / 180);

        projectionMatrix = math.matrix([
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [-F * Math.cos(ANGLE), -F * Math.sin(ANGLE), 0, 0],
            [0, 0, 0, 1],
        ]);
    }
    return math.multiply(points, projectionMatrix);
}

function scale(points, x, y, z) {
    return math.multiply(
        points,
        [
            [x, 0, 0, 0],
            [0, y, 0, 0],
            [0, 0, z, 0],
            [0, 0, 0, 1],
        ]
    )
}

function drawShape(ctx, points, edges, style='yellow') {
    ctx.strokeStyle = style;
    for (let i = 0; i < math.size(edges)._data[0]; i++) {
        drawLine(ctx, points._data[edges._data[i][0]], points._data[edges._data[i][1]]);
    }
}

function drawLine(ctx, a, b) {
    let [i1, i2] = projection[projection.surface];
    ctx.beginPath();
    ctx.moveTo(a[i1], a[i2]);
    ctx.lineTo(b[i1], b[i2]);
    ctx.stroke();
}

let ctx = setUpCanvas('canvas');
let axis = new Shape(axis_points, axis_edges, ctx, 'yellow');
axis.write = function (){
    let [i1, i2] = projection[projection.surface];
    let letters = ['x', 'y', 'z']
    this.ctx.font = '10px serif';
    this.ctx.fillStyle = 'black';
    this.ctx.scale(1, -1);
    for (let i = 1; i < this.points2D._size[0]; i++){
        this.ctx.fillText(letters[i-1], this.points2D._data[i][i1], -this.points2D._data[i][i2], 5);
    }
    this.ctx.scale(1, -1);
}
let square = new Shape(figurePoints, figureEdges, ctx, 'rgb(213,59,180)', true);
function run() {
    ctx.clearRect(ctx.startX, ctx.startY, ctx.width, ctx.height);
    ctx.drawImage(ctx.canvas.offScreenCanvas, ctx.startX, ctx.startY);


    axis.project();
    axis.draw();
    axis.write();

    square.updateAndDraw();
}


function main(){

    createOffScreenCanvas(ctx.canvas);
    ctx.lineCap = 'round';

    window.setInterval(run, 20);

}
main()