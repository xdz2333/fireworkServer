const glm=glMatrix;
const TRAILLENGTH=300
const TRAILSPACE=parseInt(TRAILLENGTH/20)
const FONTWIDTH=20
const POOLLENGTH=200
function submitComment(e){
    e.preventDefault()
    const form=document.querySelector('.comment-input-area')
    const comments=document.querySelector('.comment-list')
    fetch('/sendComment',{method:'POST',body:new FormData(form)}).then((response)=>{
        fetch("/getComment").then((response) => response.text()).then((data) => comments.innerHTML=data);
        Utils.showMessage('发送成功');
    })
}
function onload() {
    function compileShader(vs, fs) {
        const vsp = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vsp, vs);
        gl.compileShader(vsp);
        const fsp = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fsp, fs);
        gl.compileShader(fsp);
        const prog = gl.createProgram();
        gl.attachShader(prog, vsp);
        gl.attachShader(prog, fsp);
        gl.linkProgram(prog);
        //alert("vertex shader:" + gl.getShaderInfoLog(vsp));
        //alert("fragment shader:" + gl.getShaderInfoLog(fsp));
        return prog;
    }
    var yaw=pi/2
    var pitch=0
    var pMat=perspective(radians(60),16/9,0.01,1000)
    var vMat=lookAt(vec3(0,100,0),vec3(0,100+Math.sin(pitch),Math.cos(pitch)),vec3(0,Math.cos(pitch),-Math.sin(pitch)))
    var pv=mul(pMat,vMat)
    var particles = []
    var dt = 0.005
    var pi = 3.141592653589793
    var mspf = 1000//60
    var needCalc = 0
    class Particle {
        constructor(color, trailColor,mass, pos, aBooster, boosterTime, v1, color1, decayStart, decay) {
            this.color = color
            this.trailColor=trailColor
            if (decayStart > 0) {
                this.decay = scale(color , dt / decay)
            } else {
                this.decay = vec3(0)
            }
            this.decayTrail=scale(trailColor , dt / decay)
            this.decayStart = decayStart
            this.mass = mass
            this.dragC = 0.5 * 0.47 * 1.29 * (0.0030556 / Math.pow(mass, 1 / 3))
            this.pos = new Float32Array(pos)
            this.posList = [new Float32Array(pos)]
            this.v = vec3(0)
            this.aBooster = new Float32Array(aBooster)
            this.stamp = Date.now() / 1000
            this.boosterTime = this.stamp + boosterTime
            this.v1 = v1
            this.color1 = color1
            this.id = particles.length
            this.exploded=false
            this.deleteTrailSpeed=Math.max(parseInt(TRAILLENGTH/(decay/dt)),1)
        }
        step() {
            if(this.exploded){
                this.posList.splice(0,this.deleteTrailSpeed)
                if(this.posList.length == 0){particles[this.id] = null}
                return
            }
            if (Date.now() / 1000 - this.stamp > this.decayStart) {
                if(this.v1?.length!=0){this.posList.splice(0,this.deleteTrailSpeed+1)}
                else{
                    this.color=sub(this.color,this.decay)
                    this.trailColor=sub(this.trailColor,this.decayTrail)
                }
            }
            this.posList.push(new Float32Array(this.pos))
            if (this.posList.length > TRAILLENGTH) {
                this.posList.shift(0)
            }
            this.pos=add(this.pos,scale(this.v,dt))
            if (this.pos[1] < 0 || this.color[0] < 0) {
                particles[this.id] = null
                return
            }
            let vNum = length(this.v)
            this.v=add(this.v,scale(vec3(0, -9.8, 0), dt))
            if (Date.now() / 1000 < this.boosterTime) {
                this.v=add(this.v,scale(this.aBooster, dt))
            }
            if (vNum >= 1) {
                let aDrag = this.dragC * vNum ** 2
                this.v=sub(this.v,scale(normalize(this.v), aDrag * dt))
            }
            if (this.v1?.length>0 && Date.now() / 1000 > this.boosterTime + 2) {
                this.explode()
            }
        }
        explode() {
            for (let i = 0; i < this.v1.length; i++) {
                let newParticle = new Particle(new Float32Array(this.color1[i]), 
                scale(new Float32Array(this.trailColor),0.6),
                this.mass / this.v1.length, new Float32Array(this.pos), vec3(0), 0, [], [], 2, 2)
                newParticle.v=new Float32Array(this.v1[i])
                particles.push(newParticle)
            }
            this.color=vec3(0)
            this.exploded=true
        }
    }
    function flushDanmu(){
        let needDel=[]
        for(let i=0;i<pool.length;i++){
            if(pool[i][1]<-pool[i][0].length*FONTWIDTH){
                needDel.push(i)
            }
        }
        for(let i=0;i<needDel.length;i++){
            pool.splice(needDel[i]-i,1)
        }
        if(pool.length<POOLLENGTH){
            let y=(Math.random()*0.8+0.1)*canvas.height
            pool.push([allDanmu[danmuIndex],canvas.width,parseInt(y)])
            danmuIndex++
            danmuIndex%=allDanmu.length
        }
    }
    function drawDanmu(dt){
        ctx.clearRect(0, 0, canvas.width,canvas.height)
        for(let i=0;i<pool.length;i++){
            ctx.fillText(pool[i][0],pool[i][1],pool[i][2])
            pool[i][1]-=100*dt
        }
    }
    let allDanmu=[]
    let pool=[]
    let danmuIndex=0
    fetch("/getDanmu").then((response) => response.json()).then((data) => allDanmu=data);
    const danmuInp=document.querySelector('.danmu-input')
    document.querySelector('.danmu-submit').onclick=(e)=>{
        e.preventDefault()
        fetch(`/sendDanmu?content=${danmuInp.value}`).then((response)=>{
            fetch("/getDanmu").then((response) => response.json()).then((data) => allDanmu=data);
            Utils.showMessage('发送成功');
        })
        danmuInp.value=""
    }
    const comments=document.querySelector('.comment-list')
    fetch("/getComment").then((response) => response.text()).then((data) => comments.innerHTML=data);
    function draw() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.useProgram(prog1)
        let noneNum = 0
        for (let i = 0; i < particles.length; i++) {
            if (particles[i] == null) {
                noneNum += 1
                continue
            }
            let centerPos = mul(pv , vec4(...particles[i].pos, 1))
            centerPos = scale(centerPos.slice(0,3),1/centerPos.slice(3))
            let centerColor = particles[i].color
            let radius = 1 / length(particles[i].pos)
            gl.uniform3f(gl.getUniformLocation(prog1, `colorIn[${i - noneNum}]`), ...centerColor)
            gl.uniform2f(gl.getUniformLocation(prog1, `partPos[${i - noneNum}]`), ...centerPos.slice(0,2))
            gl.uniform1f(gl.getUniformLocation(prog1, `radius[${i - noneNum}]`), radius)
        }
        gl.uniform1i(gl.getUniformLocation(prog1, `particleNum`), particles.length - noneNum)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        gl.enable(gl.BLEND)
        gl.useProgram(prog2)
        for (let i = 0; i < particles.length; i++) {
            if (particles[i] == null) {
                continue
            }
            let color = particles[i].trailColor
            gl.uniform3f(gl.getUniformLocation(prog2, `colorIn`), ...color)
            gl.uniform1f(gl.getUniformLocation(prog2, `radiusIn`), 1 / length(particles[i].pos))
            let count = 0
            let trailSpace=particles[i].v1?.length?TRAILLENGTH/20:TRAILLENGTH/10
            for (let n = particles[i].posList.length-1; n > 0; n -= TRAILSPACE) {
                let centerPos = mul(pv , vec4(...particles[i].posList[n], 1))
                centerPos = scale(centerPos.slice(0,3),1/centerPos.slice(3))
                gl.uniform2f(gl.getUniformLocation(prog2, `partPos[${count}]`),...centerPos.slice(0,2))
                count += 1
            }
            gl.uniform1i(gl.getUniformLocation(prog2, `trailLength`), count)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }
        gl.disable(gl.BLEND)
    }
    let precision='highp'
    function changeSize(){
        let availW=window.innerWidth-40;
        let availH=window.innerHeight-document.querySelector('.danmu-wrapper').offsetHeight-20;
        let w=h=0;
        if(availW/16*9<availH){
            w=availW
            h=parseInt(availW/16*9)
        }else{
            h=availH
            w=parseInt(availH/9*16)
        }
        let marginTop=parseInt(20+(availH-h)/2);
        let marginLeft=parseInt(20+(availW-w)/2);
        let element=null;
        ['#canvas-gl','#canvas-2d','#placeholder'].forEach((ele)=>{
            element=document.querySelector(ele)
            element.width=w
            element.height=h
            element.style.marginTop=`${marginTop}px`
            element.style.marginLeft=`${marginLeft}px`
        });
        if(w<500||h<500){
            precision='highp'
        }else{
            precision='mediump'
        }
        try{
        gl.viewport(0,0,w,h)
        ctx.font=`${FONTWIDTH}px serif`
        ctx.fillStyle=`rgb(255,255,255)`
        }catch{}
    }
    window.onresize=changeSize
    changeSize()
    const vs = `#version 300 es
    layout(location=0) in vec2 pos1;
    out vec2 pos;
    out vec2 posHalf;
    void main(){
        gl_Position=vec4(pos1,0.0,1.0);
        pos=pos1;
        posHalf=pos*0.5+0.5;
    }
    `
    const fs1 = `#version 300 es
    precision ${precision} float;
    in vec2 pos;
    in vec2 posHalf;
    out vec4 fragcolor;
    uniform float radius[100];
    uniform vec2 partPos[100];
    uniform vec3 colorIn[100];
    uniform int particleNum;
    void main(){
        vec3 color=vec3(0);
        vec2 delta=vec2(0);
        float oneOverDist=0.0;
        for(int i=0;i<particleNum;i++){
            delta=(pos-partPos[i])*vec2(1.0,0.5625);//0.5625=9/16
            if(length(delta)>0.5){continue;}
            oneOverDist=inversesqrt(delta.x*delta.x+delta.y*delta.y);
            color+=clamp(colorIn[i]*(radius[i]*oneOverDist),0.0,1.0);
        }
        color=color/(color+vec3(1.0));
        color=pow(color,vec3(1.0/1.0));
        fragcolor=vec4(color,1.0);
    }
    `
    const fs2 = `#version 300 es
    precision ${precision} float;
    in vec2 pos;
    in vec2 posHalf;
    out vec4 fragcolor;
    uniform float radiusIn;
    uniform vec3 colorIn;
    uniform vec2 partPos[20];
    uniform int trailLength;
    void main(){
        vec3 color=vec3(0.0);
        float fenmu=1.0;
        float brightness=(colorIn.r+colorIn.g+colorIn.b)*2.0;
        for(int i=0;i<trailLength-1;i++){
            if(distance(partPos[i],pos)>0.1){continue;}
            float dist=distance(partPos[i+1],partPos[i]);
            vec2 xaxis=normalize(partPos[i+1]-partPos[i]);
            vec2 yaxis=vec2(-xaxis.y,xaxis.x);
            vec2 pos2=vec2(dot(xaxis,pos-partPos[i]),dot(yaxis,pos-partPos[i]));
            vec3 thisColor=(1.0-float(i)/float(trailLength))*colorIn;
            vec3 nextColor=(1.0-float(i+1)/float(trailLength))*colorIn;
            vec3 colorTemp=mix(thisColor,nextColor,clamp(pos2.x/dist,0.0,1.0));
            //colorTemp=1.0-vec3(float(i)/float(trailLength));
            if(pos2.x<-0.25||pos2.x>dist+0.25||abs(pos2.y)>0.25){continue;}
            else if(pos2.x<0.0){fenmu=distance(pos2,vec2(0,0));}
            else if(pos2.x>dist){fenmu=distance(pos2,vec2(dist,0.0));}
            else{fenmu=abs(pos2.y);}
            float radius=radiusIn*brightness*smoothstep(float(trailLength),max(0.0,float(trailLength-5)),float(i));
            colorTemp*=clamp(radius/fenmu,0.0,1.0);
            color=max(color,colorTemp);
        }
        color=color/(color+vec3(1.0));
        color=pow(color,vec3(1.0/1.0));
        fragcolor=vec4(color,1.0);
        //fragcolor=vec4(1.0);
    }
    `
    function newFirework(pos){
        var v1List = []
        var colorList=[]
        let color=vec3(Math.random(),Math.random(),Math.random())
        let ratio=1.0/Math.max(color[0]+color[1]+color[2],0.1)
        color=scale(color,ratio,1)
        let angle=(Math.random()*pi/4)+3*pi/8

        for (let j = 0; j < 20; j++) {
            let theta=2*pi/20*j
            v1List.push(scale(vec3(Math.cos(theta),Math.sin(theta),0),60))
            colorList.push(scale(color,0.5))
        }
        particles.push(new Particle(scale(color,4),scale(color,1),0.1,pos,vec3(100*Math.cos(angle),100*Math.sin(angle),0)
        ,1.5,v1List,colorList,2,1))
    }
    const canvas = document.getElementById("canvas-gl");
    const gl = canvas.getContext("webgl2");
    const canvas2 = document.getElementById("canvas-2d");
    const ctx = canvas2.getContext("2d");
    ctx.font=`${FONTWIDTH}px serif`
    ctx.fillStyle=`rgb(255,255,255)`
    gl.blendFunc(gl.ONE, gl.ONE)
    gl.blendEquation(gl.MAX)
    const vbo = gl.createBuffer();
    const vertex = [1, -1, 1, 1, -1, -1, -1, 1];
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.enableVertexAttribArray(0);
    const prog1 = compileShader(vs, fs1);
    const prog2 = compileShader(vs, fs2);
    const stamp = Date.now() / 1000
    var calced = drawed = 0
    let flushTimer=Date.now()/1000
    let drawTimer=Date.now()
    //color, trailColor,mass, pos, aBooster, boosterTime, v1, color1, decayStart, deca
    function loop() {
        let shouldCalc = (Date.now() / 1000 - stamp) / dt
        iteration = parseInt(shouldCalc - calced)
        for (let n = 0; n < iteration; n++) {
            particles.forEach(p => {
                if (p != null) {
                    p.step()
                }
            });
        }
        let nullItems=0
        particles.forEach(ele=>{
            if(!ele){nullItems++}
        })
        if(nullItems==particles.length){
            particles=[]
            for(let i=0;i<3;i++){newFirework(vec3(-200+i*200,0,500))}
        }

        calced += iteration

        if(Date.now()/1000-flushTimer>0.5){
            flushTimer=Date.now()/1000
            flushDanmu()
        }

        let shouldDraw = (Date.now() / 1000 - stamp) * 60
        if (shouldDraw - drawed > 1) {
            draw()
            drawDanmu((Date.now()-drawTimer)/1000)
            drawed++
            drawTimer=Date.now()
        }
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
}
