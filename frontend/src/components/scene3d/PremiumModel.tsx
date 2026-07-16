"use client";

import React, { Suspense, Component, ErrorInfo } from "react";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

try {
  useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  // @ts-ignore
  useGLTF.setMeshoptDecoder(MeshoptDecoder);
} catch (e) {
  console.warn("Failed to set decoder paths", e);
}

// Global interceptor for absolute local paths inside poorly exported GLTF/GLB models
try {
  THREE.DefaultLoadingManager.setURLModifier((url: string) => {
    // Intercept Windows absolute local paths (e.g. B:\ or backslashes) but bypass remote/data/blob URLs
    if (
      url &&
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("blob:") &&
      !url.startsWith("data:") &&
      (url.includes(":\\") || url.includes(":/") || url.startsWith("\\\\") || url.includes("materialy"))
    ) {
      console.warn("Intercepted absolute local path reference in GLTF. Redirecting to base64 pixel:", url);
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    }
    return url;
  });
} catch (e) {
  console.warn("Failed to set URL modifier on DefaultLoadingManager", e);
}

type PremiumModelProps = React.ComponentPropsWithoutRef<"group"> & {
  url: string;
  fallback?: React.ReactNode;
  center?: boolean;
  modelScale?: number | [number, number, number];
  offset?: [number, number, number];
  hideNodes?: string[];
  castShadows?: boolean;
  receiveShadows?: boolean;
  colorOverrides?: Record<string, string>;
  textureOverrides?: Record<string, THREE.Texture | null>;
};

class ErrorBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Failed to load premium GLTF model. Falling back to procedural high-quality model.", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          {this.props.fallback}
          {/* We rely on the HTML overlay for the Retry button since this is 3D space, or we can expose a retry callback if needed, but since we have a fallback, the fallback might be HTML via Html component. Let's just render the fallback. */}
        </group>
      );
    }
    return <>{this.props.children}</>;
  }
}

function ModelLoader({ 
  url, 
  center, 
  modelScale, 
  offset, 
  hideNodes, 
  fallback, 
  castShadows = true, 
  receiveShadows = true, 
  colorOverrides,
  textureOverrides,
  ...props 
}: PremiumModelProps) {
  const { scene } = useGLTF(url);

  // Check if there are any meshes in the loaded scene (to handle empty/corrupted uploads like LG FH-2A8HDN2.glb)
  const hasMeshes = React.useMemo(() => {
    let count = 0;
    scene.traverse((child: any) => {
      if (child.isMesh && child.visible) count++;
    });
    return count > 0;
  }, [scene]);

  if (!hasMeshes) {
    return fallback ? <>{fallback}</> : null;
  }

  const baseScale = props.scale !== undefined ? props.scale : 1;
  const multiplier = modelScale !== undefined ? modelScale : 1;
  
  let finalScale: any = multiplier;
  if (typeof baseScale === 'number' && typeof multiplier === 'number') {
    finalScale = baseScale * multiplier;
  } else if (Array.isArray(baseScale) && typeof multiplier === 'number') {
    finalScale = [baseScale[0] * multiplier, baseScale[1] * multiplier, baseScale[2] * multiplier];
  }

  const cleanedProps = { ...props };
  delete cleanedProps.scale;

  // Traverse model meshes to force shadows and fix transparency artifacts in converted GLB materials
  React.useMemo(() => {
    scene.traverse((child: any) => {
      const childName = (child.name || "").toLowerCase();
      
      // Auto-hide backdrop, camera, and light nodes to keep scene clean
      if (
        childName.includes("backdrop") || 
        childName.includes("camera") || 
        childName.includes("light")
      ) {
        child.visible = false;
      }

      // Hide user-specified nodes
      if (hideNodes && hideNodes.some(node => childName.includes(node.toLowerCase()))) {
        child.visible = false;
      }

      if (child.isMesh) {
        child.castShadow = castShadows;
        child.receiveShadow = receiveShadows;
        child.frustumCulled = true; // Optimization
        
        if (child.material) {
          // Handle both single materials and array materials
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            const matName = (mat.name || "").toLowerCase();
            // Retain transparency only for actual glass/window/water materials
            if (
              !matName.includes("glass") && 
              !matName.includes("window") && 
              !matName.includes("transp") && 
              !matName.includes("water")
            ) {
              mat.transparent = false;
              mat.opacity = 1.0;
              mat.depthWrite = true;
            }

            // WebGL texture image unit count overflow fix:
            // Strip out non-essential texture maps (aoMap, displacementMap, bumpMap, lightMap)
            // to keep the sampler count low and prevent MAX_TEXTURE_IMAGE_UNITS compilation errors.
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial || mat.isMeshPhongMaterial || mat.isMeshBasicMaterial || mat.isMeshLambertMaterial || mat.type) {
              let changed = false;
              if (mat.displacementMap) { mat.displacementMap = null; changed = true; }
              if (mat.bumpMap) { mat.bumpMap = null; changed = true; }
              if (mat.lightMap) { mat.lightMap = null; changed = true; }
              if (mat.aoMap) { mat.aoMap = null; changed = true; }
              if (mat.emissiveMap) { mat.emissiveMap = null; changed = true; }
              
              // If receiveShadows is false, strip normal, roughness and metalness maps as well
              // to reduce texture unit count to the absolute minimum (1 diffuse map).
              if (!receiveShadows) {
                if (mat.normalMap) { mat.normalMap = null; changed = true; }
                if (mat.roughnessMap) { mat.roughnessMap = null; changed = true; }
                if (mat.metalnessMap) { mat.metalnessMap = null; changed = true; }
              }
              
              // Enable texture anisotropy for remaining maps
              const maps = [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap];
              maps.forEach(m => {
                if (m) {
                  m.anisotropy = 16;
                  changed = true;
                }
              });
              
              if (changed) {
                mat.needsUpdate = true;
              }

              // Apply color overrides if specified
              if (colorOverrides) {
                let matched = false;
                for (const [key, color] of Object.entries(colorOverrides)) {
                  if (key !== '*' && (matName.includes(key.toLowerCase()) || matName === key.toLowerCase())) {
                    if (mat.color) mat.color.set(color);
                    if (mat.map) { mat.map = null; mat.needsUpdate = true; }
                    matched = true;
                    break;
                  }
                }
                // Fallback to wildcard if nothing specific matched
                if (!matched && colorOverrides['*']) {
                  if (mat.color) mat.color.set(colorOverrides['*']);
                  if (mat.map) { mat.map = null; mat.needsUpdate = true; }
                }
              }

              // Apply texture overrides if specified
              if (textureOverrides) {
                let texMatched = false;
                for (const [key, tex] of Object.entries(textureOverrides)) {
                  if (key !== '*' && (matName.includes(key.toLowerCase()) || matName === key.toLowerCase())) {
                    if (tex) {
                      mat.map = tex;
                      if (mat.color) mat.color.set('#ffffff'); // Reset color so texture shows purely
                      mat.needsUpdate = true;
                    }
                    texMatched = true;
                    break;
                  }
                }
                if (!texMatched && textureOverrides['*']) {
                  const tex = textureOverrides['*'];
                  if (tex) {
                    mat.map = tex;
                    if (mat.color) mat.color.set('#ffffff');
                    mat.needsUpdate = true;
                  }
                }
              }
            }
          });
        }
      }
    });
  }, [scene, hideNodes, colorOverrides, textureOverrides, castShadows, receiveShadows]);

  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    return () => {
      // Memory cleanup on unmount
      clonedScene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat: any) => {
              mat.dispose();
              if (mat.map) mat.map.dispose();
              if (mat.normalMap) mat.normalMap.dispose();
              if (mat.roughnessMap) mat.roughnessMap.dispose();
              if (mat.metalnessMap) mat.metalnessMap.dispose();
            });
          }
        }
      });
    };
  }, [clonedScene]);

  if (center) {
    return (
      <Center bottom {...cleanedProps} dispose={null}>
        <primitive object={clonedScene} scale={finalScale} dispose={null} />
      </Center>
    );
  }
  
  if (offset) {
    const s = typeof finalScale === 'number' ? finalScale : 1;
    const scaledOffset: [number, number, number] = [offset[0] * s, offset[1] * s, offset[2] * s];
    return (
      <group {...cleanedProps} dispose={null}>
        <primitive object={clonedScene} position={scaledOffset} scale={finalScale} dispose={null} />
      </group>
    );
  }

  return <primitive object={clonedScene} {...cleanedProps} scale={finalScale} dispose={null} />;
}

const existCache = new Map<string, boolean>();

export default function PremiumModel({ 
  url, 
  fallback, 
  center, 
  modelScale, 
  offset, 
  hideNodes, 
  castShadows = true, 
  receiveShadows = true, 
  colorOverrides,
  textureOverrides,
  ...props 
}: PremiumModelProps) {
  const [status, setStatus] = React.useState<"checking" | "exists" | "missing">(
    existCache.has(url) ? (existCache.get(url) ? "exists" : "missing") : "checking"
  );

  React.useEffect(() => {
    if (existCache.has(url)) {
      setStatus(existCache.get(url) ? "exists" : "missing");
      return;
    }
    // Check if the file actually exists to prevent Next.js dev overlay from catching useGLTF 404s
    fetch(url, { method: "HEAD" })
      .then((res) => {
        const ok = res.ok;
        existCache.set(url, ok);
        setStatus(ok ? "exists" : "missing");
      })
      .catch(() => {
        existCache.set(url, false);
        setStatus("missing");
      });
  }, [url]);

  if (status === "checking" || status === "missing") {
    // Destructure out offset so it is not passed to the fallback group
    const cleanedProps = { ...props };
    return fallback ? <group {...cleanedProps}>{fallback}</group> : null;
  }

  return (
    <ErrorBoundary fallback={fallback ? <group {...props}>{fallback}</group> : null}>
      <Suspense fallback={fallback ? <group {...props}>{fallback}</group> : null}>
        <ModelLoader 
          url={url} 
          center={center} 
          modelScale={modelScale} 
          offset={offset} 
          hideNodes={hideNodes} 
          castShadows={castShadows}
          receiveShadows={receiveShadows}
          colorOverrides={colorOverrides}
          textureOverrides={textureOverrides}
          fallback={fallback} 
          {...props} 
        />
      </Suspense>
    </ErrorBoundary>
  );
}
