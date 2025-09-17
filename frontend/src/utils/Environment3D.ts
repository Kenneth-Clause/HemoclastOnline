/**
 * Environment3D - Manages 3D world environment, terrain, and objects
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Environment3D {
  private scene: THREE.Scene;
  private physicsWorld: CANNON.World;
  
  // Environment objects
  public terrain: THREE.Mesh | null = null; // Made public for raycasting
  private buildings: THREE.Group = new THREE.Group();
  private vegetation: THREE.Group = new THREE.Group();
  private props: THREE.Group = new THREE.Group();
  
  // Lighting
  private dayNightCycle = 0; // 0-1 representing time of day
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  
  // Weather effects
  private weatherSystem: THREE.Points | null = null;
  private fogDensity = 0.01;
  
  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    
    // Get existing lights from scene
    this.ambientLight = scene.children.find(child => child instanceof THREE.AmbientLight) as THREE.AmbientLight;
    this.directionalLight = scene.children.find(child => child instanceof THREE.DirectionalLight) as THREE.DirectionalLight;
    
    console.log('🌍 Environment3D initialized');
  }
  
  public async loadBasicEnvironment(): Promise<void> {
    console.log('🏗️ Loading basic 3D environment...');
    
    // Create terrain
    await this.createTerrain();
    
    // Add some basic structures
    this.createBasicBuildings();
    
    // Add vegetation
    this.createVegetation();
    
    // Add atmospheric props
    this.createAtmosphericProps();
    
    // Set up weather
    this.initializeWeather();
    
    console.log('✅ Basic environment loaded');
  }
  
  private async createTerrain(): Promise<void> {
    // Create a large ground plane with some texture variation
    const terrainSize = 200;
    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 32, 32);
    
    // Add some height variation to make it more interesting
    const vertices = terrainGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Add subtle height variation
      vertices[i + 2] += Math.sin(vertices[i] * 0.1) * Math.cos(vertices[i + 1] * 0.1) * 0.5;
    }
    terrainGeometry.computeVertexNormals();
    
    // Create terrain material with gothic colors
    const terrainMaterial = new THREE.MeshLambertMaterial({
      color: 0x2d5016, // Dark forest green
      transparent: true,
      opacity: 0.9
    });
    
    // Create terrain mesh
    this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    this.terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.terrain.receiveShadow = true;
    this.terrain.position.y = -0.1; // Slightly below ground level
    
    this.scene.add(this.terrain);
    
    // Create physics body for terrain
    const terrainShape = new CANNON.Plane();
    const terrainBody = new CANNON.Body({ mass: 0 }); // Static
    terrainBody.addShape(terrainShape);
    terrainBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.physicsWorld.addBody(terrainBody);
  }
  
  private createBasicBuildings(): void {
    // Create some gothic-style structures
    this.createCastle();
    this.createRuins();
    this.createCrypt();
    
    this.scene.add(this.buildings);
  }
  
  private createCastle(): void {
    // Main castle structure
    const castleGeometry = new THREE.BoxGeometry(8, 12, 8);
    const castleMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 }); // Gray stone
    const castle = new THREE.Mesh(castleGeometry, castleMaterial);
    castle.position.set(30, 6, 30);
    castle.castShadow = true;
    castle.receiveShadow = true;
    
    // Castle towers
    const towerGeometry = new THREE.CylinderGeometry(2, 2, 16, 8);
    const towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    
    const positions = [
      [-4, 8, -4], [4, 8, -4], [-4, 8, 4], [4, 8, 4]
    ];
    
    positions.forEach(pos => {
      const tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(pos[0], pos[1], pos[2]);
      tower.castShadow = true;
      castle.add(tower);
    });
    
    this.buildings.add(castle);
    
    // Add physics body for castle
    const castleShape = new CANNON.Box(new CANNON.Vec3(4, 6, 4));
    const castleBody = new CANNON.Body({ mass: 0 });
    castleBody.addShape(castleShape);
    castleBody.position.set(30, 6, 30);
    this.physicsWorld.addBody(castleBody);
  }
  
  private createRuins(): void {
    // Scattered ruins
    const ruinPositions = [
      [-20, 2, 20], [-15, 1.5, 25], [-25, 3, 15]
    ];
    
    ruinPositions.forEach(pos => {
      const ruinGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        1 + Math.random() * 4,
        2 + Math.random() * 3
      );
      const ruinMaterial = new THREE.MeshLambertMaterial({
        color: 0x8B7D6B // Weathered stone
      });
      
      const ruin = new THREE.Mesh(ruinGeometry, ruinMaterial);
      ruin.position.set(pos[0], pos[1], pos[2]);
      ruin.rotation.y = Math.random() * Math.PI;
      ruin.castShadow = true;
      ruin.receiveShadow = true;
      
      this.buildings.add(ruin);
      
      // Add physics body
      const ruinShape = new CANNON.Box(new CANNON.Vec3(
        ruinGeometry.parameters.width / 2,
        ruinGeometry.parameters.height / 2,
        ruinGeometry.parameters.depth / 2
      ));
      const ruinBody = new CANNON.Body({ mass: 0 });
      ruinBody.addShape(ruinShape);
      ruinBody.position.copy(ruin.position as any);
      ruinBody.quaternion.copy(ruin.quaternion as any);
      this.physicsWorld.addBody(ruinBody);
    });
  }
  
  private createCrypt(): void {
    // Underground crypt entrance
    const cryptGeometry = new THREE.BoxGeometry(6, 3, 8);
    const cryptMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F }); // Dark stone
    const crypt = new THREE.Mesh(cryptGeometry, cryptMaterial);
    crypt.position.set(-30, 1.5, -30);
    crypt.castShadow = true;
    crypt.receiveShadow = true;
    
    // Crypt entrance (darker area)
    const entranceGeometry = new THREE.BoxGeometry(3, 2.5, 1);
    const entranceMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(0, 0, 4);
    crypt.add(entrance);
    
    this.buildings.add(crypt);
    
    // Add physics body
    const cryptShape = new CANNON.Box(new CANNON.Vec3(3, 1.5, 4));
    const cryptBody = new CANNON.Body({ mass: 0 });
    cryptBody.addShape(cryptShape);
    cryptBody.position.set(-30, 1.5, -30);
    this.physicsWorld.addBody(cryptBody);
  }
  
  private createVegetation(): void {
    // Create trees scattered around the world
    this.createTrees();
    this.createBushes();
    
    this.scene.add(this.vegetation);
  }
  
  private createTrees(): void {
    const treeCount = 50;
    
    for (let i = 0; i < treeCount; i++) {
      const tree = this.createSingleTree();
      
      // Random position (avoid center spawn area)
      let x, z;
      do {
        x = (Math.random() - 0.5) * 180;
        z = (Math.random() - 0.5) * 180;
      } while (Math.sqrt(x * x + z * z) < 15); // Keep spawn area clear
      
      tree.position.set(x, 0, z);
      this.vegetation.add(tree);
      
      // Add simple physics body for tree trunk
      const treeShape = new CANNON.Cylinder(0.5, 0.5, 8, 8);
      const treeBody = new CANNON.Body({ mass: 0 });
      treeBody.addShape(treeShape);
      treeBody.position.set(x, 4, z);
      this.physicsWorld.addBody(treeBody);
    }
  }
  
  private createSingleTree(): THREE.Group {
    const tree = new THREE.Group();
    
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A }); // Dark bark
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 4;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Tree foliage
    const foliageGeometry = new THREE.SphereGeometry(4, 8, 6);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3d1a }); // Dark green
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 10;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
    
    return tree;
  }
  
  private createBushes(): void {
    const bushCount = 30;
    
    for (let i = 0; i < bushCount; i++) {
      const bushGeometry = new THREE.SphereGeometry(1 + Math.random(), 6, 4);
      const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
      const bush = new THREE.Mesh(bushGeometry, bushMaterial);
      
      // Random position
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      bush.position.set(x, 0.5, z);
      bush.castShadow = true;
      bush.receiveShadow = true;
      
      this.vegetation.add(bush);
    }
  }
  
  private createAtmosphericProps(): void {
    // Add some atmospheric elements
    this.createFogEffects();
    this.createAmbientParticles();
    
    this.scene.add(this.props);
  }
  
  private createFogEffects(): void {
    // Create ground fog patches
    const fogCount = 10;
    
    for (let i = 0; i < fogCount; i++) {
      const fogGeometry = new THREE.PlaneGeometry(10, 10);
      const fogMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      });
      
      const fog = new THREE.Mesh(fogGeometry, fogMaterial);
      fog.rotation.x = -Math.PI / 2;
      fog.position.set(
        (Math.random() - 0.5) * 100,
        0.1,
        (Math.random() - 0.5) * 100
      );
      
      this.props.add(fog);
    }
  }
  
  private createAmbientParticles(): void {
    // Create floating particles for atmosphere
    const particleCount = 100;
    const particles = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 200;     // x
      particles[i * 3 + 1] = Math.random() * 20 + 2;      // y
      particles[i * 3 + 2] = (Math.random() - 0.5) * 200; // z
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8B0000,
      size: 0.1,
      transparent: true,
      opacity: 0.3
    });
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.props.add(particleSystem);
  }
  
  private initializeWeather(): void {
    // Start with clear weather
    this.setWeather('clear');
  }
  
  public setWeather(weatherType: 'clear' | 'rain' | 'snow' | 'fog'): void {
    // Remove existing weather effects
    if (this.weatherSystem) {
      this.scene.remove(this.weatherSystem);
    }
    
    switch (weatherType) {
      case 'rain':
        this.createRain();
        break;
      case 'snow':
        this.createSnow();
        break;
      case 'fog':
        this.setFogDensity(0.05);
        break;
      default:
        this.setFogDensity(0.01);
        break;
    }
  }
  
  private createRain(): void {
    const rainCount = 1000;
    const rainGeometry = new THREE.BufferGeometry();
    const rainVertices = new Float32Array(rainCount * 3);
    
    for (let i = 0; i < rainCount; i++) {
      rainVertices[i * 3] = (Math.random() - 0.5) * 200;
      rainVertices[i * 3 + 1] = Math.random() * 50 + 20;
      rainVertices[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainVertices, 3));
    
    const rainMaterial = new THREE.PointsMaterial({
      color: 0x87CEEB,
      size: 0.1,
      transparent: true,
      opacity: 0.6
    });
    
    this.weatherSystem = new THREE.Points(rainGeometry, rainMaterial);
    this.scene.add(this.weatherSystem);
  }
  
  private createSnow(): void {
    const snowCount = 500;
    const snowGeometry = new THREE.BufferGeometry();
    const snowVertices = new Float32Array(snowCount * 3);
    
    for (let i = 0; i < snowCount; i++) {
      snowVertices[i * 3] = (Math.random() - 0.5) * 200;
      snowVertices[i * 3 + 1] = Math.random() * 30 + 10;
      snowVertices[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowVertices, 3));
    
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    this.weatherSystem = new THREE.Points(snowGeometry, snowMaterial);
    this.scene.add(this.weatherSystem);
  }
  
  private setFogDensity(density: number): void {
    this.fogDensity = density;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.density = density;
    }
  }
  
  public setTimeOfDay(time: number): void {
    // time should be between 0 (midnight) and 1 (next midnight)
    this.dayNightCycle = time;
    
    // Adjust lighting based on time of day
    const dayIntensity = Math.max(0.2, Math.sin(time * Math.PI * 2) * 0.8 + 0.2);
    
    if (this.ambientLight) {
      this.ambientLight.intensity = dayIntensity * 0.3;
    }
    
    if (this.directionalLight) {
      this.directionalLight.intensity = dayIntensity * 0.8;
      
      // Change color based on time of day
      if (time < 0.25 || time > 0.75) {
        // Night - blue tint
        this.directionalLight.color.setHex(0x4169E1);
      } else if (time < 0.35 || time > 0.65) {
        // Dawn/Dusk - orange tint
        this.directionalLight.color.setHex(0xFF8C00);
      } else {
        // Day - warm white
        this.directionalLight.color.setHex(0xFFFFE0);
      }
    }
  }
  
  public update(deltaTime: number): void {
    // Update day/night cycle
    this.dayNightCycle += deltaTime * 0.001; // Very slow cycle
    if (this.dayNightCycle > 1) this.dayNightCycle = 0;
    this.setTimeOfDay(this.dayNightCycle);
    
    // Animate weather effects
    if (this.weatherSystem) {
      this.updateWeatherAnimation(deltaTime);
    }
    
    // Animate atmospheric particles
    this.updateAtmosphericEffects(deltaTime);
  }
  
  private updateWeatherAnimation(deltaTime: number): void {
    if (!this.weatherSystem) return;
    
    const positions = this.weatherSystem.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Move particles downward
      positions[i + 1] -= deltaTime * 10; // Y position
      
      // Reset particles that fall below ground
      if (positions[i + 1] < 0) {
        positions[i + 1] = 50;
        positions[i] = (Math.random() - 0.5) * 200;     // New X position
        positions[i + 2] = (Math.random() - 0.5) * 200; // New Z position
      }
    }
    
    this.weatherSystem.geometry.attributes.position.needsUpdate = true;
  }
  
  private updateAtmosphericEffects(deltaTime: number): void {
    // Slowly rotate and move atmospheric particles
    this.props.children.forEach((child, index) => {
      if (child instanceof THREE.Points) {
        child.rotation.y += deltaTime * 0.1;
        child.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
      }
    });
  }
  
  public getTerrainHeightAt(x: number, z: number): number {
    // For now, return a simple height calculation
    // In production, you'd raycast against the actual terrain
    return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
  }
  
  public destroy(): void {
    // Clean up all environment objects
    this.scene.remove(this.buildings);
    this.scene.remove(this.vegetation);
    this.scene.remove(this.props);
    
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      (this.terrain.material as THREE.Material).dispose();
    }
    
    if (this.weatherSystem) {
      this.scene.remove(this.weatherSystem);
      this.weatherSystem.geometry.dispose();
      (this.weatherSystem.material as THREE.Material).dispose();
    }
    
    console.log('🧹 Environment3D cleaned up');
  }
}
