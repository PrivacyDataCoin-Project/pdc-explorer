/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const rules = [
      // Avoid Next pages conflict: bridge.js + bridge/arqx.js cannot coexist.
      { source: "/bridge/arqx", destination: "/bridge-arqx" },
    ];
    // Local UI preview without Postgres/daemon: EXPLORER_API_ORIGIN=https://explorer.privacydatacoin.com
    const apiOrigin = process.env.EXPLORER_API_ORIGIN;
    if (apiOrigin) {
      rules.push({
        source: "/api/:path*",
        destination: `${apiOrigin.replace(/\/$/, "")}/api/:path*`,
      });
    }
    return rules;
  },
  webpack: (config) => {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: {
                  removeViewBox: false
                }
              },
            },
          },
        ],
      }
    );

    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;
