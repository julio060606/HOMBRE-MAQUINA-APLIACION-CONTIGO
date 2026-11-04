declare const figma: PluginAPI;
declare const CAPTURE_ASSETS: Array<{ id: string; group: 'before' | 'current'; name: string; file: string; base64: string; width: number; height: number; sha256: string; url: string }>;
declare const PACKAGE_METADATA: { generatedAt: string; sourceHashes: Record<string, string>; captureTimestamp: string; currentMode: string };
