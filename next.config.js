/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true, // خطاهای eslint موقع build نادیده گرفته میشن
    },
    typescript: {
        ignoreBuildErrors: true, // خطاهای typeScript هم نادیده گرفته میشن
    },
};

module.exports = nextConfig;
