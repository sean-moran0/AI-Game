import Anthropic from '@anthropic-ai/sdk';
import { toolDefinitions, executeTool } from './tools.js';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const client = new Anthropic();

export async function sendMessage(
  messages: ConversationMessage[],
  systemPrompt?: string
): Promise<string> {
  const currentMessages: Anthropic.MessageParam[] = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const baseParams = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 16000,
    tools: toolDefinitions,
    ...(systemPrompt !== undefined ? { system: systemPrompt } : {}),
  };

  while (true) {
    const message = await client.messages.stream({
      ...baseParams,
      messages: currentMessages,
    }).finalMessage();

    if (message.stop_reason === 'end_turn') {
      for (const block of message.content) {
        if (block.type === 'text') return block.text;
      }
      return '';
    }
    
    if (message.stop_reason === 'tool_use') {
      currentMessages.push({ role: 'assistant', content: message.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of message.content) {
        if (block.type === 'tool_use') {

          const result = await executeTool(block.name, block.input as Record<string, unknown>);
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }
      }
      currentMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason — return whatever text is available
    for (const block of message.content) {
      if (block.type === 'text') return block.text;
    }
    return '';
  }
}
