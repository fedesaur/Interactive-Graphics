var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0.0);
    for (int i = 0; i < NUM_LIGHTS; ++i) {
        Ray shadowRay;
        HitInfo shadowHit;
        shadowRay.pos = position + normal * 0.003;
        shadowRay.dir = normalize(lights[i].position - position);

        if (!IntersectRay(shadowHit, shadowRay)) {
            vec3 lightDir = normalize(lights[i].position - position);
            float cosTheta = max(dot(lightDir, normal), 0.0);
            vec3 diff = mtl.k_d * cosTheta;

            vec3 halfVector = normalize(view + lightDir);
            vec3 specular = mtl.k_s * pow(max(dot(normal, halfVector), 0.0), mtl.n);

            color += (diff + specular) * lights[i].intensity;
        }
    }
    return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for (int i = 0; i < NUM_SPHERES; ++i) {
        vec3 oc = ray.pos - spheres[i].center;
		float a = dot(ray.dir, ray.dir);
		float b = dot(ray.dir, oc);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
		float discriminant = b * b - a * c;
        if (discriminant > 0.0) {
            float t = (-b - sqrt(discriminant))/ dot(ray.dir, ray.dir);
            if (t > 0.0 && t < hit.t) {
                hit.t = t;
                hit.position = ray.pos + t * ray.dir;
                hit.normal = normalize(hit.position - spheres[i].center);
                hit.mtl = spheres[i].mtl;
                foundHit = true;
            }
        }
    }
    return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		vec3 k_s = hit.mtl.k_s;

		for ( int bounce = 0; bounce < MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;

			Ray r;
			HitInfo h;

			vec3 reflectDir = normalize( reflect( -view, hit.normal ) );
			r.pos = hit.position + hit.normal * 0.003;  // Avoid self-intersection
			r.dir = reflectDir;

			if ( IntersectRay( h, r ) ) {
				view = normalize( -r.dir );
				vec3 localColor = Shade( h.mtl, h.position, h.normal, view );
				clr += k_s * localColor;
				k_s *= h.mtl.k_s;
				hit = h;
			} else {
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;
			}
		}
		return vec4( clr, 1);
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );
	}
}
`;