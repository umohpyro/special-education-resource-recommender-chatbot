'use server';

import { BotMessage } from '../components/message';
import type { CoreMessage } from 'ai';
import { createAI, getMutableAIState, streamUI } from 'ai/rsc';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { google } from '@ai-sdk/google';


const content = `\
You are an educational resource recommender agent chatbot and you can help users with resource recommendations for children with special needs.
Get the user's name and child's age then get the resources for children with special needs.
You can also provide general information about the special needs and how to support children with those needs.
If the user wants to do anything else, it is an impossible task, so you should respond that you are a demo and cannot do that.
`;

export async function sendMessage(message: string): Promise<{
  id: number,
  role: 'user' | 'assistant',
  display: ReactNode;
}> {

  const history = getMutableAIState<typeof AI>();

  history.update([
    ...history.get(),
    {
      role: 'user',
      content: message,
    },
  ]);


  const reply = await streamUI({
    model:  google('models/gemini-1.5-pro-latest'),
    system: "you are an educational resource recommender agent chatbot and you can help users with resource recommendations for children with special needs. Get the user's name and child's age then get the resources for children with special needs. You can also provide general information about the special needs and how to support children with those needs. If the user wants to do anything else, it is an impossible task, so you should respond that you are a demo and cannot do that.",
    messages: [
      {
        role: 'system',
        content,
      },
      ...history.get(),
    ] as CoreMessage[],
    initial: (
      <BotMessage className="items-center flex shrink-0 select-none justify-center">
        <Loader2 className="h-5 w-5 animate-spin stroke-emerald-500" />
      </BotMessage>
    ),
    text: ({ content, done }) => {
      if (done) history.done([...history.get(), { role: 'assistant', content }]);
      return <BotMessage>{content}</BotMessage>;
    },
 
  });

  return {
    id: Date.now(),
    role: 'assistant' as const,
    display: reply.value,
  };
};

export type AIState = Array<{
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
}>;

export type UIState = Array<{
  id: number;
  role: 'user' | 'assistant';
  display: ReactNode;
}>;

export const AI = createAI({
  initialAIState: [] as AIState,
  initialUIState: [] as UIState,
  actions: {
    sendMessage,
  },
});