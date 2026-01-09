/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // External packages that should be bundled on the server
  serverExternalPackages: ['pdf-parse', 'unpdf', 'pdfjs-dist'],
  // Webpack configuration for PDF libraries
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle canvas (optional dependency of pdfjs-dist)
      config.externals.push('canvas')
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

