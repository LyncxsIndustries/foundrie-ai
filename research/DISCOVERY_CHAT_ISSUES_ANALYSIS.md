# Discovery Chat Issues & Solution Architecture

**Date:** 2026-08-08  
**Critical Priority:** P0 - Blocking Discovery Completion

---

## Core Problems Identified

### 1. **No Memory/Context** ❌
- AI doesn't remember previous answers
- Repeats questions already answered
- No semantic memory of conversation history
- No RAG for context retrieval

### 2. **No Phase Completion Logic** ❌
- AI doesn't know when enough information is gathered
- No tracking of questions vs answers
- No mutation of question list based on answers
- Loops indefinitely asking redundant questions

### 3. **No Structured Question Management** ❌
- AI doesn't start with a predefined question list
- No tracking of which questions are answered
- No dynamic question addition/removal
- No completion criteria per phase

### 4. **Chat vs Tool Execution Confusion** ❌
- LLM doing everything (chat + state tracking + DB updates)
- No separation of concerns
- No harness for structured tool execution
- DB updates and state mutations happen inconsistently

### 5. **No Model Testing/Visibility** ❌
- Don't know which models are working
- No fallback testing
- API keys exist but models not validated
- Claude Anthropic not yet purchased (will buy before launch)

---

## Solution Architecture: Hybrid Approach

### Layer 1: Trigger.dev Chat Agent (Durability)
- Survives page refreshes, crashes, redeploys
- Lifecycle hooks for state management
- Tool execution with human-in-the-loop
- Automatic streaming without API routes

### Layer 2: Custom Rotation Engine (Intelligence)
- Task-specific routing (discovery → Gemini Pro, critique → DeepSeek R1)
- Tier-aware selection (FREE → DeepSeek, PRO → Claude)
- Multi-provider fallback chains
- Vision routing for image uploads

### Layer 3: Semantic Memory & RAG (Context)
- ChromaDB vector store for conversation history
- Semantic similarity search for answered questions
- Prevents question repetition
- Context-aware responses

### Layer 4: Structured Harness (Tool Execution)
- Separation: Chat (LLM) vs Tools (DB/State mutations)
- Phase completion tool checks question coverage
- Question list generator tool at phase start
- State tracking tool for phase progression

---

## Implementation Plan

### Feature 113 - Discovery Chat Memory & RAG Integration
- ChromaDB vector store setup
- Semantic memory for answered questions
- Context injection before each AI response
- Question deduplication logic

### Feature 114 - Structured Phase Completion System
- Question list generation at phase start
- Question tracking (asked, answered, skipped)
- Dynamic question mutation based on answers
- Automated phase completion when criteria met

### Feature 115 - Chat vs Tool Separation (Harness)
- Chat tool: LLM responses only
- DB tool: State mutations (phase updates, message storage)
- Completion checker tool: Evaluates phase readiness
- Question manager tool: Adds/removes questions dynamically

### Feature 116 - Model Testing & Validation Suite
- Test all provider connections
- Validate fallback chains
- Monitor model availability
- Cost tracking per model

### Feature 117 - Discovery Chat Trigger.dev Migration
- Replace `/api/conversations/[projectId]/chat` with `chat.agent()`
- Integrate custom rotation engine
- Add lifecycle hooks for state management
- Implement tool execution harness

---

## The Working Flow

```typescript
// 1. User starts discovery
chat.agent({
  onChatStart: async ({ projectId, userId }) => {
    // Generate initial question list using tool
    const questions = await generatePhaseQuestions(PHASE_1, projectId);
    
    // Store in semantic memory
    await chromaDB.addQuestions(questions);
    
    // Update DB state
    await updatePhaseState(projectId, {
      phase: PHASE_1,
      questions,
      answered: [],
    });
  },
  
  run: async ({ messages, signal }) => {
    // 1. Retrieve context from semantic memory
    const lastMessage = messages[messages.length - 1];
    const context = await chromaDB.searchSimilar(lastMessage.content);
    
    // 2. Check which questions are answered
    const phaseState = await getPhaseState(projectId);
    const answeredQuestions = await checkAnsweredQuestions(
      phaseState.questions,
      context
    );
    
    // 3. Build prompt with context
    const systemPrompt = buildDiscoveryPrompt({
      phase: phaseState.phase,
      remainingQuestions: phaseState.questions.filter(
        q => !answeredQuestions.includes(q.id)
      ),
      answeredSoFar: answeredQuestions,
      conversationContext: context,
    });
    
    // 4. Call custom rotation engine
    const stream = await callAIStream('discovery-synthesis', {
      systemPrompt,
      userPrompt: lastMessage.content,
      plan: clientData.plan,
      signal,
    });
    
    // 5. Stream response (Trigger.dev handles this)
    await chat.pipe(stream);
  },
  
  onTurnComplete: async ({ responseMessage }) => {
    // 1. Store in semantic memory
    await chromaDB.addMessage(responseMessage);
    
    // 2. Update answered questions
    const updated = await updateAnsweredQuestions(projectId);
    
    // 3. Check phase completion
    const isComplete = await checkPhaseCompletion(projectId);
    
    if (isComplete) {
      // Tool execution: Update DB
      await advancePhase(projectId);
      
      // Generate next phase questions
      const nextQuestions = await generatePhaseQuestions(
        nextPhase,
        projectId
      );
      
      // Notify user
      chat.response.write({
        type: 'data-phase-complete',
        data: { phase: currentPhase, nextPhase },
      });
    }
  },
});
```

---

## ChromaDB Integration

```typescript
// lib/memory/chromadb.ts
import { ChromaClient } from 'chromadb';

export async function initChromaDB() {
  const client = new ChromaClient({ path: process.env.CHROMA_URL });
  
  const collection = await client.getOrCreateCollection({
    name: 'discovery_conversations',
    metadata: { 'hnsw:space': 'cosine' },
  });
  
  return collection;
}

export async function addMessageToMemory(
  conversationId: string,
  message: { role: string; content: string }
) {
  const collection = await initChromaDB();
  
  await collection.add({
    ids: [`${conversationId}-${Date.now()}`],
    documents: [message.content],
    metadatas: [{
      conversationId,
      role: message.role,
      timestamp: new Date().toISOString(),
    }],
  });
}

export async function searchSimilarMessages(
  conversationId: string,
  query: string,
  limit: number = 5
) {
  const collection = await initChromaDB();
  
  const results = await collection.query({
    queryTexts: [query],
    nResults: limit,
    where: { conversationId },
  });
  
  return results;
}
```

---

## Question Management System

```typescript
// lib/discovery/question-manager.ts

export interface DiscoveryQuestion {
  id: string;
  text: string;
  phase: DiscoveryPhase;
  required: boolean;
  answered: boolean;
  answer?: string;
  followUps?: string[];
}

export async function generatePhaseQuestions(
  phase: DiscoveryPhase,
  projectId: string
): Promise<DiscoveryQuestion[]> {
  // Use AI to generate initial questions
  const prompt = `Generate 5-7 essential questions for ${phase}`;
  
  const response = await callAI('discovery-question-generation', {
    systemPrompt: QUESTION_GENERATION_PROMPT,
    userPrompt: prompt,
    plan: 'PRO',
  });
  
  const questions = parseQuestions(response.text);
  
  // Store in DB
  await db.discoverySession.update({
    where: { projectId },
    data: {
      questions: {
        push: questions,
      },
    },
  });
  
  return questions;
}

export async function checkAnsweredQuestions(
  questions: DiscoveryQuestion[],
  conversationHistory: string[]
): Promise<string[]> {
  // Use semantic similarity to check if questions are answered
  const answeredIds: string[] = [];
  
  for (const question of questions) {
    if (question.answered) continue;
    
    const similarity = await checkQuestionAnswered(
      question.text,
      conversationHistory
    );
    
    if (similarity > 0.8) {
      answeredIds.push(question.id);
    }
  }
  
  return answeredIds;
}

async function checkQuestionAnswered(
  question: string,
  history: string[]
): Promise<number> {
  // Semantic similarity check
  const results = await chromaDB.searchSimilar(question, 3);
  
  // Calculate average similarity
  const avgSimilarity = results.distances[0].reduce((a, b) => a + b, 0) / results.distances[0].length;
  
  return 1 - avgSimilarity; // ChromaDB returns distances, convert to similarity
}
```

---

## Next Steps

1. Create Feature 113-117 specs
2. Update existing discovery specs (10, 64, 65-70)
3. Install ChromaDB
4. Test all AI model connections
5. Implement hybrid architecture

This solves all identified issues.
