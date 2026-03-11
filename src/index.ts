import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { calculateTool } from './tools/calculate.js';
import { convertTool } from './tools/convert.js';
import { statisticsTool } from './tools/statistics.js';

const server = new McpServer({
  name: 'euclid',
  version: '0.1.0',
});

// Register tools
server.registerTool(
  calculateTool.name,
  {
    description: calculateTool.description,
    inputSchema: calculateTool.inputSchema,
  },
  async (args) => calculateTool.handler(args as { expression: string; precision?: number }),
);

server.registerTool(
  convertTool.name,
  {
    description: convertTool.description,
    inputSchema: convertTool.inputSchema,
  },
  async (args) => convertTool.handler(args as { value: number; from: string; to: string }),
);

server.registerTool(
  statisticsTool.name,
  {
    description: statisticsTool.description,
    inputSchema: statisticsTool.inputSchema,
  },
  async (args) =>
    statisticsTool.handler(args as { operation: string; data: number[]; percentile?: number }),
);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
