import { createThirdwebClient } from "thirdweb";

let clientInstance: ReturnType<typeof createThirdwebClient> | null = null;

export default function getClient() {
  if (clientInstance) {
    return clientInstance;
  }
  
  try {
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    
    if (!clientId) {
      clientInstance = createThirdwebClient({
        clientId: "demo-client-id",
      });
    } else {
      clientInstance = createThirdwebClient({
        clientId: clientId,
      });
    }
  } catch (error) {
    console.warn("Failed to create thirdweb client during build, using fallback:", error);
    clientInstance = createThirdwebClient({
      clientId: "demo-client-id",
    });
  }
  
  return clientInstance;
}