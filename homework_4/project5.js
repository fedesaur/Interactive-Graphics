// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	// Rotazione su X
	let cosX = Math.cos(rotationX), sinX = Math.sin(rotationX);
	let rotX = [
		1,    0,     0,    0,
		0, cosX, -sinX,    0,
		0, sinX,  cosX,    0,
		0,    0,     0,    1
	];

	// Rotazione su Y
	let cosY = Math.cos(rotationY), sinY = Math.sin(rotationY);
	let rotY = [
		cosY, 0, sinY, 0,
		   0, 1,    0, 0,
	   -sinY, 0, cosY, 0,
		   0, 0,    0, 1
	];

	// Traslazione
	let trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	let mv = MatrixMult(trans, MatrixMult(rotY, rotX));

	return mv;
}

var meshVS = `
    attribute vec3 pos;
    attribute vec2 texCoord;
	attribute vec3 normal;

    varying vec2 vTexCoord;
	varying vec3 vNormal;
	varying vec3 vPosition;

    uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 normalMatrix;
	uniform bool swapYZ;

    void main()
	{
		vec3 newPos = pos;
		vec3 newNormal = normal;

		if(swapYZ)
		{
			newPos.yz = newPos.zy;
			newNormal.yz = newNormal.zy;
		}
		vNormal = normalize(normalMatrix * newNormal);
		vPosition = vec3(mv * vec4(newPos, 1.0));
        gl_Position = mvp * vec4(newPos, 1.0);
        vTexCoord = texCoord;
    }
`;

var meshFS = `
    precision mediump float;

    varying vec2 vTexCoord;
	varying vec3 vNormal;
	varying vec3 vPosition;

    uniform sampler2D uSampler;
    uniform bool showTextureFlag;
	uniform bool textureUploaded;

	uniform vec3 lightDir;
	uniform float shininess;

    void main()
	{
        vec3 N = normalize(vNormal);
		vec3 L = normalize(lightDir);
		vec3 V = normalize(-vPosition); // from fragment to camera
		vec3 H = normalize(L + V);

		float diff = max(dot(N, L), 0.0);
		float spec = 0.0;

		if (diff > 0.0)
			spec = pow(max(dot(N, H), 0.0), shininess);

		vec3 Kd = showTextureFlag && textureUploaded ? texture2D(uSampler, vTexCoord).rgb : vec3(1.0);
		vec3 Ks = vec3(1.0);
		vec3 ambient = 0.1 * Kd;

		vec3 color = ambient + diff * Kd + spec * Ks;

		gl_FragColor = vec4(color, 1.0);
    }
`;


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordPos = gl.getAttribLocation(this.prog, 'texCoord');

        this.vertbuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.indexbuffer = gl.createBuffer();

        this.meshVertices = [];
        this.meshTexCoords = [];
        this.showTextureFlag = (document.getElementById("show-texture").value == 'on');
		this.textureUploaded = false;
        this.swapYZFlag = (document.getElementById("swap-yz").value == 'off');

        this.texture = null;

		this.normalBuffer = gl.createBuffer();
		this.normalAttr = gl.getAttribLocation(this.prog, 'normal');
		this.mvLoc = gl.getUniformLocation(this.prog, 'mv');
		this.normalMatrixLoc = gl.getUniformLocation(this.prog, 'normalMatrix');
		this.lightDirLoc = gl.getUniformLocation(this.prog, 'lightDir');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
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
        this.meshVertices = vertPos;
        this.meshTexCoords = texCoords;
		this.meshNormals = normals;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.meshVertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.meshTexCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.meshNormals), gl.STATIC_DRAW);
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		const swapUniform = gl.getUniformLocation(this.prog, 'swapYZ');
        gl.useProgram(this.prog);
        gl.uniform1i(swapUniform, swap);
		this.swapYZFlag = swap;
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing

		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);
		gl.uniformMatrix3fv(this.normalMatrixLoc, false, matrixNormal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.vertPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.vertexAttribPointer(this.texCoordPos, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.texCoordPos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.vertexAttribPointer(this.normalAttr, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normalAttr);

		// Texture settings
		if (this.texture && this.showTextureFlag) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
		}

		gl.uniform1i(gl.getUniformLocation(this.prog, 'showTextureFlag'), this.showTextureFlag);
		gl.uniform1i(gl.getUniformLocation(this.prog, 'textureUploaded'), this.textureUploaded);

		// YZ Swap
		this.swapYZ(this.swapYZFlag);

		// Draw
		gl.drawArrays(gl.TRIANGLES, 0, this.meshVertices.length / 3);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		console.log('Setting texture...');
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		var textureSampler = gl.getUniformLocation(this.prog, 'uSampler');
		if(textureSampler === null)
		{
			console.error('Uniform sampler not found.');
		}
		gl.useProgram(this.prog);
		gl.uniform1i(textureSampler, 0);

		this.texture = texture;
		
		this.textureUploaded = true;
		const textureUploaded = gl.getUniformLocation(this.prog, 'textureUploaded');
		gl.useProgram(this.prog);
		gl.uniform1i(textureUploaded, this.textureUploaded);

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		const showTextureUniform = gl.getUniformLocation(this.prog, 'showTextureFlag');
        gl.useProgram(this.prog);
        gl.uniform1i(showTextureUniform, show ? 1 : 0);
		const textureUploaded = gl.getUniformLocation(this.prog, 'textureUploaded');
		gl.useProgram(this.prog);
		gl.uniform1i(textureUploaded, this.textureUploaded);
		this.showTextureFlag = show;
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDirLoc, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
	}
}
