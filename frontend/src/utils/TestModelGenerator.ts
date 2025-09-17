/**
 * TestModelGenerator - Creates simple test models while we wait for real assets
 */

import * as THREE from 'three';

export class TestModelGenerator {
  /**
   * Create a better procedural character than basic cylinders
   */
  public static createEnhancedCharacter(characterClass: 'warrior' | 'rogue' | 'mage'): THREE.Group {
    const group = new THREE.Group();
    
    // Get class-specific materials
    const materials = this.getClassMaterials(characterClass);
    
    // Create more detailed character geometry
    this.createDetailedBody(group, materials);
    this.createDetailedHead(group, materials);
    this.createDetailedLimbs(group, materials);
    this.createClassSpecificEquipment(group, characterClass, materials);
    
    // Add subtle ambient animation
    this.addIdleAnimation(group);
    
    return group;
  }
  
  private static getClassMaterials(characterClass: string) {
    const baseMaterials = {
      skin: new THREE.MeshLambertMaterial({ color: 0xFFDBB3 }),
      hair: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
      metal: new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }),
      leather: new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    };
    
    switch (characterClass) {
      case 'warrior':
        return {
          ...baseMaterials,
          primary: new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // Brown armor
          accent: new THREE.MeshLambertMaterial({ color: 0xB8860B }) // Dark goldenrod
        };
      case 'rogue':
        return {
          ...baseMaterials,
          primary: new THREE.MeshLambertMaterial({ color: 0x2F4F2F }), // Dark green
          accent: new THREE.MeshLambertMaterial({ color: 0x556B2F }) // Dark olive green
        };
      case 'mage':
        return {
          ...baseMaterials,
          primary: new THREE.MeshLambertMaterial({ color: 0x4B0082 }), // Indigo robes
          accent: new THREE.MeshLambertMaterial({ color: 0x9370DB }) // Medium purple
        };
      default:
        return {
          ...baseMaterials,
          primary: new THREE.MeshLambertMaterial({ color: 0x808080 }),
          accent: new THREE.MeshLambertMaterial({ color: 0xA0A0A0 })
        };
    }
  }
  
  private static createDetailedBody(group: THREE.Group, materials: any): void {
    // Torso - more anatomical shape
    const torsoGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8);
    const torso = new THREE.Mesh(torsoGeometry, materials.primary);
    torso.position.y = 1.0;
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);
    
    // Chest detail
    const chestGeometry = new THREE.SphereGeometry(0.15, 8, 6);
    chestGeometry.scale(1.2, 0.8, 1.0);
    const chest = new THREE.Mesh(chestGeometry, materials.accent);
    chest.position.set(0, 1.3, 0.1);
    chest.castShadow = true;
    group.add(chest);
  }
  
  private static createDetailedHead(group: THREE.Group, materials: any): void {
    // Head - more proportional
    const headGeometry = new THREE.SphereGeometry(0.22, 12, 8);
    const head = new THREE.Mesh(headGeometry, materials.skin);
    head.position.y = 1.8;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);
    
    // Hair/helmet
    const hairGeometry = new THREE.SphereGeometry(0.24, 8, 6);
    hairGeometry.scale(1.0, 0.7, 1.0);
    const hair = new THREE.Mesh(hairGeometry, materials.hair);
    hair.position.set(0, 1.9, 0);
    hair.castShadow = true;
    group.add(hair);
    
    // Simple face features
    const eyeGeometry = new THREE.SphereGeometry(0.03, 6, 4);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.82, 0.18);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.82, 0.18);
    group.add(rightEye);
  }
  
  private static createDetailedLimbs(group: THREE.Group, materials: any): void {
    // Arms with joints
    const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 8);
    const lowerArmGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8);
    
    // Left arm
    const leftUpperArm = new THREE.Mesh(upperArmGeometry, materials.primary);
    leftUpperArm.position.set(-0.35, 1.3, 0);
    leftUpperArm.rotation.z = 0.2;
    leftUpperArm.castShadow = true;
    group.add(leftUpperArm);
    
    const leftLowerArm = new THREE.Mesh(lowerArmGeometry, materials.skin);
    leftLowerArm.position.set(-0.45, 0.9, 0);
    leftLowerArm.rotation.z = 0.1;
    leftLowerArm.castShadow = true;
    group.add(leftLowerArm);
    
    // Right arm
    const rightUpperArm = new THREE.Mesh(upperArmGeometry, materials.primary);
    rightUpperArm.position.set(0.35, 1.3, 0);
    rightUpperArm.rotation.z = -0.2;
    rightUpperArm.castShadow = true;
    group.add(rightUpperArm);
    
    const rightLowerArm = new THREE.Mesh(lowerArmGeometry, materials.skin);
    rightLowerArm.position.set(0.45, 0.9, 0);
    rightLowerArm.rotation.z = -0.1;
    rightLowerArm.castShadow = true;
    group.add(rightLowerArm);
    
    // Legs with joints
    const upperLegGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 8);
    const lowerLegGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8);
    
    // Left leg
    const leftUpperLeg = new THREE.Mesh(upperLegGeometry, materials.primary);
    leftUpperLeg.position.set(-0.12, 0.6, 0);
    leftUpperLeg.castShadow = true;
    group.add(leftUpperLeg);
    
    const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, materials.leather);
    leftLowerLeg.position.set(-0.12, 0.2, 0);
    leftLowerLeg.castShadow = true;
    group.add(leftLowerLeg);
    
    // Right leg
    const rightUpperLeg = new THREE.Mesh(upperLegGeometry, materials.primary);
    rightUpperLeg.position.set(0.12, 0.6, 0);
    rightUpperLeg.castShadow = true;
    group.add(rightUpperLeg);
    
    const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, materials.leather);
    rightLowerLeg.position.set(0.12, 0.2, 0);
    rightLowerLeg.castShadow = true;
    group.add(rightLowerLeg);
    
    // Feet
    const footGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.25);
    const leftFoot = new THREE.Mesh(footGeometry, materials.leather);
    leftFoot.position.set(-0.12, 0.04, 0.05);
    leftFoot.castShadow = true;
    group.add(leftFoot);
    
    const rightFoot = new THREE.Mesh(footGeometry, materials.leather);
    rightFoot.position.set(0.12, 0.04, 0.05);
    rightFoot.castShadow = true;
    group.add(rightFoot);
  }
  
  private static createClassSpecificEquipment(group: THREE.Group, characterClass: string, materials: any): void {
    switch (characterClass) {
      case 'warrior':
        this.createWarriorEquipment(group, materials);
        break;
      case 'rogue':
        this.createRogueEquipment(group, materials);
        break;
      case 'mage':
        this.createMageEquipment(group, materials);
        break;
    }
  }
  
  private static createWarriorEquipment(group: THREE.Group, materials: any): void {
    // Sword
    const swordGeometry = new THREE.CylinderGeometry(0.02, 0.03, 1.0, 8);
    const sword = new THREE.Mesh(swordGeometry, materials.metal);
    sword.position.set(0.6, 1.2, -0.1);
    sword.rotation.z = -Math.PI / 6;
    sword.castShadow = true;
    group.add(sword);
    
    // Shield
    const shieldGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
    const shield = new THREE.Mesh(shieldGeometry, materials.accent);
    shield.position.set(-0.5, 1.0, 0);
    shield.rotation.z = Math.PI / 2;
    shield.castShadow = true;
    group.add(shield);
    
    // Shoulder pads
    const shoulderGeometry = new THREE.SphereGeometry(0.12, 8, 6);
    const leftShoulder = new THREE.Mesh(shoulderGeometry, materials.metal);
    leftShoulder.position.set(-0.25, 1.45, 0);
    leftShoulder.castShadow = true;
    group.add(leftShoulder);
    
    const rightShoulder = new THREE.Mesh(shoulderGeometry, materials.metal);
    rightShoulder.position.set(0.25, 1.45, 0);
    rightShoulder.castShadow = true;
    group.add(rightShoulder);
  }
  
  private static createRogueEquipment(group: THREE.Group, materials: any): void {
    // Daggers
    const daggerGeometry = new THREE.CylinderGeometry(0.01, 0.015, 0.4, 6);
    const leftDagger = new THREE.Mesh(daggerGeometry, materials.metal);
    leftDagger.position.set(-0.2, 0.8, -0.2);
    leftDagger.rotation.x = Math.PI / 4;
    leftDagger.castShadow = true;
    group.add(leftDagger);
    
    const rightDagger = new THREE.Mesh(daggerGeometry, materials.metal);
    rightDagger.position.set(0.2, 0.8, -0.2);
    rightDagger.rotation.x = Math.PI / 4;
    rightDagger.castShadow = true;
    group.add(rightDagger);
    
    // Hood
    const hoodGeometry = new THREE.ConeGeometry(0.3, 0.4, 8);
    const hood = new THREE.Mesh(hoodGeometry, materials.primary);
    hood.position.set(0, 2.0, -0.1);
    hood.castShadow = true;
    group.add(hood);
  }
  
  private static createMageEquipment(group: THREE.Group, materials: any): void {
    // Staff
    const staffGeometry = new THREE.CylinderGeometry(0.02, 0.025, 1.6, 8);
    const staff = new THREE.Mesh(staffGeometry, materials.accent);
    staff.position.set(0.4, 1.0, 0);
    staff.castShadow = true;
    group.add(staff);
    
    // Crystal orb on staff
    const orbGeometry = new THREE.SphereGeometry(0.08, 12, 8);
    const orbMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x00FFFF, 
      transparent: true, 
      opacity: 0.7,
      emissive: 0x002244
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orb.position.set(0.4, 1.8, 0);
    group.add(orb);
    
    // Robe details
    const robeGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
    const robe = new THREE.Mesh(robeGeometry, materials.primary);
    robe.position.set(0, 0.3, 0);
    robe.castShadow = true;
    group.add(robe);
  }
  
  private static addIdleAnimation(group: THREE.Group): void {
    // Add subtle floating/breathing animation
    const originalY = group.position.y;
    
    // This would be handled by the animation system
    // Just setting up the structure for now
    group.userData.idleAnimation = {
      originalY,
      time: 0,
      amplitude: 0.02,
      frequency: 2.0
    };
  }
}
