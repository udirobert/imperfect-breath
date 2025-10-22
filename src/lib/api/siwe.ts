import { config } from '../../config/environment';
import { API_ENDPOINTS } from '../../config/api-endpoints';

export interface SiweChallengeRequest {
  address: string;
  chainId?: number;
  domain?: string;
  uri?: string;
  statement?: string;
}

export interface SiweChallengeResponse {
  message: string;
  nonce: string;
  issuedAt: string;
  chainId: number;
  domain: string;
  uri: string;
}

export interface SiweVerifyRequest {
  message: string;
  signature: string;
}

export interface SiweVerifyResponse {
  ok: boolean;
  address: string;
  nonce: string;
  siweVerified: boolean;
  thirdPartyJwt?: string | null;
}

const baseUrl = config.services.vision.url;

export async function issueSiweChallenge(req: SiweChallengeRequest): Promise<SiweChallengeResponse> {
  const res = await fetch(`${baseUrl}${API_ENDPOINTS.siwe.challenge}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SIWE challenge failed: ${res.status} ${text}`);
  }
  return await res.json();
}

export async function verifySiweSignature(req: SiweVerifyRequest): Promise<SiweVerifyResponse> {
  const res = await fetch(`${baseUrl}${API_ENDPOINTS.siwe.verify}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SIWE verify failed: ${res.status} ${text}`);
  }
  return await res.json();
}