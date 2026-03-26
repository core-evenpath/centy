# Flow Engine — Implementation Status

## Phase 1: Flow Engine Types
**Status: COMPLETE**
- File: `src/lib/types-flow-engine.ts`
- 9 FlowStageTypes, 12 IntentSignals, 5 LeadTemperature levels
- Interfaces: FlowStage, FlowTransition, FlowDefinition, FlowSettings, ConversationFlowState, FlowEngineDecision, SystemFlowTemplate

## Phase 2: Flow Engine Core Logic
**Status: COMPLETE**
- File: `src/lib/flow-engine.ts`
- Pure synchronous logic, zero async calls
- Exports: `createInitialFlowState`, `detectIntent`, `calculateLeadTemperature`, `runFlowEngine`
- Intent detection: deterministic keyword matching with priority ordering
- State machine: intent-to-stage mapping, flow transition resolution, lead scoring, block type suggestion via taxonomy

## Phase 3: System Flow Templates
**Status: COMPLETE**
- File: `src/lib/flow-templates.ts`
- 8 pre-built templates: hotels_resorts, full_service_restaurant, fitness_gym, dental_care, real_estate, ecommerce_d2c, hair_beauty, plumbing_electrical
- Each has 4-6 stages, intent-based transitions, and tuned FlowSettings
- Exports: `SYSTEM_FLOW_TEMPLATES`, `getFlowTemplateForFunction()`, `getDefaultFlowForIndustry()`

## Phase 4: Server Actions
**Status: COMPLETE**
- File: `src/actions/flow-engine-actions.ts`
- 8 server actions: getFlowTemplatesAction, getPartnerFlowAction, savePartnerFlowAction, deletePartnerFlowAction, getConversationFlowStateAction, updateConversationFlowStateAction, getFlowAnalyticsAction, getAllFlowTemplatesAction
- Firestore paths: `partners/{id}/relayConfig/flowDefinition` for flows, `relayConversations/{id}.flowState` for conversation state

## Phase 5: Chat API Integration
**Status: COMPLETE**
- File: `src/app/api/relay/chat/route.ts` (modified)
- Extracts partner functionId from `businessPersona.identity.businessCategories[0].functionId`
- Loads/creates conversation flow state from Firestore
- Loads partner custom flow or falls back to system template
- Runs flow engine before system prompt construction
- Injects flow context (stage, preferred blocks, lead temperature) into system prompt
- Added 7 new block type JSON templates to system prompt
- Updates flow state after Gemini response (tracks items viewed/compared)
- Saves flow state to Firestore alongside turn data
- Returns `flowMeta` in response (stage, leadTemperature, leadScore, shouldHandoff, turnCount)

---

## Files Created
1. `src/lib/types-flow-engine.ts`
2. `src/lib/flow-engine.ts`
3. `src/lib/flow-templates.ts`
4. `src/actions/flow-engine-actions.ts`

## Files Modified
1. `src/app/api/relay/chat/route.ts`

## TypeScript
Passes (no new errors)

---

## 5-Turn Conversation Trace: `hotels_resorts`

### Turn 1: "Hi, what rooms do you have?"
- **detectIntent**: "rooms" not in keywords, "what" + "?" -> `inquiry`, but "show me" pattern not matched, "?" present -> `inquiry`
- **runFlowEngine**: intent=inquiry, flow entry stage = `hr_greeting` (isEntry=true). No transition from greeting for `inquiry`, triggerIntents check -> no match, fallback INTENT_TO_STAGE[inquiry] = `objection`, but flow has no objection stage -> stays at greeting via fallback transition -> `hr_discovery`
- **Stage**: greeting -> discovery | **Score**: 0+2=2 | **Temp**: cold
- **Blocks**: rooms, catalog, gallery (from taxonomy primaryBlocks intersected with STAGE_TO_BLOCKS[discovery])

### Turn 2: "How much does the deluxe suite cost?"
- **detectIntent**: "how much" matches pricing keywords -> `pricing`
- **runFlowEngine**: from hr_discovery, no explicit transition for `pricing`. triggerIntents check: no stage triggers on pricing. INTENT_TO_STAGE[pricing] = `showcase`. Flow has no showcase stage -> stays at hr_discovery
- **Stage**: discovery | **Score**: 2+2=4 | **Temp**: warming
- **Blocks**: rooms, catalog, gallery

### Turn 3: "Can you compare the deluxe and premium suites?"
- **detectIntent**: "compare" matches -> `comparing`
- **runFlowEngine**: from hr_discovery, transition `hr_discovery -> hr_comparison` on `comparing` (priority 10) -> moves to hr_comparison
- **Stage**: comparison | **Score**: 4+4=8 | **Temp**: warm
- **Blocks**: compare (from STAGE_TO_BLOCKS[comparison], allowed by taxonomy)

### Turn 4: "I'd like to book the premium suite"
- **detectIntent**: "book" matches -> `booking`
- **runFlowEngine**: from hr_comparison, transition `hr_comparison -> hr_conversion` on `booking` (priority 20) -> moves to hr_conversion
- **Stage**: conversion | **Score**: 8+5=13 | **Temp**: hot
- **Blocks**: book, reserve (from taxonomy primary + STAGE_TO_BLOCKS[conversion])
- **shouldHandoff**: score 13 >= threshold 12 -> true
- **contextForAI**: includes "Lead temperature is HIGH — prioritize conversion blocks" and handoff suggestion

### Turn 5: "Actually, can I speak to someone about group rates?"
- **detectIntent**: "speak to" matches contact -> `contact`
- **runFlowEngine**: from hr_conversion, transition `hr_conversion -> hr_handoff` on `contact` (priority 10) -> moves to hr_handoff
- **Stage**: handoff | **Score**: 13+0=13 | **Temp**: hot
- **Blocks**: handoff, contact
- **shouldHandoff**: true (score still above threshold + contact intent)
- **contextForAI**: "The visitor seems to need human assistance. Include a handoff block type."
