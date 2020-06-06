const MOVE_MODE = "move"
const VERTEX_MODE = "vertex"
const EDGE_MODE = "edge"

const VERTEX_RADIUS = 20

function GetImg(id) {
    return document.getElementById(id)
}

function Graph(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    this.x0 = 0
    this.y0 = 0

    this.InitControls()

    this.vertices = []
    this.edges = []

    this.prevPoint = null
    this.isPressed = false
    this.moveIndex = -1
    
    this.vertexColor = '#40bfbf'
    this.vertexSelectedColor = '#62dfdf'
    this.activeColor = '#40bfbf'
}

// инициализация элементов управления
Graph.prototype.InitControls = function() {
    this.controls = []
    this.controlsIndex = 0

    this.controls.push({ name: MOVE_MODE, character: "M", icon: GetImg("move-icon"), activeIcon: GetImg("move-icon-active") })
    this.controls.push({ name: VERTEX_MODE, character: "V", icon: GetImg("vertex-icon"), activeIcon: GetImg("vertex-icon-active") })
    this.controls.push({ name: EDGE_MODE, character: "E", icon: GetImg("edge-icon"), activeIcon: GetImg("edge-icon-active") })
    
    this.cw = 45 // размер клетки элементов управления
    this.ch = this.cw * this.controls.length
    this.cx0 = this.canvas.width - 10 - this.cw
    this.cy0 = 10
}

// проверка, что курсор мыши находится на элементах управления
Graph.prototype.IsMouseInControls = function(mx, my) {
    if (mx < this.cx0 || mx >= this.cx0 + this.cw)
        return false

    if (my < this.cy0 || my >= this.cy0 + this.ch)
        return false

    return true
}

// получение активного режима
Graph.prototype.GetControl = function() {
    return this.controls[this.controlsIndex].name
}

// обработка клика мыши по элементу управления
Graph.prototype.ControlsMouseDown = function(mx, my) {
    this.controlsIndex = Math.floor((my - this.cy0) / this.cw)
}

// обработка перемещения мыши внутри элементов управления
Graph.prototype.ControlsMouseMove = function(mx, my) {
    let index = Math.floor((my - this.cy0) / this.cw)

    if (index != this.controlsIndex)
        this.canvas.style.cursor = "pointer"
}


// перемещение центра
Graph.prototype.MoveCenter = function(mx, my) {
    if (!this.isPressed)
        return

    this.x0 += mx - this.prevPoint.x
    this.y0 += my - this.prevPoint.y

    this.prevPoint.x = mx
    this.prevPoint.y = my
}

// получение индекса вершины по точке
Graph.prototype.IndexOfVertex = function(mx, my, delta=VERTEX_RADIUS*VERTEX_RADIUS) {
    for (let i = 0; i < this.vertices.length; i++) {
        let dx = mx - this.vertices[i].x - this.x0
        let dy = my - this.vertices[i].y - this.y0
        let dst = dx*dx + dy*dy

        if (dst < delta)
            return i
    }

    return -1
}

// добавление новой вершины
Graph.prototype.AddVertex = function(mx, my) {
    this.moveIndex = this.IndexOfVertex(mx, my, VERTEX_RADIUS * VERTEX_RADIUS * 4)
    
    if (this.moveIndex == -1)
        this.vertices.push({ x: mx - this.x0, y: my - this.y0 })
}

// удаление вершины
Graph.prototype.RemoveVertex = function(mx, my) {
    let index = this.IndexOfVertex(mx, my)

    if (index > -1)
        this.vertices.splice(index, 1)
}

// обработка перемещения вершины
Graph.prototype.MoveVertex = function(mx, my) {
    if (this.moveIndex > -1) {        
        if (this.isPressed) {
            let x = this.vertices[this.moveIndex].x + mx - this.prevPoint.x
            let y = this.vertices[this.moveIndex].y + my - this.prevPoint.y

            this.vertices[this.moveIndex].x = x
            this.vertices[this.moveIndex].y = y
        
            this.prevPoint.x = mx
            this.prevPoint.y = my
        }
        
        this.Draw()
        this.DrawVertex(this.vertices[this.moveIndex], this.moveIndex + 1, true)
        return;
    }

    this.Draw()
    let index = this.IndexOfVertex(mx, my)

    if (index > -1) {
        this.DrawVertex(this.vertices[index], index + 1, true)
        this.canvas.style.cursor = "pointer"
    }
}

// обработка нажатия кнопки мыши
Graph.prototype.MouseDown = function(e) {
    if (this.IsMouseInControls(e.offsetX, e.offsetY)) {
        this.ControlsMouseDown(e.offsetX, e.offsetY)
        this.Draw()
        return
    }

    if (this.GetControl() == VERTEX_MODE) {
        if (e.button == 0)
            this.AddVertex(e.offsetX, e.offsetY)
        else
            this.RemoveVertex(e.offsetX, e.offsetY)

        this.Draw()
    }

    this.prevPoint = { x: e.offsetX, y: e.offsetY }
    this.isPressed = true
}

// обработка отпускания кнопки мыши
Graph.prototype.MouseUp = function(e) {
    this.prevPoint = null
    this.isPressed = false
    this.moveIndex = -1
}

// обработка перемещения мыши
Graph.prototype.MouseMove = function(e) {
    this.canvas.style.cursor = "default"

    if (this.IsMouseInControls(e.offsetX, e.offsetY)) {
        this.ControlsMouseMove(e.offsetX, e.offsetY)
        this.Draw()
        return
    }

    if (this.GetControl() == MOVE_MODE) {
        this.MoveCenter(e.offsetX, e.offsetY)
        this.Draw()
        return
    }

    if (this.GetControl() == VERTEX_MODE) {
        this.MoveVertex(e.offsetX, e.offsetY)
    }
}

// обработка прокрутки колеса мыши
Graph.prototype.MouseWheel = function(e) {
    let direction = e.deltaY > 0 ? 1 : -1

    this.controlsIndex = (this.controlsIndex + this.controls.length + direction) % this.controls.length
    this.Draw()
}

// отрисовка элементов управления
Graph.prototype.DrawControls = function() {
    this.ctx.font = this.cw / 1.8 + "px Arial"
    this.ctx.textAlign = "center"
    this.ctx.textBaseline = "middle"

    for (let i = 0; i < this.controls.length; i++) {
        this.ctx.beginPath()
        this.ctx.rect(this.cx0, this.cy0 + i * this.cw, this.cw, this.cw)
        this.ctx.strokeStyle = '#000'
        this.ctx.stroke()

        if (this.controls[i].icon != null) {
            let icon = i == this.controlsIndex ? this.controls[i].activeIcon : this.controls[i].icon
            this.ctx.drawImage(icon, this.cx0 + 2, this.cy0 + i * this.cw + 2, this.cw - 4, this.cw - 4)
        }
        else {
            this.ctx.fillStyle = i == this.controlsIndex ? this.activeColor : "#000"
            this.ctx.fillText(this.controls[i].character, this.cx0 + this.cw / 2, this.cy0 + (i + 0.5) * this.cw)
        }
    }
}

// отрисовка вершины
Graph.prototype.DrawVertex = function(vertex, name, selected=false) {
    let x = vertex.x + this.x0
    let y = vertex.y + this.y0

    this.ctx.beginPath()
    this.ctx.arc(x, y, VERTEX_RADIUS, 0, Math.PI * 2)

    if (selected) {
        this.ctx.fillStyle = this.vertexSelectedColor
        this.ctx.fill()
        this.ctx.fillStyle = '#fff'
    }
    else {
        this.ctx.strokeStyle = this.vertexColor
        this.ctx.stroke()        
        this.ctx.fillStyle = this.vertexColor
    }

    this.ctx.fillText(name, x, y)
}

// отрисовка вершин
Graph.prototype.DrawVertices = function() {
    for (let i = 0; i < this.vertices.length; i++) {
        this.DrawVertex(this.vertices[i], i + 1)
    }
}

// отрисовка интерфейса
Graph.prototype.Draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.DrawVertices()
    this.DrawControls()
}