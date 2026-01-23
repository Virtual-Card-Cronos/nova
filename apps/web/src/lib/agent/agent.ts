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
          description: 'Searches gift card database for gift cards matching a brand name',
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
          description: 'Lists all available gift card items from the database with their prices, brands, and inventory. Use this when users ask to: see available options, search for gift cards, browse the catalog, find items by price (e.g., "at least $50", "under $20"), count available brands, or list all options. The function returns an array of items with price (in cents), brand, name, and inventory_count. You can filter and analyze these results to answer price-related queries.',
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
    
    // Convert functions to Gemini functionDeclarations format (for logging)
    const functionDeclarations = functions.map((f: any) => ({
      name: f.function.name,
      description: f.function.description,
      parameters: f.function.parameters,
    }))

    if (cryptoAISDK.provider === 'gemini') {
      // Gemini API format
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      endpoint = `${cryptoAISDK.baseURL}/models/${model}:generateContent?key=${cryptoAISDK.apiKey}`
      
      console.log('[Agent] 🔧 Gemini functionDeclarations:', JSON.stringify(functionDeclarations, null, 2))

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
        toolConfig: functionDeclarations.length > 0 ? {
          functionCallingConfig: {
            mode: 'ANY', // ANY forces the model to call at least one function
            allowedFunctionNames: functionDeclarations.map((f: any) => f.name),
          },
        } : undefined,
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
    console.log('[Agent] Request body (full):', JSON.stringify(requestBody, null, 2))
    console.log('[Agent] Tools registered:', functionDeclarations.length, 'functions')
    if (functionDeclarations.length > 0) {
      console.log('[Agent] Tool names:', functionDeclarations.map((f: any) => f.name).join(', '))
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    console.log('[Agent] 📥 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Agent] ❌ API Error:', response.status, errorText)
      
      // Handle rate limiting - try OpenAI fallback or gracefully degrade
      if (response.status === 429) {
        console.warn('[Agent] ⚠️ Rate limit exceeded (429)')
        try {
          const errorData = JSON.parse(errorText)
          const retryInfo = errorData.error?.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')
          if (retryInfo?.retryDelay) {
            console.warn(`[Agent] ⚠️ Retry after: ${retryInfo.retryDelay}`)
          }
        } catch {
          // Ignore parse errors
        }
        
        // Try OpenAI as fallback if available
        if (cryptoAISDK.baseURL !== 'https://api.openai.com/v1') {
          const openAIKey = process.env.OPENAI_API_KEY
          if (openAIKey) {
            console.log('[Agent] 🔄 Falling back to OpenAI API due to Gemini rate limit...')
            cryptoAISDK.baseURL = 'https://api.openai.com/v1'
            cryptoAISDK.apiKey = openAIKey
            cryptoAISDK.provider = 'openai'
            return processWithAgent(message, userAddress, previousMessages)
          }
        }
        
        // If no OpenAI fallback, throw to trigger rule-based processing
        throw new Error('RATE_LIMIT_EXCEEDED')
      }
      
      // If Crypto.com AI endpoint fails and we're not using OpenAI, try OpenAI as fallback
      if (cryptoAISDK.baseURL !== 'https://api.openai.com/v1' && 
          (response.status === 404 || response.status === 400)) {
        console.warn('[Agent] ⚠️ Crypto.com AI endpoint failed, falling back to OpenAI')
        const openAIKey = process.env.OPENAI_API_KEY
        if (openAIKey) {
          console.log('[Agent] 🔄 Retrying with OpenAI API...')
          cryptoAISDK.baseURL = 'https://api.openai.com/v1'
          cryptoAISDK.apiKey = openAIKey
          cryptoAISDK.provider = 'openai'
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
      if (!candidate) {
        console.error('[Agent] ❌ No candidate in response:', data)
        throw new Error('No response from AI')
      }
      
      // Check if content exists and has parts
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('[Agent] ❌ Empty response from Gemini:', JSON.stringify(candidate, null, 2))
        console.error('[Agent] ❌ Full response:', JSON.stringify(data, null, 2))
        // If finishReason is SAFETY, the model blocked the response
        if (candidate.finishReason === 'SAFETY') {
          throw new Error('Response blocked by safety filters')
        }
        // Return a fallback message
        throw new Error('Empty response from AI - model may have refused to respond')
      }
      
      console.log('[Agent] 🔍 Gemini candidate content parts:', JSON.stringify(candidate.content.parts, null, 2))
      
      // Extract text content and function calls from all parts
      const textParts = candidate.content.parts.filter((part: any) => part.text) || []
      const functionCallParts = candidate.content.parts.filter((part: any) => part.functionCall) || []
      
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
      
      if (functionCalls.length === 0 && functionDeclarations.length > 0) {
        console.warn('[Agent] ⚠️ WARNING: No function calls detected but tools are available!')
        console.warn('[Agent] ⚠️ This means Gemini chose not to call any tools.')
        console.warn('[Agent] ⚠️ Full response parts:', JSON.stringify(candidate.content.parts, null, 2))
        console.warn('[Agent] ⚠️ User message was:', message)
        console.warn('[Agent] ⚠️ Available tools:', functionDeclarations.map((f: any) => f.name).join(', '))
      }

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
            // Gemini function response format
            toolResults.push({
              functionName: toolCall.function.name,
              response: result,
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
          // Filter items based on price queries
          const messageLower = message.toLowerCase()
          
          // Check for "at least $X", "minimum $X", "$X or more", "$X+"
          const minPricePatterns = [
            /(?:at least|minimum|at minimum)\s*\$?(\d+)/i,
            /\$?(\d+)\s*or\s*more/i,
            /\$?(\d+)\s*\+/i,
          ]
          let minPrice: number | null = null
          for (const pattern of minPricePatterns) {
            const match = messageLower.match(pattern)
            if (match && match[1]) {
              minPrice = parseFloat(match[1]) * 100
              break
            }
          }
          
          // Check for "less than $X", "under $X", "max $X"
          const maxPriceMatch = messageLower.match(/(?:less than|under|max|maximum|up to)\s*\$?(\d+)/i)
          const maxPrice = maxPriceMatch ? parseFloat(maxPriceMatch[1]) * 100 : null
          
          let filteredItems = result
          if (minPrice) {
            filteredItems = result.filter((item: any) => item.price >= minPrice)
            console.log(`[Agent] 🔍 Filtered to items with price >= $${minPrice / 100}: ${filteredItems.length} items`)
          }
          if (maxPrice) {
            filteredItems = filteredItems.filter((item: any) => item.price <= maxPrice)
            console.log(`[Agent] 🔍 Filtered to items with price <= $${maxPrice / 100}: ${filteredItems.length} items`)
          }
          
          if (cryptoAISDK.provider === 'gemini') {
            // Limit response size for Gemini (may have token limits)
            // Keep first 10 items to avoid exceeding limits
            const limitedItems = filteredItems.slice(0, 10)
            console.log(`[Agent] 📦 Limiting tool response to ${limitedItems.length} items (from ${filteredItems.length})`)
            
            // Gemini function response format: response data goes directly, not nested in "response"
            toolResults.push({
              functionName: toolCall.function.name,
              response: limitedItems,
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
        // Gemini format: functionResponse needs name and response as Struct (object)
        // For arrays, pass the array directly. For objects, pass the object directly.
        for (const tr of toolResults) {
          contents.push({
            role: 'function',
            parts: [{
              functionResponse: {
                name: tr.functionName,
                response: tr.response, // Pass object/array directly, not stringified
              },
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

      console.log('[Agent] 📡 Making second API call with tool results...')
      console.log('[Agent] Tool results count:', toolResults.length)
      
      const secondResponse = await fetch(secondEndpoint, {
        method: 'POST',
        headers: secondHeaders,
        body: JSON.stringify(secondRequestBody),
      })

      if (!secondResponse.ok) {
        const errorText = await secondResponse.text()
        console.error('[Agent] ❌ Second API call failed:', secondResponse.status, errorText)
        console.error('[Agent] Request body size:', JSON.stringify(secondRequestBody).length, 'bytes')
        throw new Error(`AI API error: ${secondResponse.statusText} - ${errorText.substring(0, 200)}`)
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
          toolResult = toolResults[0]?.response
        } else {
          toolResult = JSON.parse(toolResults[0]?.content || 'null')
        }
        
        // Check if user is confirming a purchase
        const lowerMessage = message.toLowerCase()
        const purchaseConfirmations = ['yes', 'proceed', 'buy', 'purchase', 'confirm', 'ok', 'sure', 'go ahead', 'do it']
        const isPurchaseConfirmation = purchaseConfirmations.some(conf => lowerMessage.includes(conf))
        
        // If user confirmed purchase and we have a single item from findCard
        if (isPurchaseConfirmation && toolResult && !Array.isArray(toolResult) && toolResult.id) {
          // Single item from findCard - create purchase intent
          const item = toolResult
          const amountInCents = item.price
          // Convert price (in cents) to USDC base units (6 decimals)
          // $50 = 5000 cents → (5000/100) * 1,000,000 = 50,000,000 base units
          const amountInBaseUnits = Math.floor((amountInCents / 100) * 1_000_000).toString()
          
          console.log('[Agent] 🛒 Creating purchase intent for:', item.name, `$${(amountInCents / 100).toFixed(2)}`)
          
          return {
            reasoning: 'User confirmed purchase of gift card found via findCard.',
            intent: 'purchase',
            purchaseIntent: {
              brand: item.brand,
              amount: amountInBaseUnits,
              currency: 'USDC',
              description: `${item.name} - $${(amountInCents / 100).toFixed(2)} USD`,
              metadata: {
                giftCardItemId: item.id,
                giftCardItemName: item.name,
                giftCardPrice: amountInCents,
                giftCardCurrency: item.currency || 'USD',
                brand: item.brand,
              },
            },
            message: `Great! I found a ${item.name} for $${(amountInCents / 100).toFixed(2)}. Ready to proceed with payment?`,
            confidence: 0.9,
          }
        }
        
        if (toolResult && Array.isArray(toolResult) && toolResult.length > 0) {
          // User asked about items - return query response
          const itemsList = toolResult
            .slice(0, 10)
            .map((item: any) => `- ${item.name}: $${(item.price / 100).toFixed(2)}`)
            .join('\n')
          
          return {
            reasoning: 'User asked to see available gift cards. Retrieved catalog from database.',
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
    
    // Check if this is a purchase confirmation without tool calls
    // This can happen if user confirms after we already found a card in previous messages
    const lowerMessage = message.toLowerCase()
    const purchaseConfirmations = ['yes', 'proceed', 'buy', 'purchase', 'confirm', 'ok', 'sure', 'go ahead', 'do it']
    const isPurchaseConfirmation = purchaseConfirmations.some(conf => lowerMessage.includes(conf))
    
    // Try to find the card from previous messages context
    if (isPurchaseConfirmation && previousMessages.length > 0) {
      // Look for brand mentions in recent messages
      const recentMessages = previousMessages.slice(-3).map(m => m.content).join(' ')
      const brands = ['amazon', 'steam', 'roblox', 'starbucks', 'netflix', 'spotify', 'uber', 'apple', 'xbox', 'playstation']
      let foundBrand: string | undefined
      
      for (const brand of brands) {
        if (recentMessages.toLowerCase().includes(brand)) {
          foundBrand = brand
          break
        }
      }
      
      if (foundBrand) {
        // Try to find the card
        const { findCard } = await import('./tools')
        const giftCardItem = await findCard(foundBrand)
        
        if (giftCardItem) {
          const amountInCents = giftCardItem.price
          // Convert price (in cents) to USDC base units (6 decimals)
          const amountInBaseUnits = Math.floor((amountInCents / 100) * 1_000_000).toString()
          
          console.log('[Agent] 🛒 Creating purchase intent from confirmation:', giftCardItem.name)
          
          return {
            reasoning: 'User confirmed purchase after card was found in previous conversation.',
            intent: 'purchase',
            purchaseIntent: {
              brand: giftCardItem.brand,
              amount: amountInBaseUnits,
              currency: 'USDC',
              description: `${giftCardItem.name} - $${(amountInCents / 100).toFixed(2)} USD`,
              metadata: {
                giftCardItemId: giftCardItem.id,
                giftCardItemName: giftCardItem.name,
                giftCardPrice: amountInCents,
                giftCardCurrency: giftCardItem.currency || 'USD',
                brand: giftCardItem.brand,
              },
            },
            message: `Perfect! Ready to purchase ${giftCardItem.name} for $${(amountInCents / 100).toFixed(2)}. Click the button below to proceed with payment.`,
            confidence: 0.9,
          }
        }
      }
    }
    
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
    
    // Check if it's a rate limit error
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      console.warn('[Agent] ⚠️ Rate limit exceeded - using fallback processing')
    } else {
      console.warn('[Agent] ⚠️ Falling back to rule-based processing')
    }
    
    // Fallback to rule-based processing
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
      reasoning: 'User asked to see available gift cards. Retrieved catalog from database.',
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

  // Find card in database
  const { findCard } = await import('./tools')
  const giftCardItem = await findCard(brand)

  if (!giftCardItem) {
    return {
      reasoning: `No matching gift card found for ${brand}.`,
      intent: 'error',
      message: `Sorry, I couldn't find a ${brand} gift card. Available brands include Steam, Amazon, Roblox, and Starbucks.`,
      confidence: 0.8,
    }
  }

  // Convert price to USDC base units
  const usdcAmount = Math.floor((giftCardItem.price / 100) * 1_000_000).toString()

  return {
    reasoning: `Found ${giftCardItem.name} for $${(giftCardItem.price / 100).toFixed(2)}. Converting to USDC and preparing x402 challenge.`,
    intent: 'purchase',
    purchaseIntent: {
      brand: giftCardItem.name,
      amount: usdcAmount,
      currency: 'USDC',
      description: `${giftCardItem.name} - $${(giftCardItem.price / 100).toFixed(2)} ${giftCardItem.currency}`,
      metadata: {
        giftCardItemId: giftCardItem.id,
        giftCardItemName: giftCardItem.name,
        giftCardPrice: giftCardItem.price,
        giftCardCurrency: giftCardItem.currency,
        requestedBy: userAddress,
      },
    },
    message: `Perfect! I found a ${giftCardItem.name} for $${(giftCardItem.price / 100).toFixed(2)}. I'll verify your policy on-chain, then request an x402 payment authorization.`,
    confidence: 0.95,
  }
}
