declare module "@yudiel/react-qr-scanner" {
  import type { CSSProperties } from "react";

  export type ScanResult = { rawValue: string };

  export function Scanner(props: {
    onScan?: (codes: ScanResult[]) => void;
    onError?: (error: unknown) => void;
    constraints?: MediaTrackConstraints;
    scanDelay?: number;
    styles?: {
      container?: CSSProperties;
      video?: CSSProperties;
    };
  }): JSX.Element;
}
