import { textOnly } from "@lens-protocol/metadata";
import { SessionData } from "@/lib/ai/config";

export function createLensPostMetadata(sessionData: SessionData, aiAnalysis: string) {
  const content = `Just completed a ${sessionData.patternName} session on Breath Flow Vision!\n\n` +
                  `Duration: ${Math.round(sessionData.sessionDuration / 60)} min ${Math.round(sessionData.sessionDuration % 60)} sec\n` +
                  `Breath Hold: ${sessionData.breathHoldTime} sec\n` +
                  `Restlessness: ${sessionData.restlessnessScore}/100\n\n` +
                  `AI Feedback: ${aiAnalysis}\n\n` +
                  `#ImperfectBreath #FlowBlockchain #LensProtocol #Breathing`;

  return textOnly({
    content,
    // You can add other metadata fields here if needed, e.g., tags, app ID
  });
}
