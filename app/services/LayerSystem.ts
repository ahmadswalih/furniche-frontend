import { Layer } from "../components/LayerManager";
import { BackendDXFObject } from "../components/BackendDXFImporter";

export class LayerSystem {
  private layers: Map<string, Layer> = new Map();
  private nextLayerId = 1;

  constructor() {
    // Create default system layers
    this.createSystemLayers();
  }

  private createSystemLayers() {
    const systemLayers: Omit<Layer, "id" | "createdAt">[] = [
      {
        name: "Default",
        visible: true,
        locked: false,
        color: "#3B82F6",
        objects: [],
        type: "system",
        description: "Default system layer for basic geometry",
      },
      {
        name: "Grid & Axes",
        visible: true,
        locked: true,
        color: "#10B981",
        objects: [],
        type: "system",
        description: "System layer for grid and reference axes",
      },
    ];

    systemLayers.forEach(layer => {
      this.createLayer(layer);
    });
  }

  createLayer(layerData: Omit<Layer, "id" | "createdAt">): Layer {
    const id = `layer-${this.nextLayerId++}`;
    const layer: Layer = {
      ...layerData,
      id,
      createdAt: new Date(),
    };
    
    this.layers.set(id, layer);
    return layer;
  }

  // Automatically create a layer for imported DXF files
  createDXFLayer(dxfObject: BackendDXFObject): Layer {
    const fileName = dxfObject.metadata?.fileName || "Unknown DXF";
    const layerName = `DXF: ${fileName}`;
    
    // Generate a unique color for the layer
    const colors = [
      "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
      "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
    ];
    const colorIndex = (this.layers.size - 2) % colors.length; // -2 for system layers
    
    const layer = this.createLayer({
      name: layerName,
      visible: true,
      locked: false,
      color: colors[colorIndex],
      objects: [dxfObject.id],
      type: "dxf",
      description: `Imported DXF file: ${fileName}`,
    });

    // Add the DXF object to the layer
    this.addObjectToLayer(layer.id, dxfObject.id);
    
    return layer;
  }

  // Create a layer for user-created geometry
  createGeometryLayer(name: string, color: string = "#3B82F6"): Layer {
    return this.createLayer({
      name,
      visible: true,
      locked: false,
      color,
      objects: [],
      type: "geometry",
      description: "User-created geometry layer",
    });
  }

  addObjectToLayer(layerId: string, objectId: string): boolean {
    const layer = this.layers.get(layerId);
    if (layer && !layer.objects.includes(objectId)) {
      layer.objects.push(objectId);
      return true;
    }
    return false;
  }

  removeObjectFromLayer(layerId: string, objectId: string): boolean {
    const layer = this.layers.get(layerId);
    if (layer) {
      const index = layer.objects.indexOf(objectId);
      if (index > -1) {
        layer.objects.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  getLayer(layerId: string): Layer | undefined {
    return this.layers.get(layerId);
  }

  getAllLayers(): Layer[] {
    return Array.from(this.layers.values());
  }

  getVisibleLayers(): Layer[] {
    return Array.from(this.layers.values()).filter(layer => layer.visible);
  }

  getLayersByType(type: Layer["type"]): Layer[] {
    return Array.from(this.layers.values()).filter(layer => layer.type === type);
  }

  updateLayer(layerId: string, updates: Partial<Layer>): boolean {
    const layer = this.layers.get(layerId);
    if (layer) {
      Object.assign(layer, updates);
      return true;
    }
    return false;
  }

  deleteLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (layer && layer.type !== "system") {
      // Move objects to default layer if they exist
      if (layer.objects.length > 0) {
        const defaultLayer = Array.from(this.layers.values()).find(l => l.name === "Default");
        if (defaultLayer) {
          layer.objects.forEach(objectId => {
            this.addObjectToLayer(defaultLayer.id, objectId);
          });
        }
      }
      
      this.layers.delete(layerId);
      return true;
    }
    return false;
  }

  setLayerVisibility(layerId: string, visible: boolean): boolean {
    return this.updateLayer(layerId, { visible });
  }

  setLayerLock(layerId: string, locked: boolean): boolean {
    return this.updateLayer(layerId, { locked });
  }

  // Get all objects in a specific layer
  getLayerObjects(layerId: string): string[] {
    const layer = this.layers.get(layerId);
    return layer ? layer.objects : [];
  }

  // Get the layer that contains a specific object
  getObjectLayer(objectId: string): Layer | undefined {
    return Array.from(this.layers.values()).find(layer => 
      layer.objects.includes(objectId)
    );
  }

  // Move an object from one layer to another
  moveObjectToLayer(objectId: string, targetLayerId: string): boolean {
    const currentLayer = this.getObjectLayer(objectId);
    if (currentLayer && currentLayer.id !== targetLayerId) {
      this.removeObjectFromLayer(currentLayer.id, objectId);
      this.addObjectToLayer(targetLayerId, objectId);
      return true;
    }
    return false;
  }

  // Get layer statistics
  getLayerStats() {
    const layers = this.getAllLayers();
    return {
      totalLayers: layers.length,
      visibleLayers: layers.filter(l => l.visible).length,
      lockedLayers: layers.filter(l => l.locked).length,
      dxfLayers: layers.filter(l => l.type === "dxf").length,
      geometryLayers: layers.filter(l => l.type === "geometry").length,
      systemLayers: layers.filter(l => l.type === "system").length,
      totalObjects: layers.reduce((sum, l) => sum + l.objects.length, 0),
    };
  }

  // Export layer data for saving/loading
  exportLayers(): Layer[] {
    return this.getAllLayers();
  }

  // Import layer data
  importLayers(layersData: Layer[]): void {
    this.layers.clear();
    this.nextLayerId = 1;
    
    layersData.forEach(layer => {
      this.layers.set(layer.id, {
        ...layer,
        createdAt: new Date(layer.createdAt),
      });
      // Update nextLayerId to avoid conflicts
      const idNum = parseInt(layer.id.split('-')[1]);
      if (idNum >= this.nextLayerId) {
        this.nextLayerId = idNum + 1;
      }
    });
  }

  // Reset to default state
  reset(): void {
    this.layers.clear();
    this.nextLayerId = 1;
    this.createSystemLayers();
  }
}
