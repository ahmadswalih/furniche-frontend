"use client";

// Custom OpenCascade loader to handle WebAssembly loading in Next.js
declare global {
  interface Window {
    opencascade?: any;
  }
}

export interface OpenCascadeInstance {
  BRepPrimAPI_MakeBox_2: any;
  BRepPrimAPI_MakeCylinder_2: any;
  BRepPrimAPI_MakeSphere_1: any;
  BRepAlgoAPI_Fuse_2: any;
  BRepAlgoAPI_Cut_2: any;
  BRepAlgoAPI_Common_2: any;
  BRepFilletAPI_MakeFillet: any;
  BRepFilletAPI_MakeChamfer: any;
  BRepMesh_IncrementalMesh_2: any;
  TopExp_Explorer_2: any;
  TopAbs_ShapeEnum: any;
  TopLoc_Location_1: any;
  BRep_Tool: any;
  GProp_GProps_1: any;
  BRepGProp: any;
  Bnd_Box_1: any;
  BRepBndLib: any;
  STEPControl_Writer_1: any;
  STEPControl_StepModelType: any;
  IFSelect_PrintCount: any;
  STEPControl_Reader_1: any;
}

class OpenCascadeLoader {
  private static instance: OpenCascadeLoader;
  private oc: OpenCascadeInstance | null = null;
  private isLoading = false;
  private isInitialized = false;

  public static getInstance(): OpenCascadeLoader {
    if (!OpenCascadeLoader.instance) {
      OpenCascadeLoader.instance = new OpenCascadeLoader();
    }
    return OpenCascadeLoader.instance;
  }

  async loadOpenCascade(): Promise<OpenCascadeInstance> {
    if (this.isInitialized && this.oc) {
      return this.oc;
    }

    if (this.isLoading) {
      // Wait for the current loading process to complete
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.oc) return this.oc;
    }

    this.isLoading = true;

    try {
      console.log("🔄 Loading OpenCascade.js WebAssembly module...");

      // Load OpenCascade.js script dynamically
      await this.loadScript("/wasm/opencascade.wasm.js");

      // Wait for the global opencascade function to be available
      await this.waitForGlobal("opencascade");

      // Initialize OpenCascade
      this.oc = await (window as any).opencascade({
        locateFile: (path: string) => {
          console.log(`🔍 Locating file: ${path}`);
          if (path.endsWith(".wasm") || path.endsWith(".wasm.wasm")) {
            return `/wasm/${path}`;
          }
          return path;
        },
        onRuntimeInitialized: () => {
          console.log("🔧 OpenCascade runtime initialized!");
        },
      });

      this.isInitialized = true;
      this.isLoading = false;

      console.log("✅ OpenCascade.js initialized successfully!");
      console.log("🔧 CAD engine ready for professional operations!");

      return this.oc;
    } catch (error) {
      this.isLoading = false;
      console.error("❌ Failed to initialize OpenCascade.js:", error);
      throw new Error(
        `OpenCascade initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;

      script.onload = () => {
        console.log(`✅ Loaded script: ${src}`);
        resolve();
      };

      script.onerror = () => {
        console.error(`❌ Failed to load script: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  private waitForGlobal(globalName: string, timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const check = () => {
        if ((window as any)[globalName]) {
          console.log(`✅ Global ${globalName} is available`);
          resolve();
        } else if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for global ${globalName}`));
        } else {
          setTimeout(check, 100);
        }
      };

      check();
    });
  }

  isReady(): boolean {
    return this.isInitialized && this.oc !== null;
  }

  getOC(): OpenCascadeInstance | null {
    return this.oc;
  }
}

// Export singleton instance
const opencascadeLoader = OpenCascadeLoader.getInstance();
export default opencascadeLoader;
