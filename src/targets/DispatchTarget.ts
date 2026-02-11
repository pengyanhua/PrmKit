export interface DispatchTarget {
  readonly id: string;
  readonly label: string;
  send(text: string): Promise<void>;
  isAvailable(): boolean;
}
