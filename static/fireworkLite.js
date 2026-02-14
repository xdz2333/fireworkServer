const glm=glMatrix;
const TRAILLENGTH=300
const TRAILSPACE=parseInt(TRAILLENGTH/20)
const FONTWIDTH=20
const POOLLENGTH=200
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
        let availH=window.innerHeight-20;
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
        ctx.font=`20px serif`
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
    function newFirework(){
        let v1List2=[]
        let v1List3=[]
        let colorList1=colorList2=colorList3=[]
        let color=vec3(1,0.08,0.58)
        let color1=scale(color,0.25)
        let v1List1=[1.0, 0.896566445415259, 0.8316351542823406, 0.7979258137899886, 0.7913826974149134, 0.8112097829525946,
        0.8598127602370593, 0.9429150670312665, 1.0688904566476987, 1.2429038090337206, 1.4427975309929202, 1.5746823603560363,
        1.5261110213539122, 1.3433859113266815, 1.1501412036138021, 1.0, 1.150141203613803, 1.3433859113266826, 1.5261110213539126,
        1.5746823603560363, 1.442797530992919, 1.2429038090337197, 1.0688904566476982, 0.942915067031266, 0.859812760237059, 
        0.8112097829525945, 0.7913826974149134, 0.7979258137899887, 0.8316351542823409, 0.8965664454152592]
        for(let i=0;i<v1List1.length;i++){
            v1List1[i]=scale(vec3(Math.sin(i/v1List1.length*2*pi),-Math.cos(i/v1List1.length*2*pi),0),60*v1List1[i])
            colorList1.push(color1)
        }
        for(let i=-60;i<=60;i+=10){
            v1List2.push(vec3(0,i,0))
            colorList2.push(color1)
        }
        let v1List31=[0.0,0.20943951023931953,0.41887902047863906,0.6283185307179586,0.8377580409572781]
        let v1List32=[0.0,0.20943951023931953,0.41887902047863906,0.6283185307179586,0.8377580409572781,1.0471975511965976,
        1.2566370614359172,1.4660765716752366,1.6755160819145563,1.8849555921538759,2.0943951023931953,2.3038346126325147,
        2.5132741228718345,2.722713633111154,2.9321531433504733]
        for(let i=0;i<v1List31.length;i++){
            v1List3.push(scale(vec3(Math.cos(v1List31[i]),Math.sin(v1List31[i]),0),40/Math.cos(v1List31[i])))
            colorList3.push(color1)
        }
        for(let i=0;i<v1List31.length;i++){
            v1List3.push(scale(vec3(-Math.cos(v1List31[i]),Math.sin(v1List31[i]),0),40/Math.cos(v1List31[i])))
            colorList3.push(color1)
        }
        for(let i=0;i<v1List32.length;i++){
            v1List3.push(scale(vec3(Math.cos(v1List32[i]),-Math.sin(v1List32[i]),0),40))
            colorList3.push(color1)
        }
        particles.push(new Particle(scale(color,4),scale(color,1),0.1,vec3(0,0,500),vec3(0,80,0),1.3,v1List1,colorList1,2,1))
        particles.push(new Particle(scale(color,4),scale(color,1),0.1,vec3(0,0,500),vec3(80,80,0),1.3,v1List2,colorList2,2,1))
        particles.push(new Particle(scale(color,4),scale(color,1),0.1,vec3(0,0,500),vec3(-80,80,0),1.3,v1List3,colorList3,2,1))
    }
    const canvas = document.getElementById("canvas-gl");
    const gl = canvas.getContext("webgl2");
    const canvas2=document.getElementById("canvas-2d");
    const ctx = canvas2.getContext("2d");
    ctx.font=`20px serif`
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
    let drawTimer=Date.now()
    setTimeout(()=>{
        ctx.clearRect(0,0,canvas.width,canvas.height)
        newFirework()
    },5000)
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
        calced += iteration

        let shouldDraw = (Date.now() / 1000 - stamp) * 60
        if (shouldDraw - drawed > 1) {
            draw()
            if(Date.now()-drawTimer<5000){
                ctx.clearRect(0,0,canvas.width,canvas.height)
                ctx.fillText("根据我的设计，网页访问一次后就会自动被删除，",50,100)
                ctx.fillText("换句话说，这个网页全世界只有你能看到，",50,150)
                ctx.fillText("并且只能看到一次，好奇的话欢迎录屏，",50,200)
                ctx.fillText("彩蛋还有5秒开始",50,250)
            }else if(Date.now()-drawTimer>12000){
                ctx.clearRect(0,0,canvas.width,canvas.height)
                ctx.fillText("其实，我暗恋你很久了，这个放烟花小程序，",50,100)
                ctx.fillText("本来想发给你的，但是又不太敢",50,150)
                ctx.fillText("所以我挑了这么个日子，趁此机会，",50,200)
                ctx.fillText("想和你说一句，hyc我喜欢你！！！",50,250)
            }
            drawed++
        }
        requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
}