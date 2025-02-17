import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push(
      {
        test: /\.txt$/,
        // This is the asset module.
        type: 'asset/source',
      }
    )
    return config
  },


  
  /* config options here */
};

export default nextConfig;
