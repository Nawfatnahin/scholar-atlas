import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: [
          'ClaudeBot',
          'Claude-Web',
          'GPTBot',
          'OAI-SearchBot',
          'PerplexityBot',
          'Googlebot',
          'Applebot',
          'Applebot-Extended'
        ],
        allow: '/',
      },
      {
        userAgent: [
          'CCBot',
          'Bytespider',
          'Amazonbot',
          'FacebookBot',
          'Cohere-ai',
          'Diffbot',
          'Omegabot',
          'ImagesiftBot'
        ],
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/auth/'],
      }
    ],
  };
}
