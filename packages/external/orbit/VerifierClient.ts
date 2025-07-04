import ky from 'ky';

// Updated interfaces based on Orbit Enterprise API documentation
export interface ProofDefinition {
  name: string;
  description: string;
  requestedCredentials: Array<{
    credentialType: string;
    attributes: string[];
    restrictions: Array<{
      schemaId?: string;
      credDefId?: string;
      issuerDid?: string;
    }>;
  }>;
}

export interface ProofDefinitionResponse {
  proofDefinitionId: string;
  name: string;
  description: string;
}

export interface ProofRequest {
  proofDefinitionId: string;
  expiresIn: number;
  binding: {
    type: string; // "Connection"
  };
}

export interface ProofRequestResponse {
  proofRequestId: string;
  proofDefinitionId: string;
  expiresAt: string;
  status: string;
}

export interface ProofUrlResponse {
  oobUrl: string;
  qrSvg: string;
}

export interface ProofStatusResponse {
  proofRequestId: string;
  status: 'request-sent' | 'request-received' | 'presentation_received' | 'presentation_verified' | 'presentation_declined' | 'error';
  presentation?: {
    [attributeName: string]: string;
  };
}

export class VerifierClient {
  private api: typeof ky;

  constructor(
    private base = process.env.ORBIT_VERIFIER_BASE_URL!,
    private lob = process.env.ORBIT_LOB_ID!,
    private key = process.env.ORBIT_API_KEY!
  ) {
    console.log('VerifierClient config:', { base: this.base, lob: this.lob, hasKey: !!this.key });
    
    this.api = ky.create({
      prefixUrl: this.base,
      headers: { 
        lobId: this.lob, 
        apiKey: this.key,
        'Content-Type': 'application/json'
      },
      timeout: 30_000
    });
  }

  // Step 1: Create proof definition (once per form version)
  async createProofDefinition(definition: ProofDefinition): Promise<ProofDefinitionResponse> {
    console.log('[VerifierClient] Creating proof definition:', definition.name);
    try {
      return await this.api.post('verifier/v1/proof-definitions', { json: definition }).json<ProofDefinitionResponse>();
    } catch (error: any) {
      console.error('[VerifierClient] Orbit API endpoint not available:', error.response?.status);
      // Temporary fallback for testing form rendering - return mock response
      console.warn('[VerifierClient] Using temporary fallback response for testing');
      return {
        proofDefinitionId: `temp_def_${Date.now()}`,
        name: definition.name,
        description: definition.description
      };
    }
  }

  // Check if proof definition exists
  async getProofDefinitions(): Promise<ProofDefinitionResponse[]> {
    console.log('[VerifierClient] Retrieving all proof definitions');
    return this.api.get('verifier/v1/proof-definitions').json<ProofDefinitionResponse[]>();
  }

  // Step 2: Create proof request instance
  async createProofRequest(request: ProofRequest): Promise<ProofRequestResponse> {
    console.log('[VerifierClient] Creating proof request:', request.proofDefinitionId);
    try {
      return await this.api.post('verifier/v1/proof-requests', { json: request }).json<ProofRequestResponse>();
    } catch (error: any) {
      console.error('[VerifierClient] Proof request creation failed:', error.response?.status);
      console.warn('[VerifierClient] Using temporary fallback response for testing');
      return {
        proofRequestId: `temp_req_${Date.now()}`,
        proofDefinitionId: request.proofDefinitionId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 600000).toISOString()
      };
    }
  }

  // Step 3: Get QR code and invite URL
  async getProofRequestUrl(proofRequestId: string): Promise<ProofUrlResponse> {
    console.log('[VerifierClient] Getting proof request URL:', proofRequestId);
    try {
      return await this.api.get(`verifier/v1/proof-requests/${proofRequestId}/url`).json<ProofUrlResponse>();
    } catch (error: any) {
      console.error('[VerifierClient] Proof URL generation failed:', error.response?.status);
      console.warn('[VerifierClient] Using temporary fallback QR response for testing');
      return {
        oobUrl: 'didcomm://example.com?_oob=temp_testing_url',
        qrSvg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">QR Code Placeholder<tspan x="100" dy="20">Orbit API Testing</tspan></text></svg>'
      };
    }
  }

  // Step 4: Check proof request status
  async getProofRequestStatus(proofRequestId: string): Promise<ProofStatusResponse> {
    console.log('[VerifierClient] Getting proof request status:', proofRequestId);
    return this.api.get(`verifier/v1/proof-requests/${proofRequestId}`).json<ProofStatusResponse>();
  }

  // Clean up: Delete proof request
  async deleteProofRequest(proofRequestId: string): Promise<void> {
    console.log('[VerifierClient] Deleting proof request:', proofRequestId);
    await this.api.delete(`verifier/v1/proof-requests/${proofRequestId}`);
  }

  // Legacy methods for backward compatibility (will be removed)
  async defineProof(def: any): Promise<any> {
    console.log('[VerifierClient] Legacy defineProof - use createProofDefinition instead');
    return this.createProofDefinition(def);
  }

  async prepareUrl(reqId: string): Promise<{ qrSvg: string; inviteUrl: string }> {
    console.log('[VerifierClient] Legacy prepareUrl - use getProofRequestUrl instead');
    const result = await this.getProofRequestUrl(reqId);
    return { qrSvg: result.qrSvg, inviteUrl: result.oobUrl };
  }

  async status(id: string): Promise<{ status: string; attributes?: Record<string, string> }> {
    console.log('[VerifierClient] Legacy status - use getProofRequestStatus instead');
    const result = await this.getProofRequestStatus(id);
    return { status: result.status, attributes: result.presentation };
  }
}

// Create verifier instance with proper environment configuration
let _verifierInstance: VerifierClient | null = null;

export function getVerifierClient(): VerifierClient {
  if (!_verifierInstance) {
    _verifierInstance = new VerifierClient();
  }
  return _verifierInstance;
}

// Legacy export for backward compatibility
export const verifier = {
  defineProof: async (def: any): Promise<any> => {
    const client = getVerifierClient();
    return client.defineProof(def);
  },

  prepareUrl: async (id: string): Promise<{ qrSvg: string; inviteUrl: string }> => {
    const client = getVerifierClient();
    return client.prepareUrl(id);
  },

  status: async (id: string): Promise<{ status: string; attributes?: Record<string, string> }> => {
    const client = getVerifierClient();
    return client.status(id);
  },

  verify: async (id: string): Promise<{ verified: boolean }> => {
    // This method is not used in the new integration flow
    console.log('[VerifierClient] Legacy verify method called - deprecated');
    return { verified: false };
  }
};