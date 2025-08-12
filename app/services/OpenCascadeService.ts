"use client";

import opencascadeLoader, {
  OpenCascadeInstance,
} from "../utils/opencascade-loader";

interface CADShape {
  id: string;
  shape: any; // OpenCascade shape
  type: "solid" | "surface" | "wire" | "edge" | "vertex";
  properties: {
    volume?: number;
    area?: number;
    boundingBox?: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

interface BooleanOperation {
  type: "union" | "difference" | "intersection";
  shapes: CADShape[];
}

class OpenCascadeService {
  private oc: OpenCascadeInstance | null = null;
  private isInitialized = false;
  private shapes: Map<string, CADShape> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Use our custom loader instead of direct import
      this.oc = await opencascadeLoader.loadOpenCascade();
      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize OpenCascade.js:", error);
      console.error("💡 Make sure WebAssembly is supported in your browser");
      throw new Error(
        `OpenCascade initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ============ PRIMITIVE CREATION ============

  createBox(width: number, height: number, depth: number): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const box = new this.oc.BRepPrimAPI_MakeBox_2(width, height, depth);
    const shape = box.Shape();

    const cadShape: CADShape = {
      id: `box_${Date.now()}`,
      shape,
      type: "solid",
      properties: {
        volume: width * height * depth,
        boundingBox: {
          min: [0, 0, 0],
          max: [width, height, depth],
        },
      },
    };

    this.shapes.set(cadShape.id, cadShape);
    return cadShape;
  }

  createCylinder(radius: number, height: number): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const cylinder = new this.oc.BRepPrimAPI_MakeCylinder_2(radius, height);
    const shape = cylinder.Shape();

    const cadShape: CADShape = {
      id: `cylinder_${Date.now()}`,
      shape,
      type: "solid",
      properties: {
        volume: Math.PI * radius * radius * height,
        boundingBox: {
          min: [-radius, -radius, 0],
          max: [radius, radius, height],
        },
      },
    };

    this.shapes.set(cadShape.id, cadShape);
    return cadShape;
  }

  createSphere(radius: number): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const sphere = new this.oc.BRepPrimAPI_MakeSphere_1(radius);
    const shape = sphere.Shape();

    const cadShape: CADShape = {
      id: `sphere_${Date.now()}`,
      shape,
      type: "solid",
      properties: {
        volume: (4 / 3) * Math.PI * radius * radius * radius,
        boundingBox: {
          min: [-radius, -radius, -radius],
          max: [radius, radius, radius],
        },
      },
    };

    this.shapes.set(cadShape.id, cadShape);
    return cadShape;
  }

  // ============ BOOLEAN OPERATIONS ============

  performUnion(shape1: CADShape, shape2: CADShape): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const boolOp = new this.oc.BRepAlgoAPI_Fuse_2(shape1.shape, shape2.shape);
    const result = boolOp.Shape();

    const unionShape: CADShape = {
      id: `union_${Date.now()}`,
      shape: result,
      type: "solid",
      properties: {},
    };

    this.shapes.set(unionShape.id, unionShape);
    return unionShape;
  }

  performDifference(shape1: CADShape, shape2: CADShape): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const boolOp = new this.oc.BRepAlgoAPI_Cut_2(shape1.shape, shape2.shape);
    const result = boolOp.Shape();

    const diffShape: CADShape = {
      id: `difference_${Date.now()}`,
      shape: result,
      type: "solid",
      properties: {},
    };

    this.shapes.set(diffShape.id, diffShape);
    return diffShape;
  }

  performIntersection(shape1: CADShape, shape2: CADShape): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const boolOp = new this.oc.BRepAlgoAPI_Common_2(shape1.shape, shape2.shape);
    const result = boolOp.Shape();

    const intersectionShape: CADShape = {
      id: `intersection_${Date.now()}`,
      shape: result,
      type: "solid",
      properties: {},
    };

    this.shapes.set(intersectionShape.id, intersectionShape);
    return intersectionShape;
  }

  // ============ ADVANCED OPERATIONS ============

  createFillet(
    shape: CADShape,
    radius: number,
    edgeIndices?: number[]
  ): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const filletMaker = new this.oc.BRepFilletAPI_MakeFillet(shape.shape);

    // If no specific edges, fillet all edges
    if (!edgeIndices) {
      const explorer = new this.oc.TopExp_Explorer_2(
        shape.shape,
        this.oc.TopAbs_ShapeEnum.TopAbs_EDGE
      );
      while (explorer.More()) {
        const edge = explorer.Current();
        filletMaker.Add_2(radius, edge);
        explorer.Next();
      }
    }

    const filletedShape = filletMaker.Shape();

    const result: CADShape = {
      id: `filleted_${Date.now()}`,
      shape: filletedShape,
      type: "solid",
      properties: {},
    };

    this.shapes.set(result.id, result);
    return result;
  }

  createChamfer(shape: CADShape, distance: number): CADShape {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const chamferMaker = new this.oc.BRepFilletAPI_MakeChamfer(shape.shape);

    const explorer = new this.oc.TopExp_Explorer_2(
      shape.shape,
      this.oc.TopAbs_ShapeEnum.TopAbs_EDGE
    );
    while (explorer.More()) {
      const edge = explorer.Current();
      chamferMaker.Add_2(distance, edge);
      explorer.Next();
    }

    const chamferedShape = chamferMaker.Shape();

    const result: CADShape = {
      id: `chamfered_${Date.now()}`,
      shape: chamferedShape,
      type: "solid",
      properties: {},
    };

    this.shapes.set(result.id, result);
    return result;
  }

  // ============ MESH CONVERSION ============

  convertToMesh(
    shape: CADShape,
    quality: number = 0.1
  ): {
    vertices: number[];
    normals: number[];
    indices: number[];
  } {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    // Mesh the shape
    const mesh = new this.oc.BRepMesh_IncrementalMesh_2(
      shape.shape,
      quality,
      false,
      0.5,
      false
    );

    const vertices: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    // Extract triangulation data
    const explorer = new this.oc.TopExp_Explorer_2(
      shape.shape,
      this.oc.TopAbs_ShapeEnum.TopAbs_FACE
    );
    let vertexIndex = 0;

    while (explorer.More()) {
      const face = explorer.Current();
      const location = new this.oc.TopLoc_Location_1();
      const triangulation = this.oc.BRep_Tool.Triangulation(face, location);

      if (!triangulation.IsNull()) {
        const transform = location.Transformation();
        const nodeCount = triangulation.get().NbNodes();
        const triangleCount = triangulation.get().NbTriangles();

        // Extract vertices
        for (let i = 1; i <= nodeCount; i++) {
          const node = triangulation.get().Node(i);
          const transformedNode = node.Transformed(transform);
          vertices.push(
            transformedNode.X(),
            transformedNode.Y(),
            transformedNode.Z()
          );
          normals.push(0, 1, 0); // Simplified normal calculation
        }

        // Extract triangles
        for (let i = 1; i <= triangleCount; i++) {
          const triangle = triangulation.get().Triangle(i);
          const [n1, n2, n3] = [
            triangle.Value(1),
            triangle.Value(2),
            triangle.Value(3),
          ];
          indices.push(
            vertexIndex + n1 - 1,
            vertexIndex + n2 - 1,
            vertexIndex + n3 - 1
          );
        }

        vertexIndex += nodeCount;
      }

      explorer.Next();
    }

    return { vertices, normals, indices };
  }

  // ============ FILE I/O ============

  async exportSTEP(shape: CADShape, filename?: string): Promise<string> {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const writer = new this.oc.STEPControl_Writer_1();
    writer.Transfer(
      shape.shape,
      this.oc.STEPControl_StepModelType.STEPControl_AsIs
    );

    const stepData = writer.PrintCheckTransfer_2(
      false,
      this.oc.IFSelect_PrintCount.IFSelect_ItemsByEntity
    );
    return stepData;
  }

  async importSTEP(stepData: string): Promise<CADShape[]> {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const reader = new this.oc.STEPControl_Reader_1();
    reader.ReadFile(stepData);

    const shapes: CADShape[] = [];
    const nbRoots = reader.NbRootsForTransfer();

    for (let i = 1; i <= nbRoots; i++) {
      reader.TransferRoot(i);
      const shape = reader.OneShape();

      const cadShape: CADShape = {
        id: `imported_${Date.now()}_${i}`,
        shape,
        type: "solid",
        properties: {},
      };

      this.shapes.set(cadShape.id, cadShape);
      shapes.push(cadShape);
    }

    return shapes;
  }

  // ============ SHAPE ANALYSIS ============

  calculateVolume(shape: CADShape): number {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const props = new this.oc.GProp_GProps_1();
    this.oc.BRepGProp.VolumeProperties_1(shape.shape, props);
    return props.Mass();
  }

  calculateSurfaceArea(shape: CADShape): number {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const props = new this.oc.GProp_GProps_1();
    this.oc.BRepGProp.SurfaceProperties_1(shape.shape, props);
    return props.Mass();
  }

  getBoundingBox(shape: CADShape): {
    min: [number, number, number];
    max: [number, number, number];
  } {
    if (!this.oc) throw new Error("OpenCascade not initialized");

    const bbox = new this.oc.Bnd_Box_1();
    this.oc.BRepBndLib.Add(shape.shape, bbox);

    const min = bbox.CornerMin();
    const max = bbox.CornerMax();

    return {
      min: [min.X(), min.Y(), min.Z()],
      max: [max.X(), max.Y(), max.Z()],
    };
  }

  // ============ UTILITY METHODS ============

  getShape(id: string): CADShape | undefined {
    return this.shapes.get(id);
  }

  getAllShapes(): CADShape[] {
    return Array.from(this.shapes.values());
  }

  deleteShape(id: string): boolean {
    return this.shapes.delete(id);
  }

  clearAllShapes(): void {
    this.shapes.clear();
  }

  public isReady(): boolean {
    return this.isInitialized && opencascadeLoader.isReady();
  }
}

// Singleton instance
const openCascadeService = new OpenCascadeService();

export default openCascadeService;
export type { CADShape, BooleanOperation };
