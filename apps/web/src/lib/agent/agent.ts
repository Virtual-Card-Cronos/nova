/**
 * Crypto.com AI Agent SDK Initialization
 * This is the "brain" of NovaAgent
 */

import { SYSTEM_PROMPT } from './prompts'
import { findCard, listAllItems, triggerX402 } from './tools'

type AIProvider = 'openai' | 'gemini'
let cryptoAISDK: { apiKey: string; baseURL: string; provider: AIProvider } | null = null

/**
 * Initialize the Crypto.com AI Agent SDK
 */
export async function initializeCryptoAI() {
  // Determine provider: Gemini or OpenAI
  // Gemini API uses GOOGLE_API_KEY (but we also support GEMINI_API_KEY for convenience)
  const geminiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const openAIKey = process.env.OPENAI_API_KEY
  const aiProviderEnv = process.env.AI_PROVIDER?.toLowerCase()
  const provider = (aiProviderEnv as AIProvider) || (geminiKey ? 'gemini' : 'openai')
  const apiKey = provider === 'gemini' ? geminiKey : openAIKey
  
  // Set base URL based on provider
  let baseURL: string
  if (provider === 'gemini') {
    // Gemini API endpoint
    baseURL = 'https://generativelanguage.googleapis.com/v1beta'
  } else {
    // OpenAI API endpoint
    baseURL = 'https://api.openai.com/v1'
  }

  console.log('[Agent] Initializing AI SDK...')
  console.log('[Agent] AI_PROVIDER env:', aiProviderEnv || '(not set)')
  console.log('[Agent] GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY, process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 8)}...` : '(not set)')
  console.log('[Agent] GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : '(not set)')
  console.log('[Agent] Combined geminiKey present:', !!geminiKey, geminiKey ? `${geminiKey.substring(0, 8)}...` : '(not set)')
  console.log('[Agent] OPENAI_API_KEY present:', !!openAIKey, openAIKey ? `${openAIKey.substring(0, 8)}...` : '(not set)')
  console.log('[Agent] Selected Provider:', provider.toUpperCase())
  console.log('[Agent] Selected API Key present:', !!apiKey)
  console.log('[Agent] Base URL:', baseURL)

  if (!apiKey) {
    console.warn('[Agent] ❌ No AI API key found. Using fallback implementation.')
    console.warn('[Agent] Set GOOGLE_API_KEY (or GEMINI_API_KEY) or OPENAI_API_KEY environment variable.')
    return null
  }

  const sdk = {
    apiKey,
    baseURL,
    provider,
  }

  cryptoAISDK = sdk
  console.log('[Agent] ✅ SDK initialized successfully')
  return sdk
}

/**
 * Get the initialized SDK instance
 */
export function getCryptoAI() {
  return cryptoAISDK
}

/**
 * Process a message with the Crypto.com AI Agent SDK
 * The agent has access to tools: findCard, listAllItems, triggerX402
 */
export async function processWithAgent(
  message: string,
  userAddress: string,
  previousMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{
  reasoning: string
  intent: 'purchase' | 'query' | 'clarification' | 'error'
  purchaseIntent?: any
  message: string
  confidence: number
}> {
  if (!cryptoAISDK) {
    await initializeCryptoAI()
  }

  if (!cryptoAISDK) {
    console.warn('[Agent] ⚠️ SDK not initialized, using fallback processing')
    // Fallback to rule-based processing
    return processWithFallback(message, userAddress)
  }

  console.log('[Agent] 🚀 Processing message with AI:', message.substring(0, 50))
  
  try {
    // Define functions for the AI to call
    const functions = [
      {
        type: 'function',
        function: {
          name: 'findCard',
          description: 'Searches Gift Up! catalog for gift cards matching a brand name',
          parameters: {
            type: 'object',
            properties: {
              brand: {
                type: 'string',
                description: 'The brand name to search for (e.g., "Steam", "Amazon", "Roblox")',
              },
            },
            required: ['brand'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'listAllItems',
          description: 'Lists all available gift card items from Gift Up! catalog. Use this when users ask to see available options, search for gift cards, or browse the catalog.',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
    ]

    // Build request based on provider
    let requestBody: any
    let endpoint: string
    let headers: Record<string, string>

    if (cryptoAISDK.provider === 'gemini') {
      // Gemini API format
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      endpoint = `${cryptoAISDK.baseURL}/models/${model}:generateContent?key=${cryptoAISDK.apiKey}`
      
      // Convert functions to Gemini functionDeclarations format
      const functionDeclarations = functions.map((f: any) => ({
        name: f.function.name,
        description: f.function.description,
        parameters: f.function.parameters,
      }))

      // Build contents array (Gemini format)
      const contents: any[] = []
      
      // Add system prompt as first user message
      contents.push({
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      })
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will help you find and purchase gift cards using the available tools.' }],
      })

      // Add previous messages
      for (const msg of previousMessages) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })
      }

      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      })

      requestBody = {
        contents,
        tools: functionDeclarations.length > 0 ? [{
          functionDeclarations,
        }] : undefined,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }

      headers = {
        'Content-Type': 'application/json',
      }
    } else {
      // OpenAI API format
      endpoint = `${cryptoAISDK.baseURL}/chat/completions`
      requestBody = {
        model: process.env.CRYPTO_AI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...previousMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: message,
          },
        ],
        tools: functions,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      }

      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cryptoAISDK.apiKey}`,
      }
    }

    console.log('[Agent] 📡 Making API call to:', endpoint)
    console.log('[Agent] Provider:', cryptoAISDK.provider)
    console.log('[Agent] Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500))

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log('[Agent] 📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Agent] ❌ API Error:', response.status, errorText)
      
      // If Crypto.com AI endpoint fails and we're not using OpenAI, try OpenAI as fallback
      if (cryptoAISDK.baseURL !== 'https://api.openai.com/v1' && 
          (response.status === 404 || response.status === 400)) {
        console.warn('[Agent] ⚠️ Crypto.com AI endpoint failed, falling back to OpenAI')
        const openAIKey = process.env.OPENAI_API_KEY
        if (openAIKey) {
          console.log('[Agent] 🔄 Retrying with OpenAI API...')
          cryptoAISDK.baseURL = 'https://api.openai.com/v1'
          cryptoAISDK.apiKey = openAIKey
          // Retry the request with OpenAI
          return processWithAgent(message, userAddress, previousMessages)
        }
      }
      
      throw new Error(`AI API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('[Agent] ✅ API Response received:', JSON.stringify(data, null, 2).substring(0, 1000))
    
    // Parse response based on provider
    let aiMessage: any
    if (cryptoAISDK.provider === 'gemini') {
      // Gemini response format
      const candidate = data.candidates?.[0]
      if (!candidate || !candidate.content) {
        console.error('[Agent] ❌ No message in response:', data)
        throw new Error('No response from AI')
      }
      
      console.log('[Agent] 🔍 Gemini candidate content parts:', JSON.stringify(candidate.content.parts, null, 2))
      
      // Extract text content and function calls from all parts
      const textParts = candidate.content.parts?.filter((part: any) => part.text) || []
      const functionCallParts = candidate.content.parts?.filter((part: any) => part.functionCall) || []
      
      const content = textParts.map((p: any) => p.text).join(' ') || ''
      const functionCalls = functionCallParts.map((part: any, idx: number) => {
        const funcCall = part.functionCall
        console.log('[Agent] 🔧 Found function call:', funcCall.name, funcCall.args)
        return {
          id: `call_${Date.now()}_${idx}`,
          type: 'function',
          function: {
            name: funcCall.name,
            arguments: JSON.stringify(funcCall.args || {}),
          },
        }
      })

      console.log('[Agent] 📝 Extracted content:', content.substring(0, 100))
      console.log('[Agent] 🔧 Extracted function calls:', functionCalls.length)

      aiMessage = {
        role: 'assistant',
        content,
        tool_calls: functionCalls,
      }
    } else {
      // OpenAI response format
      aiMessage = data.choices[0]?.message
    }

    if (!aiMessage) {
      console.error('[Agent] ❌ No message in response:', data)
      throw new Error('No response from AI')
    }

    console.log('[Agent] 📝 AI Message:', aiMessage.content?.substring(0, 100))
    console.log('[Agent] 🔧 Tool calls:', aiMessage.tool_calls?.length || 0)
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log('[Agent] 🔧 Tool call details:', JSON.stringify(aiMessage.tool_calls, null, 2))
    }

    // Handle function calls
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log('[Agent] 🔨 Executing tool calls:', aiMessage.tool_calls.map((t: any) => t.function.name))
      const toolResults = []
      
      for (const toolCall of aiMessage.tool_calls) {
        console.log('[Agent] 🔨 Calling tool:', toolCall.function.name, 'with args:', toolCall.function.arguments)
        const { name, arguments: args } = toolCall.function
        let result: any

        if (name === 'findCard') {
          const { brand } = JSON.parse(args)
          result = await findCard(brand)
          if (cryptoAISDK.provider === 'gemini') {
            toolResults.push({
              functionResponse: {
                name: toolCall.function.name,
                response: result,
              },
            })
          } else {
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            })
          }
        } else if (name === 'listAllItems') {
          result = await listAllItems()
          // Filter items if user specified a max price
          const maxPriceMatch = message.toLowerCase().match(/less than \$?(\d+)|under \$?(\d+)|max \$?(\d+)/i)
          const maxPrice = maxPriceMatch ? parseFloat(maxPriceMatch[1] || maxPriceMatch[2] || maxPriceMatch[3]) * 100 : null
          
          let filteredItems = result
          if (maxPrice) {
            filteredItems = result.filter((item: any) => item.price <= maxPrice)
          }
          
          if (cryptoAISDK.provider === 'gemini') {
            toolResults.push({
              functionResponse: {
                name: toolCall.function.name,
                response: filteredItems,
              },
            })
          } else {
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(filteredItems),
            })
          }
        }
      }

      // Make a second call with tool results
      let secondRequestBody: any
      let secondEndpoint: string
      let secondHeaders: Record<string, string>

      if (cryptoAISDK.provider === 'gemini') {
        // Gemini format for follow-up
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        secondEndpoint = `${cryptoAISDK.baseURL}/models/${model}:generateContent?key=${cryptoAISDK.apiKey}`
        
        const contents: any[] = []
        contents.push({ role: 'user', parts: [{ text: SYSTEM_PROMPT }] })
        contents.push({ role: 'model', parts: [{ text: 'Understood.' }] })
        
        for (const msg of previousMessages) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })
        }
        
        contents.push({ role: 'user', parts: [{ text: message }] })
        
        // Add model response with function calls
        const modelParts: any[] = []
        if (aiMessage.content) {
          modelParts.push({ text: aiMessage.content })
        }
        
        // Add function calls
        for (const toolCall of aiMessage.tool_calls || []) {
          modelParts.push({
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || '{}'),
            },
          })
        }
        
        contents.push({
          role: 'model',
          parts: modelParts,
        })
        
        // Add function responses
        for (const tr of toolResults) {
          contents.push({
            role: 'function',
            parts: [{
              functionResponse: tr.functionResponse,
            }],
          })
        }

        secondRequestBody = {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }

        secondHeaders = {
          'Content-Type': 'application/json',
        }
      } else {
        // OpenAI format
        secondEndpoint = `${cryptoAISDK.baseURL}/chat/completions`
        secondRequestBody = {
          model: process.env.CRYPTO_AI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            ...previousMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            {
              role: 'user',
              content: message,
            },
            {
              role: aiMessage.role || 'assistant',
              content: aiMessage.content || '',
              tool_calls: aiMessage.tool_calls,
            },
            ...toolResults,
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }

        secondHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cryptoAISDK.apiKey}`,
        }
      }

      const secondResponse = await fetch(secondEndpoint, {
        method: 'POST',
        headers: secondHeaders,
        body: JSON.stringify(secondRequestBody),
      })

      if (!secondResponse.ok) {
        throw new Error(`AI API error: ${secondResponse.statusText}`)
      }

      const secondData = await secondResponse.json()
      
      // Parse second response based on provider
      let finalMessage: string
      if (cryptoAISDK.provider === 'gemini') {
        finalMessage = secondData.candidates?.[0]?.content?.parts?.[0]?.text || 
                       aiMessage.content || 
                       'I found the gift cards. Would you like to purchase one?'
      } else {
        finalMessage = secondData.choices[0]?.message?.content || 
                       aiMessage.content || 
                       'I found the gift cards. Would you like to purchase one?'
      }

      // Try to parse as JSON for purchase intent, otherwise return as query response
      try {
        const parsed = JSON.parse(finalMessage)
        return parsed
      } catch {
        // If not JSON, check if we should create a purchase intent
        let toolResult: any
        if (cryptoAISDK.provider === 'gemini') {
          toolResult = toolResults[0]?.functionResponse?.response
        } else {
          toolResult = JSON.parse(toolResults[0]?.content || 'null')
        }
        
        if (toolResult && Array.isArray(toolResult) && toolResult.length > 0) {
          // User asked about items - return query response
          const itemsList = toolResult
            .slice(0, 10)
            .map((item: any) => `- ${item.name}: $${(item.price / 100).toFixed(2)}`)
            .join('\n')
          
          return {
            reasoning: 'User asked to see available gift cards. Retrieved catalog from Gift Up!.',
            intent: 'query',
            message: `Here are the available gift cards:\n\n${itemsList}\n\nWould you like to purchase one? Just tell me which one!`,
            confidence: 0.9,
          }
        }
        
        return {
          reasoning: 'Processed user query with tool assistance.',
          intent: 'query',
          message: finalMessage,
          confidence: 0.8,
        }
      }
    }

    // No function calls - regular response
    const content = aiMessage.content || 'I understand. How can I help you?'
    
    // Try to parse as JSON for structured response
    try {
      const parsed = JSON.parse(content)
      return parsed
    } catch {
      // Return as query response
      return {
        reasoning: 'User message processed without tool calls.',
        intent: 'query',
        message: content,
        confidence: 0.7,
      }
    }
  } catch (error) {
    console.error('[Agent] ❌ Crypto.com AI SDK error:', error)
    console.error('[Agent] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    // Fallback to rule-based processing
    console.warn('[Agent] ⚠️ Falling back to rule-based processing')
    return processWithFallback(message, userAddress)
  }
}

/**
 * Fallback rule-based processing
 */
async function processWithFallback(
  message: string,
  userAddress: string
): Promise<{
  reasoning: string
  intent: 'purchase' | 'query' | 'clarification' | 'error'
  purchaseIntent?: any
  message: string
  confidence: number
}> {
  const lower = message.toLowerCase()
  const purchaseKeywords = ['buy', 'purchase', 'get', 'order', 'want', 'need']
  const queryKeywords = ['search', 'find', 'list', 'show', 'available', 'options', 'browse', 'catalog', 'less than', 'under', 'max']
  const hasPurchaseIntent = purchaseKeywords.some((kw) => lower.includes(kw))
  const hasQueryIntent = queryKeywords.some((kw) => lower.includes(kw))

  // Handle queries about available gift cards
  if (hasQueryIntent && !hasPurchaseIntent) {
    const { listAllItems } = await import('./tools')
    const items = await listAllItems()
    
    // Filter by max price if specified
    const maxPriceMatch = lower.match(/less than \$?(\d+)|under \$?(\d+)|max \$?(\d+)/i)
    const maxPrice = maxPriceMatch ? parseFloat(maxPriceMatch[1] || maxPriceMatch[2] || maxPriceMatch[3]) * 100 : null
    
    let filteredItems = items
    if (maxPrice) {
      filteredItems = items.filter((item) => item.price <= maxPrice)
    }
    
    if (filteredItems.length === 0) {
      return {
        reasoning: 'User asked for gift cards but no items match the criteria.',
        intent: 'query',
        message: `I couldn't find any gift cards matching your criteria. Available items include Steam, Amazon, Roblox, and more. Would you like to see all options?`,
        confidence: 0.8,
      }
    }
    
    const itemsList = filteredItems
      .slice(0, 10)
      .map((item) => `- ${item.name}: $${(item.price / 100).toFixed(2)}`)
      .join('\n')
    
    return {
      reasoning: 'User asked to see available gift cards. Retrieved catalog from Gift Up!.',
      intent: 'query',
      message: `Here are the available gift cards${maxPrice ? ` under $${maxPrice / 100}` : ''}:\n\n${itemsList}\n\nWould you like to purchase one? Just tell me which one!`,
      confidence: 0.9,
    }
  }

  if (!hasPurchaseIntent) {
    return {
      reasoning: 'User is asking a question, not requesting a purchase.',
      intent: 'query',
      message: "I can help you purchase gift cards. Try saying something like 'Buy a $10 Steam card' or 'Get a $25 Amazon gift card'. You can also ask me to search for available options!",
      confidence: 0.9,
    }
  }

  // Extract brand
  const brands = ['steam', 'amazon', 'roblox', 'starbucks', 'netflix', 'spotify', 'uber']
  let brand: string | undefined
  for (const b of brands) {
    if (lower.includes(b)) {
      brand = b
      break
    }
  }

  // Extract amount
  const amountMatch = lower.match(/(?:[\$£€]|usd|gbp|eur)\s*(\d+)|(\d+)\s*(?:dollars?|pounds?|usd|gbp|eur)/i)
  const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : undefined

  if (!brand || !amount) {
    return {
      reasoning: 'Purchase intent detected but missing brand or amount.',
      intent: 'clarification',
      message: `I understand you want to make a purchase. Could you specify the brand (e.g., Steam, Amazon) and amount (e.g., $10)?`,
      confidence: 0.6,
    }
  }

  // Find card in Gift Up!
  const { findCard } = await import('./tools')
  const giftUpItem = await findCard(brand)

  if (!giftUpItem) {
    return {
      reasoning: `No matching gift card found for ${brand}.`,
      intent: 'error',
      message: `Sorry, I couldn't find a ${brand} gift card. Available brands include Steam, Amazon, Roblox, and Starbucks.`,
      confidence: 0.8,
    }
  }

  // Convert price to USDC base units
  const usdcAmount = Math.floor((giftUpItem.price / 100) * 1_000_000).toString()

  return {
    reasoning: `Found ${giftUpItem.name} for $${(giftUpItem.price / 100).toFixed(2)}. Converting to USDC and preparing x402 challenge.`,
    intent: 'purchase',
    purchaseIntent: {
      brand: giftUpItem.name,
      amount: usdcAmount,
      currency: 'USDC',
      description: `${giftUpItem.name} - $${(giftUpItem.price / 100).toFixed(2)} ${giftUpItem.currency}`,
      metadata: {
        giftUpItemId: giftUpItem.id,
        giftUpItemName: giftUpItem.name,
        giftUpPrice: giftUpItem.price,
        giftUpCurrency: giftUpItem.currency,
        requestedBy: userAddress,
      },
    },
    message: `Perfect! I found a ${giftUpItem.name} for $${(giftUpItem.price / 100).toFixed(2)}. I'll verify your policy on-chain, then request an x402 payment authorization.`,
    confidence: 0.95,
  }
}
