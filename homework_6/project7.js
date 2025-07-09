
// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{

	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	let x_cos = Math.cos(rotationX)
	let x_sin = Math.sin(rotationX)
	let y_cos = Math.cos(rotationY)
	let y_sin = Math.sin(rotationY) 

	let x_rotation = 
	[ 1, 0 , 0 , 0 ,
	  0 , x_cos, x_sin, 0,
	  0, -x_sin, x_cos, 0,
	  0, 0, 0, 1
	] 

	let y_rotation = 

	[   y_cos, 0 , -y_sin , 0 ,
		0 , 1, 0, 0,
		y_sin, 0, y_cos, 0,
		0, 0, 0, 1
	] 

	let mat = MatrixMult(y_rotation, x_rotation)
	mat = MatrixMult(trans, mat)
	return mat;

}


class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{

		this.prog = InitShaderProgram(meshVS, meshFS)
		
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' )
		this.texCoord = gl.getAttribLocation(this.prog, 'texCoord')
		this.normal = gl.getAttribLocation(this.prog, 'normal')

		this.useTexture = gl.getUniformLocation(this.prog, 'useTexture')
		this.sampler = gl.getUniformLocation(this.prog, 'sampler')
		this.changeYZ = gl.getUniformLocation(this.prog, "changeYZ")
		this.mv = gl.getUniformLocation(this.prog, 'mv')
		this.mn = gl.getUniformLocation(this.prog, 'mn')
		this.mvp = 	gl.getUniformLocation( this.prog, 'mvp' )
		this.shininess = gl.getUniformLocation( this.prog, 'shininess' )
		this.light = gl.getUniformLocation( this.prog, 'light' )

		this.vertBuffer = gl.createBuffer()
		this.texBuffer = gl.createBuffer()
		this.normalsBuffer = gl.createBuffer()

		this.texture = gl.createTexture() 
		
	}
	

	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		gl.useProgram( this.prog )
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertBuffer )
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW )

		gl.bindBuffer( gl.ARRAY_BUFFER, this.texBuffer )
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW )
		this.numTriangles = vertPos.length / 3

	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram(this.prog)
		gl.uniform1i(this.changeYZ, swap)
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.prog )

		gl.uniformMatrix4fv( this.mvp, false, matrixMVP )
		gl.uniformMatrix4fv( this.mv, false, matrixMV )
		gl.uniformMatrix3fv( this.mn, false, matrixNormal )

		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertBuffer )
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 )
		gl.enableVertexAttribArray( this.vertPos )

		gl.bindBuffer( gl.ARRAY_BUFFER, this.texBuffer )
		gl.vertexAttribPointer( this.texCoord, 2, gl.FLOAT, false, 0, 0 )
		gl.enableVertexAttribArray( this.texCoord )

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsBuffer); 
		gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0); 
		gl.enableVertexAttribArray(this.normal); 

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles)
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		gl.useProgram( this.prog )
		gl.activeTexture(gl.TEXTURE0)
		gl.bindTexture( gl.TEXTURE_2D, this.texture )
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img )
		gl.generateMipmap( gl.TEXTURE_2D )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT )
		gl.uniform1i(this.sampler, 0)
		gl.uniform1i(this.useTexture, true)
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{		
		gl.useProgram(this.prog)
		gl.uniform1i(this.useTexture, show)
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		gl.useProgram(this.prog);
		gl.uniform3f(this.light, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{		
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininess, shininess);
	}
}


var meshVS = `
	attribute vec2 texCoord; 
	varying vec2 vTexCoord;
    varying vec3 vNormal;

	attribute vec3 pos;
	attribute vec3 normal;

	uniform mat3 mn;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform bool changeYZ;

	void main()
	{
		vec4 vec = vec4(pos, 1.0);
		if(changeYZ){ 
			vec = vec4(vec.x, vec.z, vec.y, vec.w); 
		}
		vTexCoord = texCoord;
		vNormal = mn * normal;
		gl_Position = mvp * vec;
	}
`;


var meshFS = `
	precision mediump float;

	uniform sampler2D sampler;
	uniform bool useTexture;
	uniform vec3 light;
	uniform float shininess;

	varying vec2 vTexCoord;
	varying vec3 vNormal;

	void main() {

		vec3 norm = normalize(vNormal);
		vec3 n_light = normalize(light);
		vec4 baseColor;

		if (useTexture) {
        	baseColor = texture2D(sampler, vTexCoord);
		}else{
			baseColor = vec4(0.0, 0.0, 0.5, 1.0);
		}
		
		float diff = max(dot(norm, n_light), 0.0);
		float spec = pow(max(dot(vec3(0.0, 0.0, 1.0), reflect(n_light, norm)), 0.0), shininess);
		
		vec3 model = (0.3 * baseColor.rgb) +        
					(0.7 * diff * baseColor.rgb) + 
					(0.5 * spec * vec3(1.0));      
		
		gl_FragColor = vec4(model, 1.0);
	}
`;


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
    const forces = new Array(positions.length);

    // Step 1: Initialize all forces to gravity
    for (let i = 0; i < positions.length; ++i) {
        forces[i] = gravity.copy().mul(particleMass); // f = m * g
    }

    // Step 2: Compute spring and damping forces
    for (let s = 0; s < springs.length; ++s) {
        const spring = springs[s];
        const i = spring.p0;
        const j = spring.p1;

        const p0 = positions[i];
        const p1 = positions[j];
        const v0 = velocities[i];
        const v1 = velocities[j];

        const deltaP = p1.sub(p0);             // vector from p0 to p1
        const deltaV = v1.sub(v0);             // relative velocity
        const dist = deltaP.len();             // current spring length
        const dir = deltaP.div(dist);          // normalized direction

        const springForce = dir.mul(stiffness * (dist - spring.rest)); // Hooke's law
        const dampingForce = dir.mul(damping * deltaV.dot(dir));       // damping along the spring direction

        const force = springForce.add(dampingForce); // total spring force

        forces[i].inc(force);       // apply to p0
        forces[j].dec(force);       // opposite force to p1
    }

    // Step 3: Integrate using semi-implicit Euler
    for (let i = 0; i < positions.length; ++i) {
        // a = f / m
        const acceleration = forces[i].div(particleMass);

        // v = v + a * dt
        velocities[i].inc(acceleration.mul(dt));

        // x = x + v * dt
        positions[i].inc(velocities[i].copy().mul(dt));
    }

    // Step 4: Handle collisions with cube walls [-1, 1] in each axis
    for (let i = 0; i < positions.length; ++i) {
        for (const axis of ['x', 'y', 'z']) {
            if (positions[i][axis] < -1) {
                positions[i][axis] = -1;
                if (velocities[i][axis] < 0) velocities[i][axis] *= -restitution;
            }
            if (positions[i][axis] > 1) {
                positions[i][axis] = 1;
                if (velocities[i][axis] > 0) velocities[i][axis] *= -restitution;
            }
        }
    }
}

