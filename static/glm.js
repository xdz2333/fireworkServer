function vec3(){
    let out;
    switch(arguments.length){
        case 1:
            out=glMatrix.vec3.fromValues(arguments[0],arguments[0],arguments[0]);
            break;
        case 3:
            out=glMatrix.vec3.fromValues(...arguments);
            break;
    }
    return out;
}
function vec4(){
    let out;
    switch(arguments.length){
        case 1:
            out=glMatrix.vec4.fromValues(arguments[0],arguments[0],arguments[0],arguments[0]);
            break;
        case 4:
            out=glMatrix.vec4.fromValues(...arguments);
            break;
    }
    return out;
}
function vec2(){
    let out;
    switch(arguments.length){
        case 1:
            out=glMatrix.vec2.fromValues(arguments[0],arguments[0]);
            break;
        case 2:
            out=glMatrix.vec2.fromValues(...arguments);
            break;
    }
    return out;
}
function scale(vector,scaler){
    let out;
    switch(vector.length){
        case 2:
            out=glMatrix.vec2.create();
            glMatrix.vec2.scale(out,vector,scaler);
            break;
        case 3:
            out=glMatrix.vec3.create();
            glMatrix.vec3.scale(out,vector,scaler);
            break;
        case 4:
            out=glMatrix.vec4.create();
            glMatrix.vec4.scale(out,vector,scaler);
            break;
    }
    return out;
}
function add(vector1,vector2){
    let out;
    switch(vector1.length){
        case 2:
            out=glMatrix.vec2.create();
            glMatrix.vec2.add(out,vector1,vector2);
            break;
        case 3:
            out=glMatrix.vec3.create();
            glMatrix.vec3.add(out,vector1,vector2);
            break;
        case 4:
            out=glMatrix.vec4.create();
            glMatrix.vec4.add(out,vector1,vector2);
            break;
    }
    return out;
}
function sub(vector1,vector2){
    let out;
    switch(vector1.length){
        case 2:
            out=glMatrix.vec2.create();
            glMatrix.vec2.subtract(out,vector1,vector2);
            break;
        case 3:
            out=glMatrix.vec3.create();
            glMatrix.vec3.subtract(out,vector1,vector2);
            break;
        case 4:
            out=glMatrix.vec4.create();
            glMatrix.vec4.subtract(out,vector1,vector2);
            break;
    }
    return out;
}
function mul(vector1,vector2){
    let out;
    switch(vector1.length){
        case 2:
            out=glMatrix.vec2.create();
            glMatrix.vec2.multiply(out,vector1,vector2);
            break;
        case 3:
            out=glMatrix.vec3.create();
            glMatrix.vec3.multiply(out,vector1,vector2);
            break;
        case 4:
            out=glMatrix.vec4.create();
            glMatrix.vec4.multiply(out,vector1,vector2);
            break;
        case 16:
            if(vector2.length==4){
                out=glMatrix.vec4.create();
                glMatrix.mat4.multiply(out,vector1,vector2);
            }else if(vector2.length==16){
                out=glMatrix.mat4.create();
                glMatrix.mat4.multiply(out,vector1,vector2);
            }
            break;
    }
    return out;
}
function div(vector1,vector2){
    let out;
    switch(vector1.length){
        case 2:
            out=glMatrix.vec2.create();
            glMatrix.vec2.divide(out,vector1,vector2);
            break;
        case 3:
            out=glMatrix.vec3.create();
            glMatrix.vec3.divide(out,vector1,vector2);
            break;
        case 4:
            out=glMatrix.vec4.create();
            glMatrix.vec4.divide(out,vector1,vector2);
            break;
    }
    return out;
}
function length(vector){
    let out;
    switch(vector.length){
        case 2:
            out=glMatrix.vec2.length(vector);
            break;
        case 3:
            out=glMatrix.vec3.length(vector);
            break;
        case 4:
            out=glMatrix.vec4.length(vector);
            break;
    }
    return out;
}
function normalize(vector){
    let out;
    switch(vector.length){
        case 2:
            out=glMatrix.vec2.create();
            glMatrix.vec2.normalize(out,vector);
            break;
        case 3:
            out=glMatrix.vec3.create();
            glMatrix.vec3.normalize(out,vector);
            break;
        case 4:
            out=glMatrix.vec4.create();
            glMatrix.vec4.normalize(out,vector);
            break;
    }
    return out;
}
pi=3.1415926
function radians(degrees){
    return degrees/180*pi;
}
function perspective(fov,aspect,near,far){
    let out=glMatrix.mat4.create();
    glMatrix.mat4.perspective(out,fov,aspect,near,far);
    return out;
}
function lookAt(eye,center,up){
    let out=glMatrix.mat4.create();
    glMatrix.mat4.lookAt(out,eye,center,up);
    return out;
}