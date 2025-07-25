import { mockQdrantResponse } from '../fixtures/mockSearchResults.js';

export class MockQdrantClient {
  private collections: Set<string> = new Set();
  private points: Map<string, any[]> = new Map();

  async getCollections() {
    return {
      collections: Array.from(this.collections).map(name => ({ name }))
    };
  }

  async createCollection(name: string, config: any) {
    if (this.collections.has(name)) {
      throw new Error(`Collection ${name} already exists`);
    }
    this.collections.add(name);
    this.points.set(name, []);
    return { result: true };
  }

  async getCollection(name: string) {
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} not found`);
    }
    return {
      points_count: this.points.get(name)?.length || 0,
      config: {
        params: {
          vectors: {
            size: 384
          }
        }
      }
    };
  }

  async query(collectionName: string, params: any) {
    if (!this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    
    // Return mock results for testing
    return mockQdrantResponse;
  }

  async upsert(collectionName: string, data: any) {
    if (!this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} not found`);
    }
    
    const points = this.points.get(collectionName) || [];
    points.push(...data.points);
    this.points.set(collectionName, points);
    return { result: true };
  }

  async deleteCollection(name: string) {
    this.collections.delete(name);
    this.points.delete(name);
    return { result: true };
  }

  // Helper method for testing
  reset() {
    this.collections.clear();
    this.points.clear();
  }
}