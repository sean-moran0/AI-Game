import type Anthropic from '@anthropic-ai/sdk';

function getTime(): string {
  console.log('test');
  return new Date().toLocaleString();
}

function rollDice(sides: number, count: number): string {
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0);
  return `Rolled ${count}d${sides}: [${rolls.join(', ')}] = ${total}`;
}

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: 'GetTime',
    description: 'Returns the current date and time.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'RollDice',
    description: 'Rolls dice and returns each result and the total.',
    input_schema: {
      type: 'object',
      properties: {
        sides: { type: 'number', description: 'Number of sides on each die (e.g. 6, 20).' },
        count: { type: 'number', description: 'Number of dice to roll.' },
      },
      required: ['sides', 'count'],
    },
  },
];

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case 'GetTime':
      return getTime();
    case 'RollDice':
      return rollDice(input['sides'] as number, input['count'] as number);
    default:
      return `Unknown tool: ${name}`;
  }
}
