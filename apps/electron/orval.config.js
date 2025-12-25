export default {
  api: {
    input: './openapi.json', // Use the generated schema in the same directory
    output: {
      target: './src/renderer/src/gen/api/api.ts',
      client: 'swr',
      clean: true,
    },
  },
};