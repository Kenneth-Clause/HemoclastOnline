/**
 * PerformanceMonitor - Comprehensive performance tracking and logging
 * Monitors FPS, memory usage, physics performance, and rendering metrics
 */

import { DebugConsole } from './DebugConsole';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  physicsStepTime: number;
  renderTime: number;
  drawCalls: number;
  triangles: number;
  activeBodies: number;
  assetCount: number;
  networkLatency: number;
}

interface PerformanceThresholds {
  minFPS: number;
  maxFrameTime: number;
  maxMemoryMB: number;
  maxPhysicsStepTime: number;
  maxRenderTime: number;
  maxDrawCalls: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  
  // Performance tracking
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private frameTime = 0;
  private lastLogTime = 0;
  private logInterval = 5000; // Log every 5 seconds
  
  // Performance history for averages
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private physicsTimeHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private historySize = 60; // Keep 60 samples (1 minute at 1fps logging)
  
  // Thresholds for warnings
  private thresholds: PerformanceThresholds = {
    minFPS: 30,
    maxFrameTime: 33.33, // ~30fps
    maxMemoryMB: 512,
    maxPhysicsStepTime: 5.0,
    maxRenderTime: 16.67, // ~60fps
    maxDrawCalls: 1000
  };
  
  // External references
  private renderer: THREE.WebGLRenderer | null = null;
  private physicsWorld: CANNON.World | null = null;
  private scene: THREE.Scene | null = null;
  
  // Performance flags
  private isMonitoring = false;
  private warningCooldowns = new Map<string, number>();
  private cooldownDuration = 10000; // 10 seconds between same warnings
  
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  private constructor() {
    DebugConsole.info('PERFORMANCE', '🔧 Performance Monitor initialized');
  }
  
  public initialize(renderer: THREE.WebGLRenderer, physicsWorld: CANNON.World, scene: THREE.Scene): void {
    this.renderer = renderer;
    this.physicsWorld = physicsWorld;
    this.scene = scene;
    this.isMonitoring = true;
    
    DebugConsole.info('PERFORMANCE', '🚀 Performance monitoring started');
    
    // Set up automatic logging
    this.startPeriodicLogging();
  }
  
  public startFrame(): number {
    return performance.now();
  }
  
  public endFrame(startTime: number): void {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    this.frameTime = now - startTime;
    this.frameCount++;
    
    // Calculate FPS every second
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      
      // Add to history
      this.addToHistory(this.fpsHistory, this.fps);
      this.addToHistory(this.frameTimeHistory, this.frameTime);
      
      // Check for performance issues
      this.checkPerformanceThresholds();
    }
  }
  
  public logPhysicsStep(stepTime: number): void {
    if (!this.isMonitoring) return;
    
    this.addToHistory(this.physicsTimeHistory, stepTime);
    
    if (stepTime > this.thresholds.maxPhysicsStepTime) {
      this.logWarning('PHYSICS_SLOW', `Physics step took ${stepTime.toFixed(2)}ms (threshold: ${this.thresholds.maxPhysicsStepTime}ms)`);
    }
    
    DebugConsole.verbose('PERFORMANCE', `Physics step: ${stepTime.toFixed(2)}ms`, 2000);
  }
  
  public logRenderTime(renderTime: number): void {
    if (!this.isMonitoring) return;
    
    this.addToHistory(this.renderTimeHistory, renderTime);
    
    if (renderTime > this.thresholds.maxRenderTime) {
      this.logWarning('RENDER_SLOW', `Render time ${renderTime.toFixed(2)}ms (threshold: ${this.thresholds.maxRenderTime}ms)`);
    }
    
    DebugConsole.verbose('PERFORMANCE', `Render time: ${renderTime.toFixed(2)}ms`, 2000);
  }
  
  public logMemoryUsage(): void {
    if (!this.isMonitoring || !('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    
    if (usedMB > this.thresholds.maxMemoryMB) {
      this.logWarning('MEMORY_HIGH', `Memory usage: ${usedMB}MB / ${limitMB}MB (${((usedMB/limitMB)*100).toFixed(1)}%)`);
    }
    
    DebugConsole.debug('PERFORMANCE', `Memory: ${usedMB}MB used, ${totalMB}MB total, ${limitMB}MB limit`, 5000);
  }
  
  public logDrawCallInfo(): void {
    if (!this.isMonitoring || !this.renderer) return;
    
    const info = this.renderer.info;
    const drawCalls = info.render.calls;
    const triangles = info.render.triangles;
    
    if (drawCalls > this.thresholds.maxDrawCalls) {
      this.logWarning('DRAWCALLS_HIGH', `Draw calls: ${drawCalls} (threshold: ${this.thresholds.maxDrawCalls})`);
    }
    
    DebugConsole.debug('PERFORMANCE', `Render: ${drawCalls} calls, ${triangles} triangles`, 3000);
  }
  
  public logNetworkLatency(latency: number): void {
    if (!this.isMonitoring) return;
    
    if (latency > 200) {
      this.logWarning('NETWORK_LATENCY', `High network latency: ${latency}ms`);
    } else if (latency > 100) {
      DebugConsole.warn('PERFORMANCE', `Network latency: ${latency}ms`);
    } else {
      DebugConsole.debug('PERFORMANCE', `Network latency: ${latency}ms`, 5000);
    }
  }
  
  public getMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      fps: this.fps,
      frameTime: this.frameTime,
      memoryUsage: this.getMemoryUsage(),
      physicsStepTime: this.getAverageFromHistory(this.physicsTimeHistory),
      renderTime: this.getAverageFromHistory(this.renderTimeHistory),
      drawCalls: this.renderer?.info.render.calls || 0,
      triangles: this.renderer?.info.render.triangles || 0,
      activeBodies: this.physicsWorld?.bodies.length || 0,
      assetCount: this.scene?.children.length || 0,
      networkLatency: 0 // Will be updated by NetworkManager
    };
    
    return metrics;
  }
  
  public logPerformanceSummary(): void {
    const metrics = this.getMetrics();
    
    DebugConsole.info('PERFORMANCE', 
      `📊 Performance: ${metrics.fps}fps, ${metrics.frameTime.toFixed(1)}ms frame, ` +
      `${metrics.memoryUsage}MB mem, ${metrics.drawCalls} calls, ${metrics.activeBodies} bodies`
    );
  }
  
  public setThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    DebugConsole.info('PERFORMANCE', '⚙️ Performance thresholds updated');
  }
  
  public startProfiling(name: string): number {
    const startTime = performance.now();
    DebugConsole.debug('PERFORMANCE', `🔍 Started profiling: ${name}`);
    return startTime;
  }
  
  public endProfiling(name: string, startTime: number): number {
    const duration = performance.now() - startTime;
    DebugConsole.debug('PERFORMANCE', `✅ ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  private startPeriodicLogging(): void {
    setInterval(() => {
      if (this.isMonitoring) {
        this.logPerformanceSummary();
        this.logMemoryUsage();
        this.logDrawCallInfo();
      }
    }, this.logInterval);
  }
  
  private checkPerformanceThresholds(): void {
    if (this.fps < this.thresholds.minFPS) {
      this.logWarning('FPS_LOW', `Low FPS: ${this.fps} (threshold: ${this.thresholds.minFPS})`);
    }
    
    if (this.frameTime > this.thresholds.maxFrameTime) {
      this.logWarning('FRAMETIME_HIGH', `High frame time: ${this.frameTime.toFixed(2)}ms (threshold: ${this.thresholds.maxFrameTime}ms)`);
    }
  }
  
  private logWarning(type: string, message: string): void {
    const now = Date.now();
    const lastWarning = this.warningCooldowns.get(type) || 0;
    
    if (now - lastWarning > this.cooldownDuration) {
      DebugConsole.warn('PERFORMANCE', `⚠️ ${message}`);
      this.warningCooldowns.set(type, now);
    }
  }
  
  private addToHistory(history: number[], value: number): void {
    history.push(value);
    if (history.length > this.historySize) {
      history.shift();
    }
  }
  
  private getAverageFromHistory(history: number[]): number {
    if (history.length === 0) return 0;
    return history.reduce((sum, val) => sum + val, 0) / history.length;
  }
  
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }
  
  public stop(): void {
    this.isMonitoring = false;
    DebugConsole.info('PERFORMANCE', '🛑 Performance monitoring stopped');
  }
  
  // Static convenience methods
  public static startFrame(): number {
    return PerformanceMonitor.getInstance().startFrame();
  }
  
  public static endFrame(startTime: number): void {
    PerformanceMonitor.getInstance().endFrame(startTime);
  }
  
  public static logPhysicsStep(stepTime: number): void {
    PerformanceMonitor.getInstance().logPhysicsStep(stepTime);
  }
  
  public static logRenderTime(renderTime: number): void {
    PerformanceMonitor.getInstance().logRenderTime(renderTime);
  }
  
  public static profile(name: string): number {
    return PerformanceMonitor.getInstance().startProfiling(name);
  }
  
  public static endProfile(name: string, startTime: number): number {
    return PerformanceMonitor.getInstance().endProfiling(name, startTime);
  }
}
