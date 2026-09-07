export interface DeliveryArchitectureClosureOutputRef {
  readonly artifact: string;
  readonly contentSha256: string;
  readonly bytes: number;
}

export interface DeliveryArchitectureFinalizationClosureRecord {
  readonly architectureFinalizationRef: string;
  readonly verifiedCandidateRef: string;
  readonly fullTestExecutionRef: string;
  readonly outputs: {
    readonly actualArchitectureRef: DeliveryArchitectureClosureOutputRef;
    readonly currentToActualCompareRef: DeliveryArchitectureClosureOutputRef;
    readonly plannedToActualCompareRef: DeliveryArchitectureClosureOutputRef;
    readonly workflowRef: DeliveryArchitectureClosureOutputRef;
    readonly lifecycleRef: DeliveryArchitectureClosureOutputRef;
    readonly dataFlowRef: DeliveryArchitectureClosureOutputRef;
  };
  readonly architectureMaterializedCandidateRef: string;
}
