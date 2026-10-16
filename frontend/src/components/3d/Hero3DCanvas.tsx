import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const Hero3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setHasWebGL(false);
      return;
    }

    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setHasWebGL(false);
      return;
    }

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    // Ambient and point light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x10b981, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2, 50);
    cyanLight.position.set(-5, -3, 3);
    scene.add(cyanLight);

    // Group for the Earth / Eco Sphere
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Core Globe Geometry (Subtle inner glow)
    const sphereGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x064e3b,
      emissive: 0x022c22,
      specular: 0x10b981,
      shininess: 40,
      transparent: true,
      opacity: 0.88,
      wireframe: false
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // Outer wireframe network (Circular supply chain lattice)
    const wireGeo = new THREE.IcosahedronGeometry(2.45, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Orbital Rings representing Circular Electronics Lifecycle
    const ringGeo = new THREE.TorusGeometry(3.1, 0.025, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.65
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    globeGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 4;
    globeGroup.add(ring2);

    // Particle nodes on the globe representing recycling collection hubs
    const particlesCount = 80;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.5 + Math.random() * 0.1;
      const sinPhi = Math.sin(phi);
      posArray[i * 3] = r * sinPhi * Math.cos(theta);
      posArray[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      posArray[i * 3 + 2] = r * Math.cos(phi);
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.9
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    globeGroup.add(particlesMesh);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handling
    const handleResize = () => {
      if (!container || !renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth idle rotation
      globeGroup.rotation.y += 0.0035;
      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.004;

      // Parallax easing
      targetX += (mouseX * 0.5 - targetX) * 0.05;
      targetY += (mouseY * 0.5 - targetY) * 0.05;
      globeGroup.rotation.x = targetY * 0.4;
      globeGroup.position.x = targetX * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (!hasWebGL) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="relative w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-800 via-forest-600 to-cyan-500 shadow-2xl flex items-center justify-center animate-pulse">
          <div className="w-48 h-48 rounded-full border border-white/20 bg-emerald-950/80 flex flex-col items-center justify-center text-center p-4">
            <span className="text-3xl">🌱</span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 mt-2 font-bold">Circular Earth</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      className="w-full h-full min-h-[420px] md:min-h-[500px] flex items-center justify-center relative cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Circular Earth & Supply Chain Simulation"
    />
  );
};
