import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure webpack to handle WebAssembly and OpenCascade.js
  webpack: (config, { isServer }) => {
    // Enable WebAssembly experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };

    // Add rule to ignore .wasm.wasm files during bundling and serve them as static assets
    config.module.rules.push({
      test: /\.wasm\.wasm$/,
      type: "asset/resource",
      generator: {
        filename: "static/wasm/[name][ext]",
      },
    });

    // Also handle regular .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      exclude: /\.wasm\.wasm$/,
      type: "webassembly/async",
    });

    // Ignore specific problematic imports in OpenCascade.js
    config.resolve.alias = {
      ...config.resolve.alias,
      // Point to our custom OpenCascade loader
    };

    // Add externals to prevent bundling of WebAssembly files
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "opencascade.js/dist/opencascade.wasm.wasm":
          "opencascade.js/dist/opencascade.wasm.wasm",
      });
    }

    // Fallback for node modules on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        buffer: false,
        stream: false,
        util: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      };
    }

    return config;
  },

  // Headers for cross-origin isolation (required for SharedArrayBuffer in some browsers)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
